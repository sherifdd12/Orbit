import * as React from "react"
import {
    Plus,
    Search,
    Download,
    Cloud,
    FileIcon,
    FileText,
    Image as ImageIcon,
    FileSpreadsheet,
    MoreVertical
} from "lucide-react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { getDictionary, Locale } from "@/lib/i18n/dictionaries"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DocumentUpload } from "./DocumentUpload"
import { DocumentActions } from "./DocumentActions"

interface Document {
    id: string
    name: string
    file_path: string
    type: string
    size: number
    created_at: string
    project_id?: string
    projects?: { title: string } | { title: string }[]
}

export default async function DocumentsPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en"
    const locale: Locale = rawLocale === "ar" ? "ar" : "en"
    const dict = getDictionary(locale)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Parallel fetching
    const [docsRes, projectsRes] = await Promise.all([
        supabase.from('documents').select(`
            *,
            projects (title)
        `).order('created_at', { ascending: false }),
        supabase.from('projects').select('id, title').order('title')
    ])

    const docs: Document[] = docsRes.data || []
    const projects = projectsRes.data || []

    const totalSize = docs.reduce((acc, d) => acc + (d.size || 0), 0)
    const totalGB = (totalSize / (1024 * 1024 * 1024)).toFixed(4)

    const getFileIcon = (type: string) => {
        const t = (type || '').toLowerCase()
        if (t.includes('pdf')) return <FileText className="h-5 w-5 text-rose-500" />
        if (t.includes('xl') || t.includes('csv') || t.includes('xls')) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
        if (t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return <ImageIcon className="h-5 w-5 text-blue-500" />
        return <FileIcon className="h-5 w-5 text-slate-400" />
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Document Management</h2>
                    <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        Connected to secure cloud infrastructure.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 shadow-sm border-slate-200 font-bold">
                        <Download className="mr-2 h-4 w-4" />
                        Export Audit
                    </Button>
                    <DocumentUpload projects={projects} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none shadow-xl text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70">Cloud Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{totalGB} GB <span className="text-sm opacity-50 font-medium">/ 100 GB</span></div>
                        <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-white h-full rounded-full transition-all" style={{ width: `${Math.max(1, Math.min(100, (Number(totalGB) / 100) * 100))}%` }} />
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 flex items-center justify-between bg-white border-none shadow-md rounded-3xl px-8 py-4">
                    <div className="flex gap-10">
                        <div className="text-center group cursor-pointer">
                            <div className="text-2xl font-black text-slate-800">{docs.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Total Files</div>
                        </div>
                        <div className="text-center group cursor-pointer">
                            <div className="text-2xl font-black text-slate-800">{[...new Set(docs.map(d => d.type))].length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Extensions</div>
                        </div>
                        <div className="text-center group cursor-pointer">
                            <div className="text-2xl font-black text-slate-800">{projects.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Linked Projects</div>
                        </div>
                    </div>
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input placeholder="Search digital assets..." className="pl-12 h-12 bg-slate-50 border-none shadow-inner rounded-2xl" />
                    </div>
                </div>
            </div>

            <Card className="flex-1 shadow-2xl border-none bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400 pl-8">Asset Name</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Context / Project</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Modification Date</TableHead>
                                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-slate-400">Footprint (Size)</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {docs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-40">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <FileIcon className="h-16 w-16" />
                                            <p className="font-bold text-lg">Digital archive is currently empty.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : docs.map((file) => (
                                <TableRow key={file.id} className="hover:bg-blue-50/30 group border-slate-50 transition-colors">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{file.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{file.type} Asset</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {(file.projects as any)?.title ? (
                                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-tighter">
                                                {(file.projects as any).title}
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">General Cloud</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-600">
                                        {new Date(file.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-sm text-right font-black text-slate-900">
                                        {file.size > 1024 * 1024
                                            ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                                            : (file.size / 1024).toFixed(1) + ' KB'}
                                    </TableCell>
                                    <TableCell className="pr-8">
                                        <DocumentActions filePath={file.file_path} fileName={file.name} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
