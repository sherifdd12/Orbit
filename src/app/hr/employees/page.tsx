"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    UserCircle,
    Mail,
    Phone,
    Building2,
    Calendar,
    Briefcase,
    Filter,
    Download,
    Edit,
    Trash2
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface Employee {
    id: string
    employee_code: string
    position: string
    employment_status: string
    hire_date: string
    salary: number
    department_id: string | null
    profile_id: string
    profiles: {
        full_name: string
        phone: string | null
        email: string | null
        department: string | null
    }
    departments?: {
        name: string
        name_ar: string
    }
}

export default function EmployeesPage() {
    const { dict, locale } = useLanguage()
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [departments, setDepartments] = React.useState<{ id: string, name: string, name_ar: string }[]>([])
    const [profiles, setProfiles] = React.useState<{ id: string, full_name: string }[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Form state
    const [newEmp, setNewEmp] = React.useState({
        profile_id: '',
        employee_code: `EMP-${Date.now().toString().slice(-4)}`,
        department_id: '',
        position: '',
        employment_status: 'Full-time',
        hire_date: format(new Date(), "yyyy-MM-dd"),
        salary: 0
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [empRes, deptRes, profRes] = await Promise.all([
            supabase.from('employees').select(`
                *,
                profiles:profiles(*),
                departments:departments(name, name_ar)
            `).order('employee_code'),
            supabase.from('departments').select('id, name, name_ar'),
            supabase.from('profiles').select('id, full_name').eq('is_active', true)
        ])

        if (!empRes.error) setEmployees(empRes.data || [])
        if (!deptRes.error) setDepartments(deptRes.data || [])
        if (!profRes.error) setProfiles(profRes.data || [])
        setLoading(false)
    }, [supabase])

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAdd = async () => {
        if (!newEmp.profile_id || !newEmp.position) return alert("Required fields missing")
        const { error } = await supabase.from('employees').insert([{
            ...newEmp,
            department_id: newEmp.department_id || null
        }])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            fetchData()
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'Full-time': 'bg-emerald-100 text-emerald-700',
            'Contract': 'bg-blue-100 text-blue-700',
            'Part-time': 'bg-amber-100 text-amber-700',
            'Resigned': 'bg-rose-100 text-rose-700'
        }
        return <Badge className={`font-medium border-none ${variants[status] || 'bg-slate-100 text-slate-700'}`}>{status}</Badge>
    }

    const filtered = employees.filter(e =>
        e.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.hr.employees}</h2>
                    <p className="text-muted-foreground text-sm">Manage employee records, contracts, and profiles.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleActionPlaceholder('Export')}><Download className="h-4 w-4 mr-2" /> {dict.common.export}</Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> {dict.common.add}</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Register New Employee</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>System User Profile</Label>
                                    <select className="w-full border rounded-md p-2" value={newEmp.profile_id} onChange={e => setNewEmp({ ...newEmp, profile_id: e.target.value })}>
                                        <option value="">Link to User...</option>
                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Employee Code</Label>
                                    <Input value={newEmp.employee_code} onChange={e => setNewEmp({ ...newEmp, employee_code: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Position</Label>
                                    <Input placeholder="e.g. Senior Developer" value={newEmp.position} onChange={e => setNewEmp({ ...newEmp, position: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <select className="w-full border rounded-md p-2" value={newEmp.department_id} onChange={e => setNewEmp({ ...newEmp, department_id: e.target.value })}>
                                        <option value="">None</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{locale === 'ar' ? d.name_ar : d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <select className="w-full border rounded-md p-2" value={newEmp.employment_status} onChange={e => setNewEmp({ ...newEmp, employment_status: e.target.value })}>
                                        <option value="Full-time text-color-emerald">Full-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Part-time">Part-time</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Hire Date</Label>
                                    <Input type="date" value={newEmp.hire_date} onChange={e => setNewEmp({ ...newEmp, hire_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monthly Salary (SAR)</Label>
                                    <Input type="number" value={newEmp.salary} onChange={e => setNewEmp({ ...newEmp, salary: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleAdd}>{dict.common.save}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={dict.common.search + "..."} className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleActionPlaceholder('Filters')}><Filter className="h-4 w-4" /> Filters</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Employee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No employees found.</TableCell></TableRow>
                            ) : filtered.map(e => (
                                <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                                                <UserCircle className="h-10 w-10 text-slate-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{e.profiles.full_name}</span>
                                                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">{e.employee_code}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(e.employment_status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building2 className="h-3.5 w-3.5 opacity-50" />
                                            {locale === 'ar' ? e.departments?.name_ar || e.departments?.name : e.departments?.name || 'Unassigned'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Briefcase className="h-3.5 w-3.5 opacity-50" />
                                            {e.position}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Mail className="h-3 w-3" /> {e.profiles.email || '-'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Phone className="h-3 w-3" /> {e.profiles.phone || '-'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleActionPlaceholder('Edit')} className="gap-2"><Edit className="h-4 w-4" /> Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleActionPlaceholder('Attendance Log')} className="gap-2"><Calendar className="h-4 w-4" /> Attendance Log</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleActionPlaceholder('Terminate')} className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Terminate</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
