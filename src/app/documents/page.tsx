"use client"

import * as React from "react"
import {
    Files,
    Folder,
    Search,
    Plus,
    MoreVertical,
    Download,
    Share2,
    Trash2,
    ExternalLink,
    Cloud
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const files = [
    {
        name: "Project_Proposal_Office.pdf",
        type: "PDF",
        size: "2.4 MB",
        modified: "2024-01-20",
        project: "Modern Office",
    },
    {
        name: "Inventory_Stock_Jan.xlsx",
        type: "Excel",
        size: "1.1 MB",
        modified: "2024-01-18",
        project: "General",
    },
    {
        name: "Site_Photos_Mall.zip",
        type: "Archive",
        size: "45 MB",
        modified: "2024-01-22",
        project: "Central Mall",
    },
    {
        name: "Contract_Terms_2024.docx",
        type: "Word",
        size: "850 KB",
        modified: "2024-01-15",
        project: "Legal",
    },
]

export default function DocumentsPage() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Document Management</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        Connected to your OneDrive Business Storage.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Folder className="mr-2 h-4 w-4" />
                        New Folder
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Upload File
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/50 border-blue-100 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-blue-900">Total Storage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-blue-950">12.5 GB / 1 TB</div>
                        <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2">
                            <div className="bg-blue-600 h-1.5 rounded-full w-[1.25%]" />
                        </div>
                    </CardContent>
                </Card>
                {/* Placeholder for other storage metrics */}
                <div className="md:col-span-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-6 py-4">
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-sm font-bold">1,240</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Files</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold">45</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Folders</div>
                        </div>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search documents..." className="pl-9 h-9" />
                    </div>
                </div>
            </div>

            <Card className="flex-1 shadow-sm border-slate-200 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>File Name</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Modified</TableHead>
                                <TableHead className="text-right">Size</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.map((file) => (
                                <TableRow key={file.name} className="hover:bg-slate-50/50 group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                <Files className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{file.type}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-600">{file.project}</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {file.modified}
                                    </TableCell>
                                    <TableCell className="text-sm text-right font-mono text-muted-foreground">
                                        {file.size}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
