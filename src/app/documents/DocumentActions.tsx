"use client"

import * as React from "react"
import { Download, MoreVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"

export function DocumentActions({ filePath, fileName }: { filePath: string, fileName: string }) {
    const [loading, setLoading] = React.useState(false)
    const supabase = createClient()

    const handleDownload = async () => {
        setLoading(true)
        try {
            // Generate a secure, temporary URL that expires in 60 seconds
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(filePath, 60)

            if (error) throw error

            if (data?.signedUrl) {
                // Trigger the download
                const link = document.createElement('a')
                link.href = data.signedUrl
                link.target = '_blank'
                link.download = fileName
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            }
        } catch (error: any) {
            alert("Error generating secure link: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-blue-600"
                onClick={handleDownload}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-600 font-black">
                <MoreVertical className="h-5 w-5" />
            </Button>
        </div>
    )
}
