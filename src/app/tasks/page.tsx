"use client"

import * as React from "react"
import {
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    MoreHorizontal,
    Loader2,
    Calendar,
    User,
    Projector,
    Briefcase,
    AlertCircle,
    Flag,
    Filter,
    Search,
    Edit,
    Trash2,
    Layout
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
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface Task {
    id: string
    title: string
    description: string
    status: 'To Do' | 'In Progress' | 'Review' | 'Done'
    priority: 'Low' | 'Medium' | 'High' | 'Critical'
    due_date: string
    project_id?: string
    projects?: {
        title: string
    }
    assignee_id?: string
    profiles?: {
        full_name: string
    }
}

export default function TasksPage() {
    const { dict, locale } = useLanguage()
    const [tasks, setTasks] = React.useState<Task[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingTask, setEditingTask] = React.useState<Task | null>(null)

    const [newTask, setNewTask] = React.useState({
        title: '',
        description: '',
        status: 'To Do' as const,
        priority: 'Medium' as const,
        due_date: '',
        assignee_id: '',
        project_id: ''
    })

    const [users, setUsers] = React.useState<{ id: string; full_name?: string; email?: string }[]>([])
    const [projects, setProjects] = React.useState<{ id: string; title: string }[]>([])

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [tasksRes, usersRes, projectsRes] = await Promise.all([
            supabase.from('tasks').select(`
                *,
                projects:projects(title),
                profiles:profiles(full_name)
            `).order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, full_name, email').order('full_name'),
            supabase.from('projects').select('id, title').order('title')
        ])

        if (!tasksRes.error) setTasks(tasksRes.data || [])
        if (!usersRes.error) setUsers(usersRes.data || [])
        if (!projectsRes.error) setProjects(projectsRes.data || [])

        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAddTask = async () => {
        if (!newTask.title) return alert("Title is required")

        // Prepare data: convert empty strings to null for UUID fields
        const taskToInsert = {
            ...newTask,
            project_id: newTask.project_id === '' ? null : newTask.project_id,
            assignee_id: newTask.assignee_id === '' ? null : newTask.assignee_id
        }

        const { error } = await supabase.from('tasks').insert([taskToInsert])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewTask({ title: '', description: '', status: 'To Do', priority: 'Medium', due_date: '', assignee_id: '', project_id: '' })
            fetchData()
        }
    }

    const handleDeleteTask = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete task "${title}"?`)) return
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleChangePriority = async (task: Task) => {
        const priorities: Task['priority'][] = ['Low', 'Medium', 'High', 'Critical']
        const currentIndex = priorities.indexOf(task.priority)
        const nextPriority = priorities[(currentIndex + 1) % priorities.length]

        const { error } = await supabase
            .from('tasks')
            .update({ priority: nextPriority })
            .eq('id', task.id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleEditTask = async () => {
        if (!editingTask) return
        const { error } = await supabase
            .from('tasks')
            .update({
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                priority: editingTask.priority,
                due_date: editingTask.due_date,
                project_id: editingTask.project_id === '' ? null : editingTask.project_id,
                assignee_id: editingTask.assignee_id === '' ? null : editingTask.assignee_id
            })
            .eq('id', editingTask.id)

        if (error) alert(error.message)
        else {
            setIsEditOpen(false)
            setEditingTask(null)
            fetchData()
        }
    }

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const toggleStatus = async (task: Task) => {
        const nextStatus = task.status === 'Done' ? 'To Do' : 'Done'
        const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id)
        if (!error) fetchData()
    }

    const getPriorityBadge = (p: Task['priority']) => {
        const colors: Record<string, string> = {
            'Low': 'bg-slate-100 text-slate-600',
            'Medium': 'bg-blue-100 text-blue-700',
            'High': 'bg-orange-100 text-orange-700',
            'Critical': 'bg-rose-100 text-rose-700 animate-pulse'
        }
        return <Badge className={`text-[10px] font-bold border-none shadow-sm ${colors[p] || 'bg-slate-100'}`}>{p}</Badge>
    }

    const filtered = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.projects?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Task Performance</h2>
                    <p className="text-slate-500 font-medium">Coordinate deliverables, assign stakeholders, and track operational progress.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-100 border-none h-11 px-6">
                            <Plus className="mr-2 h-4 w-4" /> New Operational Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Define Deliverable</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Task Title</Label>
                                <Input value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Description</Label>
                                <Input value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Project Association</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={newTask.project_id} onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}>
                                    <option value="">None / General</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign Stakeholder</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={newTask.assignee_id} onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>{dict.common.cancel}</Button>
                            <Button onClick={handleAddTask} className="bg-slate-900 text-white font-bold">Initialize Task</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight">Total Tasks</CardDescription>
                        <CardTitle className="text-2xl font-black">{tasks.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-blue-600">Pending</CardDescription>
                        <CardTitle className="text-2xl font-black text-blue-700">{tasks.filter(t => t.status !== 'Done').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-emerald-600">Finalized</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-700">{tasks.filter(t => t.status === 'Done').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-rose-600">Critical Priority</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-700">{tasks.filter(t => t.priority === 'Critical').length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search tasks, project titles, assignees..."
                        className="h-14 pl-12 bg-white border-none shadow-xl text-lg rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-14 px-6 rounded-2xl bg-white border-none shadow-xl font-bold gap-2">
                        <Layout className="h-5 w-5" /> Kanban View
                    </Button>
                    <Button variant="outline" className="h-14 px-6 rounded-2xl bg-white border-none shadow-xl font-bold gap-2">
                        <Filter className="h-5 w-5" /> Filters
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-slate-300" /></div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((task) => (
                        <Card key={task.id} className="border-none shadow-sm hover:shadow-xl hover:scale-[1.005] transition-all duration-300 group overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <div className="flex items-center p-4 gap-6">
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-slate-100 group-hover:border-primary/20 transition-all shrink-0"
                                    >
                                        {task.status === 'Done' ? (
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-slate-200 group-hover:text-primary transition-colors" />
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0 py-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-lg font-bold tracking-tight ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                                {task.title}
                                            </h3>
                                            {getPriorityBadge(task.priority)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
                                            {task.projects?.title && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                                                    <Briefcase className="h-3 w-3" /> {task.projects.title}
                                                </div>
                                            )}
                                            {task.profiles?.full_name && (
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <User className="h-3 w-3" /> Assigned to {task.profiles.full_name}
                                                </div>
                                            )}
                                            {task.due_date && (
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <Calendar className="h-3 w-3" /> {format(new Date(task.due_date), "MMM dd, yyyy")}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pr-2">
                                        <div className="hidden md:block text-right">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-400 border-slate-100">
                                                {task.status}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-5 w-5" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none">
                                                <DropdownMenuLabel className="uppercase text-[10px] tracking-widest text-slate-400">Deliverable Control</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingTask(task)
                                                    setIsEditOpen(true)
                                                }} className="gap-2 p-3"><Edit className="h-4 w-4" /> Comprehensive Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleChangePriority(task)} className="gap-2 p-3"><Flag className="h-4 w-4" /> Change Priority</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteTask(task.id, task.title)} className="gap-2 p-3 text-rose-600"><Trash2 className="h-4 w-4" /> Delete Task</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                {task.priority === 'Critical' && task.status !== 'Done' && (
                                    <div className="h-1 bg-gradient-to-r from-rose-500 to-transparent w-full" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-40 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <AlertCircle className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400 leading-relaxed">System clear. <br /> No active tasks matching your filter.</h3>
                        </div>
                    )}
                </div>
            )}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Edit Deliverable</DialogTitle></DialogHeader>
                    {editingTask && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Task Title</Label>
                                <Input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Description</Label>
                                <Input value={editingTask.description} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Project Association</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={editingTask.project_id || ''} onChange={e => setEditingTask({ ...editingTask, project_id: e.target.value })}>
                                    <option value="">None / General</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign Stakeholder</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={editingTask.assignee_id || ''} onChange={e => setEditingTask({ ...editingTask, assignee_id: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <select className="w-full border rounded-md h-10 px-3 bg-white" value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={editingTask.due_date} onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)}>{dict.common.cancel}</Button>
                        <Button onClick={handleEditTask} className="bg-slate-900 text-white font-bold">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
