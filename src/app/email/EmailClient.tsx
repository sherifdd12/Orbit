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
    Settings,
    Loader2,
    X
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
import { Textarea } from "@/components/ui/textarea"

interface EmailClientProps {
    initialSettings: any
    initialEmails: any[]
    dict: any
    locale: string
}

export function EmailClient({ initialSettings, initialEmails, dict, locale }: EmailClientProps) {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [isComposeOpen, setIsComposeOpen] = React.useState(false)
    const [sending, setSending] = React.useState(false)
    const [emails, setEmails] = React.useState(initialEmails)
    const [emailSettings, setEmailSettings] = React.useState(initialSettings || {
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
    })

    const [composedEmail, setComposedEmail] = React.useState({
        to: '',
        subject: '',
        body: ''
    })

    const supabase = createClient()
    const isArabic = locale === 'ar'

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
            alert(isArabic ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully")
            setIsSettingsOpen(false)
        }
    }

    const handleSendEmail = async () => {
        if (!composedEmail.to || !composedEmail.subject) {
            alert(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields")
            return
        }

        setSending(true)
        // This is where you would call an Edge Function or API to send via SMTP/Resend
        try {
            console.log("Sending email:", composedEmail)

            // Log to audit log
            await supabase.from('audit_logs').insert([{
                table_name: 'emails',
                record_id: 'new',
                action: 'SEND_EMAIL',
                new_values: composedEmail
            }])

            // Simulate delay
            await new Promise(r => setTimeout(r, 1500))

            alert(isArabic ? "تم إرسال البريد بنجاح" : "Email sent successfully")
            setIsComposeOpen(false)
            setComposedEmail({ to: '', subject: '', body: '' })
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
            {/* Sidebar for Email Categories */}
            <div className="w-72 flex flex-col gap-2">
                <Button
                    className="w-full h-12 justify-center gap-2 mb-6 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-black border-none"
                    onClick={() => setIsComposeOpen(true)}
                >
                    <Plus className="h-5 w-5" />
                    {dict.email.compose}
                </Button>

                <div className="space-y-1.5 p-2 bg-slate-50 rounded-2xl">
                    <Button variant="secondary" className="w-full justify-start gap-3 bg-white text-blue-700 shadow-sm border-none">
                        <Inbox className="h-4 w-4" />
                        {dict.email.inbox}
                        <Badge className="ml-auto bg-blue-600 text-[10px] rounded-md" variant="default">12</Badge>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white hover:shadow-sm transition-all">
                        <Send className="h-4 w-4 text-slate-400" />
                        {dict.email.sent}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white hover:shadow-sm transition-all">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {dict.email.drafts}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 hover:text-rose-600 hover:bg-rose-50 transition-all">
                        <Trash2 className="h-4 w-4 text-slate-400" />
                        {dict.email.trash}
                    </Button>
                </div>

                <div className="mt-8 px-4 py-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Labels</h4>
                </div>
                <div className="space-y-1 px-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-xs font-bold hover:bg-white transition-all">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" />
                        Sales
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-xs font-bold hover:bg-white transition-all">
                        <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm" />
                        Bills
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-xs font-bold hover:bg-white transition-all">
                        <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm" />
                        Logistics
                    </Button>
                </div>

                <div className="mt-auto px-2 pb-4">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:bg-white hover:shadow-sm">
                                <Settings className="h-4 w-4" />
                                {dict.email.settings}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">{dict.email.mailServerSettings}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-5 py-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.email.smtpHost}</Label>
                                    <input
                                        className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={emailSettings.smtp_host}
                                        onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.email.port}</Label>
                                        <input
                                            className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                            type="number"
                                            value={emailSettings.smtp_port}
                                            onChange={e => setEmailSettings({ ...emailSettings, smtp_port: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.email.username}</Label>
                                        <input
                                            className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                            value={emailSettings.smtp_user}
                                            onChange={e => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">{dict.email.password}</Label>
                                    <input
                                        className="w-full h-12 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                        type="password"
                                        value={emailSettings.smtp_pass}
                                        onChange={e => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className="w-full h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl" onClick={handleSaveSettings}>{dict.email.saveSettings}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Email List */}
            <Card className="flex-1 flex flex-col shadow-2xl border-none bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder={dict.email.search}
                            className="pl-12 h-12 border-none bg-white shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-100"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm text-slate-400">
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm text-slate-400">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <CardContent className="p-0 overflow-auto">
                    <div className="divide-y divide-slate-50">
                        {emails.map((email) => (
                            <div
                                key={email.id}
                                className={`p-6 flex flex-col gap-2 cursor-pointer transition-all ${email.read ? 'bg-transparent' : 'bg-blue-50/20'
                                    } hover:bg-slate-50/80 group relative`}
                            >
                                {!email.read && <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 rounded-r-full" />}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Star className={`h-4 w-4 ${email.read ? 'text-slate-200' : 'text-amber-400 fill-amber-400'}`} />
                                        <span className={`text-sm ${email.read ? 'text-slate-500 font-medium' : 'text-slate-900 font-black'}`}>
                                            {email.sender}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 tracking-tighter">{email.time}</span>
                                </div>
                                <div className="flex items-center justify-between gap-6 pl-7">
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className={`text-sm ${email.read ? 'text-slate-600' : 'text-slate-900 font-bold'} truncate`}>
                                            {email.subject}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                                            {email.snippet}
                                        </span>
                                    </div>
                                    {email.label && (
                                        <Badge variant="outline" className={`text-[10px] h-5 rounded-md font-black uppercase tracking-tighter border-none bg-slate-100 text-slate-500 px-2`}>
                                            {email.label}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Compose Dialog (Modal approach is better for UX) */}
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <Mail className="h-6 w-6" />
                            <h3 className="text-xl font-black">{dict.email.compose}</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white rounded-full" onClick={() => setIsComposeOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 border-b pb-2">
                                <Label className="text-xs font-black uppercase text-slate-400 w-16">{dict.email.to}</Label>
                                <input
                                    className="w-full border-none shadow-none focus:outline-none font-bold"
                                    placeholder="recipient@example.com"
                                    value={composedEmail.to}
                                    onChange={e => setComposedEmail({ ...composedEmail, to: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-4 border-b pb-2">
                                <Label className="text-xs font-black uppercase text-slate-400 w-16">{dict.email.subject}</Label>
                                <input
                                    className="w-full border-none shadow-none focus:outline-none font-bold"
                                    placeholder="Enter subject"
                                    value={composedEmail.subject}
                                    onChange={e => setComposedEmail({ ...composedEmail, subject: e.target.value })}
                                />
                            </div>
                        </div>
                        <textarea
                            className="w-full min-h-[300px] border-none bg-slate-50 rounded-2xl p-4 font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder={dict.email.placeholder}
                            value={composedEmail.body}
                            onChange={e => setComposedEmail({ ...composedEmail, body: e.target.value })}
                        />
                    </div>
                    <div className="p-6 bg-slate-50 flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-400">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <Button
                            className="h-12 px-8 rounded-xl font-black bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 gap-2"
                            onClick={handleSendEmail}
                            disabled={sending}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {sending ? dict.email.sending : dict.email.send}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Email Content Preview (Placeholder) */}
            <div className="hidden lg:flex flex-col w-[500px] gap-4">
                <Card className="flex-1 flex flex-col shadow-2xl items-center justify-center border-none bg-white rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 h-60 w-60 bg-blue-50 rounded-full opacity-50 blur-3xl font-bold" />
                    <div className="absolute -bottom-20 -left-20 h-60 w-60 bg-indigo-50 rounded-full opacity-50 blur-3xl font-bold" />

                    <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                        <Mail className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">{dict.email.noEmailSelected}</h3>
                    <p className="text-sm font-medium text-slate-400 mt-2 max-w-[240px]">
                        {dict.email.noEmailSelectedDesc}
                    </p>
                    <div className="mt-8 flex flex-col gap-3 w-full">
                        <div className="h-4 bg-slate-50 rounded-full w-full opacity-50" />
                        <div className="h-4 bg-slate-50 rounded-full w-3/4 opacity-30" />
                        <div className="h-4 bg-slate-50 rounded-full w-1/2 opacity-20" />
                    </div>
                </Card>
            </div>
        </div>
    )
}
