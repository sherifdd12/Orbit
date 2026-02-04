"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    Building2,
    Users,
    Trash2,
    Edit
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface Department {
    id: string
    name: string
    name_ar: string
    manager_id: string | null
    parent_id: string | null
    created_at: string
    manager?: { full_name: string }
    employee_count?: number
}

export default function DepartmentsPage() {
    const { dict, locale } = useLanguage()
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [managers, setManagers] = React.useState<{ id: string, full_name: string }[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newDept, setNewDept] = React.useState({ name: '', name_ar: '', manager_id: '', parent_id: '' })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        // Fetch departments and join with profiles for manager name
        const { data: depts, error: deptsError } = await supabase
            .from('departments')
            .select(`
                *,
                manager:profiles(full_name)
            `)
            .order('name')

        // Fetch profiles for manager selection
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').order('full_name')

        if (!deptsError) {
            // Fetch employee count per department
            const { data: counts } = await supabase.rpc('get_dept_employee_counts')
            // fallback if RPC doesn't exist yet, we'll just show 0 or fetch separately

            setDepartments(depts || [])
        }
        if (profiles) setManagers(profiles)
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAdd = async () => {
        if (!newDept.name) return alert("Department Name is required")
        const { error } = await supabase.from('departments').insert([{
            name: newDept.name,
            name_ar: newDept.name_ar,
            manager_id: newDept.manager_id || null,
            parent_id: newDept.parent_id || null
        }])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewDept({ name: '', name_ar: '', manager_id: '', parent_id: '' })
            fetchData()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(dict.common.confirm + "?")) return
        const { error } = await supabase.from('departments').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const filtered = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.name_ar && d.name_ar.includes(searchTerm))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sidebar.departments}</h2>
                    <p className="text-muted-foreground text-sm">Organize your company structure and teams.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> {dict.common.add}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Department</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name (English)</Label>
                                        <Input value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الاسم (العربية)</Label>
                                        <Input value={newDept.name_ar} onChange={e => setNewDept({ ...newDept, name_ar: e.target.value })} dir="rtl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Manager</Label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={newDept.manager_id}
                                        onChange={e => setNewDept({ ...newDept, manager_id: e.target.value })}
                                    >
                                        <option value="">Select Manager</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>{m.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Parent Department</Label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={newDept.parent_id}
                                        onChange={e => setNewDept({ ...newDept, parent_id: e.target.value })}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{locale === 'ar' ? d.name_ar || d.name : d.name}</option>
                                        ))}
                                    </select>
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

            <Card>
                <CardHeader>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={dict.common.search + "..."}
                            className="pl-9"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{dict.common.name}</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>{dict.hr.employees}</TableHead>
                                    <TableHead className="w-[100px]">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">{dict.common.loading}</TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            {dict.common.noData}
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map(dept => (
                                    <TableRow key={dept.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {locale === 'ar' ? dept.name_ar || dept.name : dept.name}
                                                    </div>
                                                    {dept.parent_id && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Sub-department
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {dept.manager?.full_name || 'No Manager'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {dept.employee_count || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="flex gap-2">
                                                        <Edit className="h-4 w-4" /> {dict.common.edit}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex gap-2 text-rose-600" onClick={() => handleDelete(dept.id)}>
                                                        <Trash2 className="h-4 w-4" /> {dict.common.delete}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
