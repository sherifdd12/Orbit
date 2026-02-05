"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    Plus,
    CheckCircle2,
    Clock,
    Users,
    DollarSign,
    Calendar,
    Target,
    TrendingUp,
    AlertTriangle,
    Edit,
    Trash2,
    MoreHorizontal,
    Briefcase
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Project {
    id: string
    title: string
    description: string
    status: string
    budget: number
    deadline: string
    customer_id: string | null
    customer?: { name: string }
}

interface Milestone {
    id: string
    project_id: string
    title: string
    description: string
    target_date: string
    status: 'Pending' | 'In Progress' | 'Completed'
    order_index: number
}

interface ProjectMember {
    id: string
    project_id: string
    profile_id: string
    role: string
    allocation_percentage: number
    profiles?: { full_name: string, email: string }
}

export default function ProjectConsolePage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string
    const { dict, locale } = useLanguage()
    const { currency, formatMoney } = useSettings()

    const [project, setProject] = React.useState<Project | null>(null)
    const [milestones, setMilestones] = React.useState<Milestone[]>([])
    const [members, setMembers] = React.useState<ProjectMember[]>([])
    const [tasks, setTasks] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    const [isAddMilestoneOpen, setIsAddMilestoneOpen] = React.useState(false)
    const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
    const [availableProfiles, setAvailableProfiles] = React.useState<{ id: string, full_name: string }[]>([])

    const [newMilestone, setNewMilestone] = React.useState({
        title: '',
        description: '',
        target_date: format(new Date(), "yyyy-MM-dd"),
        status: 'Pending' as const
    })

    const [newMember, setNewMember] = React.useState({
        profile_id: '',
        role: 'Team Member',
        allocation_percentage: 100
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [projectRes, milestonesRes, membersRes, tasksRes, profilesRes] = await Promise.all([
            supabase.from('projects').select('*, customer:customers(name)').eq('id', projectId).single(),
            supabase.from('project_milestones').select('*').eq('project_id', projectId).order('order_index'),
            supabase.from('project_members').select('*, profiles:profiles(full_name, email)').eq('project_id', projectId),
            supabase.from('tasks').select('*').eq('project_id', projectId),
            supabase.from('profiles').select('id, full_name').eq('is_active', true)
        ])

        if (!projectRes.error) setProject(projectRes.data)
        if (!milestonesRes.error) setMilestones(milestonesRes.data || [])
        if (!membersRes.error) setMembers(membersRes.data || [])
        if (!tasksRes.error) setTasks(tasksRes.data || [])
        if (!profilesRes.error) setAvailableProfiles(profilesRes.data || [])
        setLoading(false)
    }, [supabase, projectId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAddMilestone = async () => {
        if (!newMilestone.title) return alert("Milestone title is required")
        const { error } = await supabase.from('project_milestones').insert([{
            ...newMilestone,
            project_id: projectId,
            order_index: milestones.length
        }])
        if (error) alert(error.message)
        else {
            setIsAddMilestoneOpen(false)
            setNewMilestone({ title: '', description: '', target_date: format(new Date(), "yyyy-MM-dd"), status: 'Pending' })
            fetchData()
        }
    }

    const handleUpdateMilestoneStatus = async (id: string, status: Milestone['status']) => {
        const { error } = await supabase.from('project_milestones').update({ status }).eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeleteMilestone = async (id: string) => {
        if (!confirm("Delete this milestone?")) return
        const { error } = await supabase.from('project_milestones').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleAddMember = async () => {
        if (!newMember.profile_id) return alert("Select a team member")
        const { error } = await supabase.from('project_members').insert([{
            ...newMember,
            project_id: projectId
        }])
        if (error) alert(error.message)
        else {
            setIsAddMemberOpen(false)
            setNewMember({ profile_id: '', role: 'Team Member', allocation_percentage: 100 })
            fetchData()
        }
    }

    const handleRemoveMember = async (id: string) => {
        if (!confirm("Remove this team member from the project?")) return
        const { error } = await supabase.from('project_members').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    const completedMilestones = milestones.filter(m => m.status === 'Completed').length
    const completedTasks = tasks.filter(t => t.status === 'Done').length
    const projectProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">Project Not Found</h2>
                <Button onClick={() => router.push('/projects')} className="mt-4">Back to Projects</Button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/projects')} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">{project.title}</h1>
                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                        <p className="text-slate-500 mt-1">{project.customer?.name || 'Internal Project'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" /> Edit Project
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100 text-xs font-bold uppercase">Project Budget</CardDescription>
                        <CardTitle className="text-2xl font-black">{formatMoney(project.budget)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-100 text-xs font-bold uppercase">Milestones</CardDescription>
                        <CardTitle className="text-2xl font-black">{completedMilestones} / {milestones.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100 text-xs font-bold uppercase">Tasks Completed</CardDescription>
                        <CardTitle className="text-2xl font-black">{completedTasks} / {tasks.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-100 text-xs font-bold uppercase">Deadline</CardDescription>
                        <CardTitle className="text-xl font-black">
                            {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : 'Not Set'}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Progress Bar */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Project Progress</CardTitle>
                            <CardDescription>Based on milestone completion</CardDescription>
                        </div>
                        <span className="text-3xl font-black text-indigo-600">{projectProgress}%</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={projectProgress} className="h-4" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Milestones Section */}
                <Card className="border-none shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-600" /> Milestones
                            </CardTitle>
                            <CardDescription>Track key project deliverables</CardDescription>
                        </div>
                        <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Milestone</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Date</Label>
                                        <Input type="date" value={newMilestone.target_date} onChange={e => setNewMilestone({ ...newMilestone, target_date: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddMilestone} className="bg-indigo-600 hover:bg-indigo-700">Create Milestone</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {milestones.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>No milestones defined yet</p>
                            </div>
                        ) : milestones.map((milestone, idx) => (
                            <div key={milestone.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${milestone.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                milestone.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-200 text-slate-600'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{milestone.title}</h4>
                                            <p className="text-sm text-slate-500">{milestone.description}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(milestone.target_date), "MMM dd, yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleUpdateMilestoneStatus(milestone.id, 'In Progress')}>
                                                <Clock className="h-4 w-4 mr-2" /> Mark In Progress
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateMilestoneStatus(milestone.id, 'Completed')}>
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteMilestone(milestone.id)} className="text-rose-600">
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Team Members / Resource Allocation */}
                <Card className="border-none shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-violet-600" /> Team & Resources
                            </CardTitle>
                            <CardDescription>Project workforce allocation</CardDescription>
                        </div>
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Team Member</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Select Person</Label>
                                        <select
                                            className="w-full border rounded-md h-10 px-3 bg-white"
                                            value={newMember.profile_id}
                                            onChange={e => setNewMember({ ...newMember, profile_id: e.target.value })}
                                        >
                                            <option value="">Choose...</option>
                                            {availableProfiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Allocation %</Label>
                                        <Input type="number" min={0} max={100} value={newMember.allocation_percentage} onChange={e => setNewMember({ ...newMember, allocation_percentage: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddMember} className="bg-violet-600 hover:bg-violet-700">Add Member</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {members.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                <p>No team members assigned</p>
                            </div>
                        ) : members.map(member => (
                            <div key={member.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                            {member.profiles?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{member.profiles?.full_name}</h4>
                                            <p className="text-sm text-slate-500">{member.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="text-lg font-black text-indigo-600">{member.allocation_percentage}%</span>
                                            <p className="text-xs text-slate-400">Allocation</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="opacity-0 group-hover:opacity-100 text-rose-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    {members.length > 0 && (
                        <CardFooter className="bg-slate-50 border-t">
                            <div className="w-full flex items-center justify-between text-sm">
                                <span className="text-slate-500">Total Allocation</span>
                                <span className="font-bold text-slate-800">
                                    {members.reduce((sum, m) => sum + m.allocation_percentage, 0)}%
                                </span>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    )
}
