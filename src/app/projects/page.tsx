"use client"

import * as React from "react"
import {
    Plus,
    MoreHorizontal,
    Loader2,
    Download,
    Briefcase,
    Calendar,
    Target,
    Users,
    TrendingUp,
    Clock,
    Filter,
    ArrowRight,
    Edit,
    Trash2,
    CheckCircle2,
    Activity,
    Search,
    BarChart3
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

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
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"
import { useRouter } from "next/navigation"

export const runtime = 'edge';

interface Project {
    id: string
    title: string
    client_name: string
    description: string
    status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled'
    budget: number
    start_date: string
    deadline: string
    customer_id?: string
}

export default function ProjectsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const router = useRouter()
    const [projects, setProjects] = React.useState<Project[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingProject, setEditingProject] = React.useState<Project | null>(null)

    const [newProject, setNewProject] = React.useState({
        title: '',
        description: '',
        status: 'Planning' as const,
        budget: 0,
        deadline: '',
        customer_id: ''
    })

    const [customers, setCustomers] = React.useState<{ id: string; name: string }[]>([])
    const supabase = createClient()

    const fetchInitialData = React.useCallback(async () => {
        setLoading(true)
        const [projectsRes, customersRes] = await Promise.all([
            supabase.from('projects').select('*').order('created_at', { ascending: false }),
            supabase.from('customers').select('id, name').order('name')
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

        // Prepare data: convert empty strings to null for UUID fields
        const projectToInsert = {
            ...newProject,
            customer_id: newProject.customer_id === '' ? null : newProject.customer_id
        }

        const { error } = await supabase.from('projects').insert([projectToInsert])
        if (error) alert(error.message)
        else {
            setIsCreateOpen(false)
            setNewProject({ title: '', description: '', status: 'Planning', budget: 0, deadline: '', customer_id: '' })
            fetchInitialData()
        }
    }

    const handleEditProject = async () => {
        if (!editingProject) return
        const { error } = await supabase
            .from('projects')
            .update({
                title: editingProject.title,
                description: editingProject.description,
                status: editingProject.status,
                budget: editingProject.budget,
                deadline: editingProject.deadline,
                customer_id: editingProject.customer_id === '' ? null : editingProject.customer_id
            })
            .eq('id', editingProject.id)

        if (error) alert(error.message)
        else {
            setIsEditOpen(false)
            setEditingProject(null)
            fetchInitialData()
        }
    }

    const handleDeleteProject = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to terminate the lifecycle of project "${title}"?`)) return
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchInitialData()
    }

    const handleUpdateProjectStatus = async (id: string, newStatus: Project['status']) => {
        const { error } = await supabase
            .from('projects')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchInitialData()
    }

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const getStatusBadge = (status: Project['status']) => {
        const variants: Record<string, string> = {
            'Planning': 'bg-slate-100 text-slate-700',
            'Active': 'bg-blue-100 text-blue-700 animate-pulse',
            'On Hold': 'bg-amber-100 text-amber-700',
            'Completed': 'bg-emerald-100 text-emerald-700',
            'Cancelled': 'bg-rose-100 text-rose-700'
        }
        return <Badge className={`font-bold border-none shadow-sm ${variants[status]}`}>{status}</Badge>
    }

    const filtered = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{dict.projects.title}</h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {locale === 'ar' ? 'قم بتنظيم عملياتك، مراحل الإنجاز، والنتائج النهائية لمشاريعك.' : 'Orchestrate your operations, milestones, and deliverable outcomes.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => handleActionPlaceholder('Filters')}>
                        <Filter className="h-4 w-4" /> Filters
                    </Button>
                    <Link href="/reports">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> {dict.sidebar.reports}
                        </Button>
                    </Link>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 shadow-xl shadow-indigo-100 border-none transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-4 w-4" /> {dict.projects.initializeProject}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle className="text-2xl font-bold">{dict.projects.projectScope}</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-6 py-6">
                                <div className="space-y-2 col-span-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Project Title</Label>
                                    <Input placeholder="e.g. Al-Fursan Residential Complex Phase 1" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Primary Client</Label>
                                    <select className="w-full border rounded-md h-11 px-3 bg-white" value={newProject.customer_id} onChange={e => setNewProject({ ...newProject, customer_id: e.target.value })}>
                                        <option value="">Internal Project</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Project Budget ({currency})</Label>
                                    <Input type="number" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })} className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Global Status</Label>
                                    <select className="w-full border rounded-md h-11 px-3 bg-white" value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as any })}>
                                        <option value="Planning">Planning Phase</option>
                                        <option value="Active">Operational / Active</option>
                                        <option value="On Hold">Delayed / On Hold</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Completion Deadline</Label>
                                    <Input type="date" value={newProject.deadline} onChange={e => setNewProject({ ...newProject, deadline: e.target.value })} className="h-11" />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Scope Description</Label>
                                    <textarea className="w-full border rounded-md p-3 min-h-[100px]" placeholder="Outline the main objectives and scope..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreateProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">Create Project</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Aggregated Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.projects.yieldPipeline}</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-800">{currency} {projects.reduce((acc, p) => acc + (p.budget || 0), 0).toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="h-3 w-3" /> {locale === 'ar' ? 'زيادة بنسبة 12% عن الربع الثالث' : '12% increase from Q3'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.projects.operationalRate}</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-800">
                            {projects.filter(p => p.status === 'Active').length} {locale === 'ar' ? 'مشاريع نشطة' : 'Active Jobs'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Activity className="h-3 w-3" /> {locale === 'ar' ? 'متوسط الاستخدام: 84%' : 'Average utilization: 84%'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.projects.upcomingMilestones}</CardDescription>
                        <CardTitle className="text-3xl font-black text-slate-800">
                            4 {locale === 'ar' ? 'مواعيد نهائية' : 'Deadlines'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                            <Clock className="h-3 w-3" /> Next critical: 3 days left
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters Strip */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Search project database..."
                        className="h-14 pl-12 bg-white border-none shadow-lg text-lg rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl bg-white border-none shadow-lg font-bold gap-2">
                    <Filter className="h-5 w-5" /> Detailed Filters
                </Button>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 opacity-50" />
                    <p className="text-slate-400 font-medium animate-pulse">Syncing Project Modules...</p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2">
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Briefcase className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">No projects found matching your criteria.</h3>
                        </div>
                    ) : filtered.map(project => (
                        <Card key={project.id} className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden bg-white/80 backdrop-blur-sm relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {project.title}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="font-bold flex items-center gap-2">
                                        <Target className="h-3 w-3 text-slate-400" />
                                        {project.client_name || 'Strategic Internal Asset'}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1 items-center">
                                    {getStatusBadge(project.status)}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none p-2">
                                            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">Master Control</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => {
                                                setEditingProject(project)
                                                setIsEditOpen(true)
                                            }} className="gap-2 cursor-pointer rounded-lg p-3 hover:bg-slate-50"><Edit className="h-4 w-4" /> Comprehensive Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateProjectStatus(project.id, 'Completed')} className="gap-2 cursor-pointer rounded-lg p-3 hover:bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Finalize Project</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleActionPlaceholder('Workforce')} className="gap-2 cursor-pointer rounded-lg p-3 hover:bg-indigo-50 text-indigo-700"><Users className="h-4 w-4" /> Project Workforce</DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                            <DropdownMenuItem onClick={() => handleDeleteProject(project.id, project.title)} className="gap-2 cursor-pointer rounded-lg p-3 hover:bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /> Terminate Lifecycle</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 min-h-[40px] mb-6">
                                    {project.description || 'No detailed scope documentation available for this operational unit yet.'}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Project Threshold (Budget)</span>
                                        <span className="text-lg font-black text-slate-900">{formatMoney(project.budget || 0)}</span>
                                    </div>
                                    <Progress value={Math.min(100, (Math.random() * 60) + 20)} className="h-2 bg-slate-100 [&>div]:bg-indigo-600 shadow-inner" />
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between py-4 group-hover:bg-indigo-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">Target Deadline</span>
                                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                            {project.deadline ? format(new Date(project.deadline), "dd MMM yyyy") : 'UNSCHEDULED'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push(`/projects/${project.id}`)}
                                    className="text-indigo-600 font-black hover:bg-indigo-100 h-9 px-4 rounded-xl flex items-center group/btn transition-all"
                                >
                                    Site Console <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle className="text-2xl font-bold">Edit Project Scope</DialogTitle></DialogHeader>
                            {editingProject && (
                                <div className="grid grid-cols-2 gap-6 py-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Project Title</Label>
                                        <Input value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Primary Client</Label>
                                        <select className="w-full border rounded-md h-11 px-3 bg-white" value={editingProject.customer_id || ''} onChange={e => setEditingProject({ ...editingProject, customer_id: e.target.value })}>
                                            <option value="">Internal Project</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Project Budget ({currency})</Label>
                                        <Input type="number" value={editingProject.budget} onChange={e => setEditingProject({ ...editingProject, budget: Number(e.target.value) })} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Global Status</Label>
                                        <select className="w-full border rounded-md h-11 px-3 bg-white" value={editingProject.status} onChange={e => setEditingProject({ ...editingProject, status: e.target.value as any })}>
                                            <option value="Planning">Planning Phase</option>
                                            <option value="Active">Operational / Active</option>
                                            <option value="On Hold">Delayed / On Hold</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Completion Deadline</Label>
                                        <Input type="date" value={editingProject.deadline} onChange={e => setEditingProject({ ...editingProject, deadline: e.target.value })} className="h-11" />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Scope Description</Label>
                                        <textarea className="w-full border rounded-md p-3 min-h-[100px]" value={editingProject.description || ''} onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleEditProject} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">Save Changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}
