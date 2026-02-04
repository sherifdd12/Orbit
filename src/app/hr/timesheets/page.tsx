"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Clock,
    Calendar,
    Briefcase,
    CheckCircle2,
    Filter,
    MoreHorizontal,
    FileText
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface Timesheet {
    id: string
    employee_id: string
    project_id: string | null
    task_id: string | null
    date: string
    hours: number
    description: string | null
    billable: boolean
    created_at: string
    employee?: { full_name: string }
    project?: { name: string }
    task?: { title: string }
}

export default function TimesheetsPage() {
    const { dict, locale } = useLanguage()
    const [timesheets, setTimesheets] = React.useState<Timesheet[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Form lookups
    const [employees, setEmployees] = React.useState<{ id: string, full_name: string }[]>([])
    const [projects, setProjects] = React.useState<{ id: string, name: string }[]>([])

    const [newEntry, setNewEntry] = React.useState({
        employee_id: '',
        project_id: '',
        date: format(new Date(), "yyyy-MM-dd"),
        hours: 8,
        description: '',
        billable: true
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [timesheetRes, empRes, projRes] = await Promise.all([
            supabase.from('timesheets').select(`
                *,
                employee:employees(profile:profiles(full_name)),
                project:projects(name)
            `).order('date', { ascending: false }),
            supabase.from('employees').select('id, profile:profiles(full_name)'),
            supabase.from('projects').select('id, name')
        ])

        if (!timesheetRes.error) {
            const flattened = (timesheetRes.data || []).map((t: any) => ({
                ...t,
                employee: { full_name: t.employee?.profile?.full_name || 'Unknown' },
                project: { name: t.project?.name || 'General' }
            }))

            setTimesheets(flattened)
        }

        if (!empRes.error) setEmployees((empRes.data || []).map((e: any) => ({ id: e.id, full_name: e.profile?.full_name || 'Unknown' })))
        if (!projRes.error) setProjects(projRes.data || [])

        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAdd = async () => {
        if (!newEntry.employee_id || !newEntry.date || !newEntry.hours) return alert("Fields required")
        const { error } = await supabase.from('timesheets').insert([{
            ...newEntry,
            project_id: newEntry.project_id || null
        }])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            fetchData()
        }
    }

    const filtered = timesheets.filter(t =>
        t.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.projects.timesheets}</h2>
                    <p className="text-muted-foreground text-sm">Track working hours and billable activities across projects.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-semibold shadow-lg shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> New Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log Working Hours</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <select className="w-full border rounded-md p-2" value={newEntry.employee_id} onChange={e => setNewEntry({ ...newEntry, employee_id: e.target.value })}>
                                    <option value="">Select Employee</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{dict.common.date}</Label>
                                    <Input type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hours Worked</Label>
                                    <Input type="number" step="0.5" value={newEntry.hours} onChange={e => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Project (Optional)</Label>
                                <select className="w-full border rounded-md p-2" value={newEntry.project_id} onChange={e => setNewEntry({ ...newEntry, project_id: e.target.value })}>
                                    <option value="">General / Non-Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.common.description}</Label>
                                <Input placeholder="Briefly describe what you worked on..." value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd}>{dict.common.save}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-none shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium opacity-90">Total Hours (This Week)</CardTitle>
                        <div className="text-4xl font-bold">342.5</div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs opacity-75">
                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-3/4" />
                            </div>
                            75%
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-widest text-emerald-600">Billable Ratio</CardDescription>
                        <div className="text-3xl font-bold">88.4%</div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-widest text-blue-600">Active Logs</CardDescription>
                        <div className="text-3xl font-bold">{timesheets.length}</div>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader className="border-b bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={dict.common.search + "..."} className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">{dict.common.date}</TableHead>
                                <TableHead>{dict.hr.employees}</TableHead>
                                <TableHead>{dict.sidebar.projects}</TableHead>
                                <TableHead>{dict.common.description}</TableHead>
                                <TableHead className="text-center">Hours</TableHead>
                                <TableHead className="text-right pr-6">Billable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">{dict.common.noData}</TableCell></TableRow>
                            ) : filtered.map(t => (
                                <TableRow key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-mono text-sm">{format(new Date(t.date), "MMM dd, yyyy")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            {t.employee?.full_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal border-slate-200">
                                            <Briefcase className="h-3 w-3" />
                                            {t.project?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                                        {t.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-slate-700">
                                        {t.hours}h
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {t.billable ? (
                                            <div className="flex items-center justify-end gap-1.5 text-blue-600 font-bold text-[10px] uppercase">
                                                <CheckCircle2 className="h-3 w-3" /> YES
                                            </div>
                                        ) : (
                                            <span className="text-[10px] uppercase font-bold text-slate-400">NO</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
