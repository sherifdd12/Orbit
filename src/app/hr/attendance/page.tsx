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
    Download
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
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
                    <Button variant="outline" className="flex gap-2">
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                    <Button className="flex gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> Bulk Upload
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-white to-slate-50 border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">{dict.common.total}</CardDescription>
                        <CardTitle className="text-2xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider text-emerald-600">{dict.hr.present}</CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{stats.present}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider text-amber-600">{dict.hr.late}</CardDescription>
                        <CardTitle className="text-2xl text-amber-700">{stats.late}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50 to-white border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider text-rose-600">{dict.hr.absent}</CardDescription>
                        <CardTitle className="text-2xl text-rose-700">{stats.absent}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

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
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
                                                <span className="text-sm font-medium text-muted-foreground">{dict.common.loading}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarIcon className="h-10 w-10 text-slate-200" />
                                                <p>{dict.common.noData}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map(r => (
                                    <TableRow key={r.id}>
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
        </div>
    )
}
