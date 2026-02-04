"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Calendar,
    UserCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    MoreVertical
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

interface LeaveRequest {
    id: string
    employee_id: string
    leave_type: 'Annual' | 'Sick' | 'Unpaid' | 'Maternity' | 'Other'
    start_date: string
    end_date: string
    days_count: number
    reason: string | null
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
    created_at: string
    employee?: {
        full_name: string
        department?: { name: string }
    }
}

export default function LeaveRequestsPage() {
    const { dict, locale } = useLanguage()
    const [requests, setRequests] = React.useState<LeaveRequest[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Form state
    const [employees, setEmployees] = React.useState<{ id: string, full_name: string }[]>([])
    const [newRequest, setNewRequest] = React.useState({
        employee_id: '',
        leave_type: 'Annual',
        start_date: '',
        end_date: '',
        reason: ''
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [leaveRes, empRes] = await Promise.all([
            supabase.from('leave_requests').select(`
                *,
                employee:employees(
                    id,
                    profile:profiles(full_name)
                )
            `).order('created_at', { ascending: false }),
            supabase.from('employees').select('id, profile:profiles(full_name)')
        ])

        if (!leaveRes.error) {
            const flattened = (leaveRes.data || []).map((r: any) => ({
                ...r,
                employee: {
                    full_name: r.employee?.profile?.full_name || 'Unknown'
                }
            }))
            setRequests(flattened)
        }

        if (!empRes.error) {
            setEmployees((empRes.data || []).map((e: any) => ({
                id: e.id,
                full_name: e.profile?.full_name || 'Unknown'
            })))
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleStatusUpdate = async (id: string, newStatus: LeaveRequest['status']) => {
        const { error } = await supabase
            .from('leave_requests')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleAdd = async () => {
        if (!newRequest.employee_id || !newRequest.start_date || !newRequest.end_date) {
            return alert("All fields are required")
        }

        const start = new Date(newRequest.start_date)
        const end = new Date(newRequest.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1

        const { error } = await supabase.from('leave_requests').insert([{
            ...newRequest,
            days_count: days,
            status: 'Pending'
        }])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewRequest({ employee_id: '', leave_type: 'Annual', start_date: '', end_date: '', reason: '' })
            fetchData()
        }
    }

    const getStatusBadge = (status: LeaveRequest['status']) => {
        switch (status) {
            case 'Approved': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{dict.hr.approved}</Badge>
            case 'Pending': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">{dict.purchasing.pending}</Badge>
            case 'Rejected': return <Badge variant="destructive">{dict.hr.rejected}</Badge>
            case 'Cancelled': return <Badge variant="secondary">{dict.finance.cancelled}</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = requests.filter(r =>
        r.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.hr.leaveRequests}</h2>
                    <p className="text-muted-foreground text-sm">Manage and track employee absence and time-off.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex gap-2">
                            <Plus className="h-4 w-4" /> {dict.hr.requestLeave}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Leave Request</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Employee</Label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={newRequest.employee_id}
                                    onChange={e => setNewRequest({ ...newRequest, employee_id: e.target.value })}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.hr.leaveType}</Label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={newRequest.leave_type}
                                    onChange={e => setNewRequest({ ...newRequest, leave_type: e.target.value as any })}
                                >
                                    <option value="Annual">{dict.hr.annual}</option>
                                    <option value="Sick">{dict.hr.sick}</option>
                                    <option value="Unpaid">{dict.hr.unpaid}</option>
                                    <option value="Maternity">{dict.hr.maternity}</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={newRequest.start_date} onChange={e => setNewRequest({ ...newRequest, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input type="date" value={newRequest.end_date} onChange={e => setNewRequest({ ...newRequest, end_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input value={newRequest.reason} onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{dict.common.cancel}</Button>
                            <Button onClick={handleAdd}>{dict.common.submit}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + "..."}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">{dict.hr.employees}</TableHead>
                                    <TableHead>{dict.hr.leaveType}</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Days</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">{dict.common.noData}</TableCell></TableRow>
                                ) : filtered.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {r.employee?.full_name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{r.employee?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${r.leave_type === 'Annual' ? 'bg-blue-500' :
                                                        r.leave_type === 'Sick' ? 'bg-rose-500' : 'bg-slate-400'
                                                    }`} />
                                                {r.leave_type}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                {format(new Date(r.start_date), "MMM d, yyyy")}
                                                <ArrowRight />
                                                {format(new Date(r.end_date), "MMM d, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>{r.days_count}</TableCell>
                                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            {r.status === 'Pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleStatusUpdate(r.id, 'Approved')}>
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleStatusUpdate(r.id, 'Rejected')}>
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Processed</div>
                                            )}
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

function ArrowRight() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
    )
}
