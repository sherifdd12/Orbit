"use client"

import * as React from "react"
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowUpDown,
    Calendar,
    Eye,
    Tag
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface JournalEntry {
    id: string
    entry_number: string
    date: string
    description: string | null
    reference: string | null
    status: 'Draft' | 'Posted' | 'Cancelled'
    total_amount?: number // Computed locally for UI
    items?: any[]
    created_at: string
}

export default function JournalEntriesPage() {
    const { dict, locale } = useLanguage()
    const { currency } = useSettings()
    const [entries, setEntries] = React.useState<JournalEntry[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        // Fetch entries and their items to calculate totals
        const { data, error } = await supabase
            .from('journal_entries')
            .select(`
                *,
                journal_items (
                    id,
                    debit,
                    credit
                )
            `)
            .order('date', { ascending: false })

        if (!error) {
            const processed = (data || []).map((entry: any) => ({
                ...entry,
                total_amount: entry.journal_items.reduce((sum: number, item: any) => sum + parseFloat(item.debit), 0)
            }))
            setEntries(processed)
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const getStatusBadge = (status: JournalEntry['status']) => {
        switch (status) {
            case 'Posted': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> {dict.finance.posted}</Badge>
            case 'Draft': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200"><Clock className="h-3 w-3 mr-1" /> {dict.finance.draft}</Badge>
            case 'Cancelled': return <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100"><XCircle className="h-3 w-3 mr-1" /> {dict.finance.cancelled}</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = entries.filter(e =>
        e.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.finance.journalEntries}</h2>
                    <p className="text-muted-foreground text-sm">Review and manage all double-entry manual journal items.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Tag className="h-4 w-4 mr-2" /> Categories</Button>
                    <Button onClick={() => window.location.href = '/finance/journal/new'}>
                        <Plus className="mr-2 h-4 w-4" /> {dict.finance.newEntry}
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={dict.common.search + "..."} className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm"><ArrowUpDown className="h-4 w-4 mr-2" /> Sort</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead className="pl-6 w-32">{dict.common.date}</TableHead>
                                <TableHead className="w-40">Entry #</TableHead>
                                <TableHead>{dict.common.description}</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">{dict.common.amount}</TableHead>
                                <TableHead>{dict.common.status}</TableHead>
                                <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-20 text-muted-foreground">{dict.common.noData}</TableCell></TableRow>
                            ) : filtered.map((e, idx) => (
                                <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell className="pl-6 font-mono text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{format(new Date(e.date), "dd MMM")}</span>
                                            <span className="text-[10px] text-muted-foreground">{format(new Date(e.date), "yyyy")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-blue-600 tracking-tight">{e.entry_number}</TableCell>
                                    <TableCell className="max-w-[300px] truncate text-sm">
                                        {e.description || <span className="text-slate-300 italic">No description</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-medium uppercase">
                                        {e.reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-slate-700">
                                        {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: currency }).format(e.total_amount || 0)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Eye className="h-4 w-4" />
                                        </Button>
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
