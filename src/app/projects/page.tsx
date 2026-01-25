"use client"

import * as React from "react"
import {
    Plus,
    MoreHorizontal,
    Calendar,
    Target,
    Users,
    Clock,
    ExternalLink
} from "lucide-react"

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

const mockProjects = [
    {
        id: "1",
        title: "Modern Office Renovation",
        client: "TechCorp Industries",
        status: "Active",
        progress: 65,
        dueDate: "2024-03-15",
        budget: "$45,000",
        teamSize: 5,
    },
    {
        id: "2",
        title: "Warehouse Expansion Ph 2",
        client: "Global Logistics",
        status: "Planning",
        progress: 15,
        dueDate: "2024-06-01",
        budget: "$120,000",
        teamSize: 3,
    },
    {
        id: "3",
        title: "Smart Home Integration",
        client: "Residential Client",
        status: "Completed",
        progress: 100,
        dueDate: "2023-12-20",
        budget: "$12,500",
        teamSize: 2,
    },
    {
        id: "4",
        title: "Central Mall HVAC Service",
        client: "Mall Management",
        status: "Active",
        progress: 40,
        dueDate: "2024-02-28",
        budget: "$8,200",
        teamSize: 4,
    },
]

export const runtime = 'edge';

export default function ProjectsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Track your jobs, timelines, and budgets across all business sectors.
                    </p>
                </div>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Project
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {mockProjects.map((project) => (
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
                                        {project.client}
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
                                        <DropdownMenuItem>View Budget</DropdownMenuItem>
                                        <DropdownMenuItem>Manage Team</DropdownMenuItem>
                                        <DropdownMenuItem className="text-rose-600">Archive</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Overall Progress</span>
                                    <span className="font-bold">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Deadline:</span>
                                        <span className="font-semibold">{project.dueDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Budget:</span>
                                        <span className="font-semibold text-emerald-600">{project.budget}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Team:</span>
                                        <span className="font-semibold">{project.teamSize} members</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/30 border-t flex justify-between">
                            <Button variant="ghost" size="sm" className="text-xs font-semibold">
                                Quick Tasks
                            </Button>
                            <Button variant="link" size="sm" className="text-xs font-semibold gap-1">
                                Full Details
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
