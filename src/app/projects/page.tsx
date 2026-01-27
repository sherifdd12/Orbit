"use client"

import * as React from "react"
import {
    Plus,
    MoreHorizontal,
    Loader2,
    Download
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export const runtime = 'edge';

interface Project {
    id: string
    title: string
    client_name: string
    description: string
    status: string
    budget: number
    start_date: string
    deadline: string
    customer_id?: string
}

export default function ProjectsPage() {
    const [projects, setProjects] = React.useState<Project[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newProject, setNewProject] = React.useState({
        title: '',
        client_name: '',
        description: '',
        status: 'Planning',
        budget: 0,
        deadline: '',
        customer_id: ''
    })

    const [editingProject, setEditingProject] = React.useState<Project | null>(null)
    const [viewingProject, setViewingProject] = React.useState<Project | null>(null)
    const [customers, setCustomers] = React.useState<{ id: string; name: string }[]>([])

    const supabase = createClient()

    const fetchInitialData = React.useCallback(async () => {
        setLoading(true)
        const [projectsRes, customersRes] = await Promise.all([
            supabase.from('projects').select('*').order('created_at', { ascending: false }),
            supabase.from('customers').select('*').order('name')
        ])

        if (!projectsRes.error) setProjects(projectsRes.data || [])
        if (!customersRes.error) setCustomers(customersRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchInitialData()
    }, [fetchInitialData])

    const handleCreateProject = async () => {
        if (!newProject.title) return alert("Title is required")
        const { error } = await supabase.from('projects').insert([newProject])
        if (error) alert("Error creating project: " + error.message)
        else {
            setIsCreateOpen(false)
            setNewProject({ title: '', client_name: '', description: '', status: 'Planning', budget: 0, deadline: '', customer_id: '' })
            fetchInitialData()
        }
    }

    const handleUpdateProject = async () => {
        if (!editingProject) return
        const { error } = await supabase.from('projects').update(editingProject).eq('id', editingProject.id)
        if (error) alert(error.message)
        else { setEditingProject(null); fetchInitialData() }
    }

    const handleDeleteProject = async (id: string) => {
        if (!confirm("Delete project?")) return
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchInitialData()
    }

    const exportToCSV = () => {
        const headers = ["Title", "Client", "Status", "Budget", "Deadline"]
        const csvRows = projects.map(p => [p.title, p.client_name, p.status, p.budget, p.deadline].join(","))
        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "projects_report.csv")
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
                    <p className="text-muted-foreground text-sm">Track your jobs, timelines, and budgets.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Project</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Title</Label><Input value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} /></div>
                                <div className="space-y-2">
                                    <Label>Customer</Label>
                                    <select className="w-full border rounded p-2" value={newProject.customer_id} onChange={e => setNewProject({ ...newProject, customer_id: e.target.value })}>
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Budget</Label><Input type="number" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })} /></div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select className="w-full border rounded p-2" value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })}>
                                            <option value="Planning">Planning</option>
                                            <option value="Active">Active</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} /></div>
                            </div>
                            <DialogFooter><Button onClick={handleCreateProject}>Create</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                <div className="grid gap-6 md:grid-cols-2">
                    {projects.map(project => (
                        <Card key={project.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{project.title}</CardTitle>
                                    <CardDescription>{project.client_name || 'No Client'}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingProject(project)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteProject(project.id)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between text-sm">
                                    <span>Deadline: {project.deadline || 'N/A'}</span>
                                    <span className="font-semibold text-emerald-600">${project.budget?.toLocaleString()}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="link" size="sm" onClick={() => setViewingProject(project)}>Details</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{viewingProject?.title}</DialogTitle></DialogHeader>
                    {viewingProject && (
                        <div className="space-y-4">
                            <p><strong>Status:</strong> {viewingProject.status}</p>
                            <p><strong>Budget:</strong> ${viewingProject.budget?.toLocaleString()}</p>
                            <p><strong>Description:</strong> {viewingProject.description || 'No description'}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
                    {editingProject && (
                        <div className="grid gap-4 py-4">
                            <Input value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} />
                            <Input type="number" value={editingProject.budget} onChange={e => setEditingProject({ ...editingProject, budget: Number(e.target.value) })} />
                        </div>
                    )}
                    <DialogFooter><Button onClick={handleUpdateProject}>Save</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
