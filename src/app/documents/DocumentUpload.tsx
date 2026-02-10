"use client"

import * as React from "react"
import {
    Plus,
    Loader2
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
import { useRouter } from "next/navigation"

export function DocumentUpload({ projects }: { projects: { id: string; title: string }[] }) {
    const [isUploadOpen, setIsUploadOpen] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [metadata, setMetadata] = React.useState({
        name: '',
        project_id: '',
    })

    const router = useRouter()
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setMetadata(prev => ({ ...prev, name: selectedFile.name }))
        }
    }

    const handleUpload = async () => {
        if (!file) return alert("Please select a file")

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Save metadata to database
            const { error: dbError } = await supabase.from('documents').insert([{
                name: metadata.name,
                file_path: filePath,
                type: fileExt?.toUpperCase() || 'FILE',
                size: file.size,
                project_id: metadata.project_id === '' ? null : metadata.project_id,
                created_by: (await supabase.auth.getUser()).data.user?.id
            }])

            if (dbError) throw dbError

            setIsUploadOpen(false)
            setFile(null)
            setMetadata({ name: '', project_id: '' })
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
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
                        <Label>Select File</Label>
                        <Input type="file" onChange={handleFileChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                            value={metadata.name}
                            onChange={e => setMetadata({ ...metadata, name: e.target.value })}
                            placeholder="document.pdf"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Link to Project (Optional)</Label>
                        <select
                            className="w-full border p-2 rounded"
                            value={metadata.project_id}
                            onChange={e => setMetadata({ ...metadata, project_id: e.target.value })}
                        >
                            <option value="">None / General</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={uploading || !file}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {uploading ? "Uploading..." : "Save to Cloud"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
