"use client"

import * as React from "react"
import {
    Plus,
    MoreHorizontal,
    Calendar,
    Target,
    Users,
    Clock,
    ExternalLink,
    Loader2
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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

interface Project {
    id: string
    title: string
    client_name: string
    description: string
    status: string
    budget: number
    start_date: string
    deadline: string
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
        deadline: ''
    })

    const supabase = createClient()

    const fetchProjects = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects:', error)
        } else {
            setProjects(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleCreateProject = async () => {
        if (!newProject.title) return alert("Title is required")

        const { error } = await supabase.from('projects').insert([newProject])

        if (error) {
            alert("Error creating project: " + error.message)
        } else {
            setIsCreateOpen(false)
            setNewProject({
                title: '',
                client_name: '',
                description: '',
                status: 'Planning',
                budget: 0,
                deadline: ''
            })
            fetchProjects()
        }
    }

    const handleDeleteProject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) alert("Error deleting project: " + error.message)
        else fetchProjects()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Track your jobs, timelines, and budgets across all business sectors.
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                            <Plus className="mr-2 h-5 w-5" />
                            Create New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Project</DialogTitle>
                            <DialogDescription>Fill in the details for the new project.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Project Title</Label>
                                <Input
                                    value={newProject.title}
                                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Client Name</Label>
                                <Input
                                    value={newProject.client_name}
                                    onChange={e => setNewProject({ ...newProject, client_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Budget</Label>
                                    <Input
                                        type="number"
                                        value={newProject.budget}
                                        onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newProject.status}
                                        onChange={e => setNewProject({ ...newProject, status: e.target.value })}
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Deadline</Label>
                                <Input
                                    type="date"
                                    value={newProject.deadline}
                                    onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateProject}>Create Project</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {projects.map((project) => (
                        <Card key={project.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all ring-1 ring-slate-200">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-xl">{project.title}</CardTitle>
                                            <Badge variant={
                                                project.status === 'Active' ? 'default' :
                                                    project.status === 'Planning' ? 'outline' :
                                                        'secondary'
                                            }>
                                                {project.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="flex items-center gap-1 font-medium">
                                            <Target className="h-3 w-3" />
                                            {project.client_name || 'No Client'}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                                            <DropdownMenuItem>Edit Project</DropdownMenuItem>
                                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteProject(project.id)}>Delete Project</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Deadline:</span>
                                            <span className="font-semibold">{project.deadline || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Budget:</span>
                                            <span className="font-semibold text-emerald-600">${project.budget?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {project.description || 'No description provided.'}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/30 border-t flex justify-end">
                                <Button variant="link" size="sm" className="text-xs font-semibold gap-1">
                                    Full Details
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    {projects.length === 0 && (
                        <div className="col-span-full text-center p-12 text-muted-foreground">
                            No projects found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

