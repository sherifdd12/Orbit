"use client"

import * as React from "react"
import {
    Mail,
    Inbox,
    Send,
    FileText,
    Trash2,
    Plus,
    Search,
    MoreVertical,
    Star,
    RotateCcw,
    Settings
} from "lucide-react"
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const emails = [
    {
        id: "1",
        sender: "Ahmed Khalid",
        subject: "Quotation for Modern Office Lighting",
        snippet: "Greetings, please find attached the updated quotation for the lighting fixtures...",
        time: "10:24 AM",
        read: false,
        label: "Sales",
    },
    {
        id: "2",
        sender: "Microsoft Azure",
        subject: "Invoice for January 2024",
        snippet: "Your monthly invoice for Azure services is now available in the portal...",
        time: "昨天",
        read: true,
        label: "Bills",
    },
    {
        id: "3",
        sender: "Global Logistics",
        subject: "Delivery Confirmation: ST-RB-12",
        snippet: "The shipment of steel rebar has been delivered to Warehouse A...",
        time: "Jan 22",
        read: true,
        label: "Logistics",
    },
    {
        id: "4",
        sender: "Sarah Jenkins",
        subject: "Meeting Minutes - Project Sync",
        snippet: "Here are the notes from today's coordination meeting at the mall site...",
        time: "Jan 21",
        read: false,
        label: "Internal",
    },
]

export const runtime = 'edge';

export default function EmailPage() {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [emailSettings, setEmailSettings] = React.useState({
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
    })

    const supabase = createClient()

    const handleSaveSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('email_settings')
            .upsert({
                user_id: user.id,
                ...emailSettings,
                is_active: true
            })

        if (error) alert(error.message)
        else {
            alert("Settings saved successfully")
            setIsSettingsOpen(false)
        }
    }
    return (
        <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
            {/* Sidebar for Email Categories */}
            <div className="w-64 flex flex-col gap-2">
                <Button className="w-full justify-start gap-2 mb-4 shadow-md bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Compose
                </Button>
                <div className="space-y-1">
                    <Button variant="secondary" className="w-full justify-start gap-3 bg-blue-50 text-blue-700 border-none shadow-none">
                        <Inbox className="h-4 w-4" />
                        Inbox
                        <Badge className="ml-auto bg-blue-600 text-[10px]" variant="default">12</Badge>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                        <Send className="h-4 w-4" />
                        Sent
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                        <FileText className="h-4 w-4" />
                        Drafts
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                        <Trash2 className="h-4 w-4" />
                        Trash
                    </Button>
                </div>

                <div className="mt-8 px-4 py-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Labels</h4>
                </div>
                <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Sales
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        Bills
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        Logistics
                    </Button>
                </div>

                <div className="mt-auto">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 mt-4">
                                <Settings className="h-4 w-4" />
                                Email Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Email Server Settings</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>SMTP Host</Label>
                                    <Input value={emailSettings.smtp_host} onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>SMTP Port</Label>
                                    <Input type="number" value={emailSettings.smtp_port} onChange={e => setEmailSettings({ ...emailSettings, smtp_port: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={emailSettings.smtp_user} onChange={e => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" value={emailSettings.smtp_pass} onChange={e => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveSettings}>Save Server Settings</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Email List */}
            <Card className="flex-1 flex flex-col shadow-sm border-slate-200">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search mail..."
                            className="pl-9 h-9 border-none bg-background shadow-none focus-visible:ring-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0 overflow-auto">
                    <div className="divide-y divide-slate-100">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className={`p-4 flex flex-col gap-1 cursor-pointer transition-colors ${email.read ? 'bg-background' : 'bg-blue-50/30'
                                    } hover:bg-slate-50`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-3 w-3 text-slate-300" />
                                        <span className={`text-sm ${email.read ? 'font-medium' : 'font-bold'}`}>
                                            {email.sender}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">{email.time}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className={`text-xs ${email.read ? 'text-slate-600' : 'text-slate-900 font-semibold'} truncate`}>
                                            {email.subject}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground truncate">
                                            {email.snippet}
                                        </span>
                                    </div>
                                    {email.label && (
                                        <Badge variant="outline" className="text-[9px] h-4">
                                            {email.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Email Content Preview (Placeholder) */}
            <div className="hidden lg:flex flex-col w-[450px] gap-4">
                <Card className="flex-1 flex flex-col shadow-sm items-center justify-center border-dashed text-muted-foreground p-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium">Select an email to read</p>
                    <p className="text-[11px] mt-1">
                        Connect your business IMAP/SMTP server in Settings to view live emails.
                    </p>
                </Card>
            </div>
        </div>
    )
}
