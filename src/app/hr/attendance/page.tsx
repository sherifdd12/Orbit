"use client"

import * as React from "react"
import {
    Calendar as CalendarIcon,
    Search,
    Clock,
    UserCircle,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRightLeft,
    Download,
    ShieldAlert,
    TrendingUp,
    RefreshCw,
    ExternalLink
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface AttendanceRecord {
    id: string
    employee_id: string
    date: string
    check_in: string | null
    check_out: string | null
    status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday'
    notes: string | null
    employee?: {
        full_name: string
        position: string
        department?: { name: string }
    }
}

export default function AttendancePage() {
    const { dict, locale } = useLanguage()
    const [records, setRecords] = React.useState<AttendanceRecord[]>([])
    const [loading, setLoading] = React.useState(true)
    const [dateFilter, setDateFilter] = React.useState(format(new Date(), "yyyy-MM-dd"))
    const [searchTerm, setSearchTerm] = React.useState("")
    const [syncing, setSyncing] = React.useState(false)
    const router = useRouter()

    // Stats
    const stats = {
        present: records.filter(r => r.status === 'Present' || r.status === 'Late').length,
        late: records.filter(r => r.status === 'Late').length,
        absent: records.filter(r => r.status === 'Absent').length,
        total: records.length
    }

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                employee:employees(
                    id,
                    position,
                    profile:profiles(full_name)
                )
            `)
            .eq('date', dateFilter)
            .order('check_in', { ascending: true })

        if (!error) {
            // Flatten the employee data for easier access
            const flattened = (data || []).map((r: any) => ({
                ...r,
                employee: {
                    full_name: r.employee?.profile?.full_name || 'Unknown',
                    position: r.employee?.position || 'N/A'
                }
            }))
            setRecords(flattened)
        }
        setLoading(false)
    }, [supabase, dateFilter])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSync = async () => {
        setSyncing(true)
        const queue = JSON.parse(localStorage.getItem('attendance_sync_queue') || '[]')
        if (queue.length === 0) {
            alert("No offline logs to sync.")
            setSyncing(false)
            return
        }

        const { error } = await supabase.from('attendance').upsert(queue.map((q: any) => {
            const { timestamp, ...rest } = q
            return rest
        }), { onConflict: 'employee_id,date' })

        if (!error) {
            localStorage.removeItem('attendance_sync_queue')
            alert(`Successfully synced ${queue.length} records.`)
            fetchData()
        } else {
            alert("Sync failed: " + error.message)
        }
        setSyncing(false)
    }

    const getStatusBadge = (status: AttendanceRecord['status']) => {
        switch (status) {
            case 'Present': return <Badge variant="default" className="bg-emerald-100 text-emerald-700">{dict.hr.present}</Badge>
            case 'Late': return <Badge variant="destructive" className="bg-amber-100 text-amber-700">{dict.hr.late}</Badge>
            case 'Leave': return <Badge variant="secondary">{dict.hr.onLeave}</Badge>
            case 'Absent': return <Badge variant="destructive">{dict.hr.absent}</Badge>
            case 'Holiday': return <Badge variant="outline">Holiday</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = records.filter(r =>
        r.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sidebar.attendance}</h2>
                    <p className="text-muted-foreground text-sm">Monitor daily clock-ins and attendance logs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex gap-2" onClick={() => router.push('/hr/attendance/clock')}>
                        <ExternalLink className="h-4 w-4" /> {dict.hr.secureClockIn}
                    </Button>
                    <Button variant="outline" className="flex gap-2" onClick={handleSync}>
                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {dict.hr.syncLogs}
                    </Button>
                    <Button variant="outline" className="flex gap-2">
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-white to-slate-50 border-none shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-slate-500">{dict.common.total}</CardDescription>
                        <CardTitle className="text-3xl font-black">{stats.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={92} className="h-1 bg-slate-100" />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-none shadow-sm ring-1 ring-emerald-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-emerald-600">{dict.hr.present}</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-700">{stats.present}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <TrendingUp className="h-3 w-3" /> 4% Increase
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-none shadow-sm ring-1 ring-amber-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-amber-600">{dict.hr.late}</CardDescription>
                        <CardTitle className="text-3xl font-black text-amber-700">{stats.late}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <AlertCircle className="h-3 w-3" /> {dict.hr.violationAlerts}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50 to-white border-none shadow-sm ring-1 ring-rose-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black tracking-widest text-rose-600">{dict.hr.absent}</CardDescription>
                        <CardTitle className="text-3xl font-black text-rose-700">{stats.absent}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-1 w-full bg-rose-100 rounded-full" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="logs" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl mb-4">
                    <TabsTrigger value="logs" className="rounded-lg px-6 font-bold">{dict.sidebar.attendance}</TabsTrigger>
                    <TabsTrigger value="violations" className="rounded-lg px-6 font-bold text-rose-600">{dict.hr.violationAlerts}</TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-lg px-6 font-bold">{dict.hr.performanceInsights}</TabsTrigger>
                </TabsList>

                <TabsContent value="logs">

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={dict.common.search + "..."}
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label className="whitespace-nowrap">{dict.common.date}:</Label>
                                        <Input
                                            type="date"
                                            value={dateFilter}
                                            onChange={e => setDateFilter(e.target.value)}
                                            className="w-44"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>{dict.hr.employees}</TableHead>
                                            <TableHead className="text-center">{dict.hr.checkIn}</TableHead>
                                            <TableHead className="text-center">{dict.hr.checkOut}</TableHead>
                                            <TableHead>{dict.common.status}</TableHead>
                                            <TableHead>{dict.common.notes}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
                                                        <span className="text-sm font-medium text-muted-foreground">{dict.common.loading}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filtered.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CalendarIcon className="h-10 w-10 text-slate-200" />
                                                        <p>{dict.common.noData}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filtered.map((r, idx) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <UserCircle className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{r.employee?.full_name}</div>
                                                            <div className="text-[10px] text-muted-foreground uppercase">{r.employee?.position}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {r.check_in ? (
                                                        <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                                                            <CheckCircle2 className="h-3 w-3" /> {r.check_in}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">--:--</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {r.check_out ? (
                                                        <div className="flex items-center justify-center gap-1.5 text-blue-600">
                                                            <Clock className="h-3 w-3" /> {r.check_out}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">--:--</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(r.status)}
                                                </TableCell>
                                                <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground italic">
                                                    {r.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="violations">
                    <Card className="border-rose-100 bg-rose-50/10">
                        <CardHeader>
                            <CardTitle className="text-rose-700 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5" /> {locale === 'ar' ? 'تم اكتشاف انتهاكات أمنية' : 'Security Violations Detected'}
                            </CardTitle>
                            <CardDescription>{locale === 'ar' ? 'فشل التحقق من الجدار الجغرافي والقياسات الحيوية في الوقت الفعلي.' : 'Real-time geofence and biometric verification failures.'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {records.filter(r => (r as any).is_within_radius === false).map(v => (
                                    <div key={v.id} className="p-4 rounded-xl bg-white border border-rose-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{v.employee?.full_name}</div>
                                                <div className="text-xs text-rose-600">
                                                    {locale === 'ar' ? `انتهاك الموقع: ${(v as any).distance_meters} م خارج النطاق` : `Geofence Violation: ${(v as any).distance_meters}m outside radius`}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="destructive">Violation</Badge>
                                    </div>
                                ))}
                                {records.filter(r => (r as any).is_within_radius === false).length === 0 && (
                                    <div className="text-center py-10 text-slate-400 font-medium">
                                        {locale === 'ar' ? 'لا توجد انتهاكات أمنية مسجلة اليوم.' : 'No security violations recorded today.'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="insights">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>{locale === 'ar' ? 'الأكثر انضباطاً' : 'Top Punctuality'}</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {records.slice(0, 3).map(r => (
                                        <div key={r.id} className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{r.employee?.full_name}</span>
                                            <Badge className="bg-emerald-50 text-emerald-700 border-none">100% On-Time</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>{locale === 'ar' ? 'توجهات الحضور' : 'Attendance Trends'}</CardTitle></CardHeader>
                            <CardContent className="h-40 flex items-end gap-2 justify-between px-4">
                                {[40, 70, 45, 90, 65, 80, 85].map((h, i) => (
                                    <div key={i} className="w-full bg-indigo-100 rounded-t-sm relative group cursor-pointer" style={{ height: `${h}%` }}>
                                        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
