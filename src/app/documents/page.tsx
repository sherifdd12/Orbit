"use client"

import * as React from "react"
import {
    Files,
    Folder,
    Plus,
    Search,
    Download,
    Cloud
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/utils/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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

interface Document {
    id: string
    name: string
    file_path: string
    type: string
    size: number
    created_at: string
}

export const runtime = 'edge';

export default function DocumentsPage() {
    const [docs, setDocs] = React.useState<Document[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [newDoc, setNewDoc] = React.useState({
        name: '',
        type: 'PDF',
        project_id: '',
    })

    const supabase = createClient()

    const fetchDocs = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
        if (!error) setDocs(data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchDocs()
    }, [fetchDocs])

    const handleUpload = async () => {
        const { error } = await supabase.from('documents').insert([{
            name: newDoc.name,
            file_path: '/placeholder/' + newDoc.name,
            type: newDoc.type,
            size: Math.floor(Math.random() * 5000)
        }])
        if (error) alert(error.message)
        else {
            setIsUploadOpen(false)
            fetchDocs()
        }
    }
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
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Upload File
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Upload New File</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>File Name</Label>
                                    <Input value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="document.pdf" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={newDoc.type}
                                        onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                                    >
                                        <option value="PDF">PDF</option>
                                        <option value="Excel">Excel</option>
                                        <option value="Word">Word</option>
                                        <option value="Image">Image</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpload}>Save to Cloud</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading documents...</TableCell></TableRow>
                            ) : docs.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center">No documents found.</TableCell></TableRow>
                            ) : docs.map((file) => (
                                <TableRow key={file.id} className="hover:bg-slate-50/50 group">
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
                                        <span className="text-sm font-medium text-slate-600">General</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-sm text-right font-mono text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} MB
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
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
