"use client"

import * as React from "react"
import {
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    MoreHorizontal,
    Loader2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

export const runtime = 'edge';

interface Task {
    id: string
    title: string
    description: string
    status: string
    due_date: string
}

export default function TasksPage() {
    const [tasks, setTasks] = React.useState<Task[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newTask, setNewTask] = React.useState({
        title: '',
        description: '',
        status: 'Todo',
        due_date: '',
        assignee_id: '',
        project_id: ''
    })
    const [users, setUsers] = React.useState<{ id: string; full_name?: string; email?: string }[]>([])
    const [projects, setProjects] = React.useState<{ id: string; title: string }[]>([])

    const supabase = createClient()

    const fetchInitialData = React.useCallback(async () => {
        setLoading(true)
        const [tasksRes, usersRes, projectsRes] = await Promise.all([
            supabase.from('tasks').select('*').order('created_at', { ascending: false }),
            supabase.from('profiles').select('*').order('full_name'),
            supabase.from('projects').select('*').order('title')
        ])

        if (tasksRes.error) console.error('Error fetching tasks:', tasksRes.error)
        else setTasks(tasksRes.data || [])

        if (usersRes.error) console.error('Error fetching users:', usersRes.error)
        else setUsers(usersRes.data || [])

        if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error)
        else setProjects(projectsRes.data || [])

        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchInitialData()
    }, [fetchInitialData])

    const handleAddTask = async () => {
        if (!newTask.title) return alert("Title is required")

        const { error } = await supabase.from('tasks').insert([newTask])

        if (error) {
            alert("Error adding task: " + error.message)
        } else {
            setIsAddOpen(false)
            setNewTask({
                title: '',
                description: '',
                status: 'Todo',
                due_date: '',
                assignee_id: '',
                project_id: ''
            })
            fetchInitialData() // Changed from fetchTasks() to fetchInitialData() to refresh all data
        }
    }

    const toggleStatus = async (task: Task) => {
        const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed'
        const { error } = await supabase
            .from('tasks')
            .update({ status: nextStatus })
            .eq('id', task.id)

        if (error) alert(error.message)
        else fetchInitialData()
    }

    const deleteTask = async (id: string) => {
        if (!confirm("Delete task?")) return
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchInitialData()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage implementation steps and daily activities.
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Task</DialogTitle>
                            <DialogDescription>Add a new task to the list.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newTask.project_id}
                                    onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
                                >
                                    <option value="">None</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign To</Label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newTask.assignee_id}
                                    onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddTask}>Add Task</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                                <button onClick={() => toggleStatus(task)}>
                                    {task.status === 'Completed' ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${task.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {task.due_date && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {task.due_date}
                                        </Badge>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-rose-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {tasks.length === 0 && (
                        <div className="text-center p-12 text-muted-foreground">
                            No tasks found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
