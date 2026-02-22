"use client"

import * as React from "react"
import {
    ArrowLeft,
    Printer,
    FileText,
    CheckCircle2,
    Clock,
    XCircle
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"
import { printDocument } from "@/lib/utils/printHelper"

export const runtime = 'edge';

export default function JournalEntryDetailPage() {
    const { dict, locale } = useLanguage()
    const { currency, formatMoney } = useSettings()
    const router = useRouter()
    const { id } = useParams()
    const [entry, setEntry] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    const supabase = createClient()

    const fetchEntry = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('journal_entries')
            .select(`
                *,
                journal_items (
                    *,
                    account:accounts(*)
                )
            `)
            .eq('id', id)
            .single()

        if (!error) setEntry(data)
        setLoading(false)
    }, [supabase, id])

    React.useEffect(() => {
        fetchEntry()
    }, [fetchEntry])

    if (loading) return <div className="p-8 text-center">{dict.common.loading}</div>
    if (!entry) return <div className="p-8 text-center">Entry not found</div>

    const totalDebit = entry.journal_items.reduce((sum: number, item: any) => sum + parseFloat(item.debit), 0)
    const totalCredit = entry.journal_items.reduce((sum: number, item: any) => sum + parseFloat(item.credit), 0)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Posted': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> {dict.finance.posted}</Badge>
            case 'Draft': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200"><Clock className="h-3 w-3 mr-1" /> {dict.finance.draft}</Badge>
            case 'Cancelled': return <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100"><XCircle className="h-3 w-3 mr-1" /> {dict.finance.cancelled}</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/finance/journal')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> {dict.common.back}
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{entry.entry_number}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <CardDescription>{format(new Date(entry.date), "PPP")}</CardDescription>
                            <span>•</span>
                            {getStatusBadge(entry.status)}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => printDocument()}>
                        <Printer className="h-4 w-4 mr-2" /> {locale === 'ar' ? 'طباعة' : 'Print'}
                    </Button>
                </div>
            </div>

            <div className="print-area">
                <Card className="border-none shadow-xl">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                    {locale === 'ar' ? 'تفاصيل القيد' : 'Entry Details'}
                                </CardTitle>
                                <CardDescription>{entry.description || (locale === 'ar' ? 'لا يوجد وصف' : 'No description')}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase font-bold text-slate-500">{locale === 'ar' ? 'المرجع' : 'Reference'}</p>
                                <p className="font-medium">{entry.reference || '-'}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 text-left">{locale === 'ar' ? 'الحساب' : 'Account'}</th>
                                    <th className="p-4 text-left">{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                                    <th className="p-4 text-right">{locale === 'ar' ? 'مدين' : 'Debit'}</th>
                                    <th className="p-4 text-right">{locale === 'ar' ? 'دائن' : 'Credit'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entry.journal_items.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="p-4">
                                            <p className="font-bold text-slate-900">{item.account.code}</p>
                                            <p className="text-xs text-muted-foreground">{locale === 'ar' ? item.account.name_ar : item.account.name}</p>
                                        </td>
                                        <td className="p-4 text-slate-600 italic">
                                            {item.description || entry.description}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold">
                                            {item.debit > 0 ? formatMoney(item.debit) : '-'}
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold">
                                            {item.credit > 0 ? formatMoney(item.credit) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 font-bold border-t">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase text-xs tracking-wider text-slate-500">
                                        {locale === 'ar' ? 'الإجمالي' : 'Totals'}
                                    </td>
                                    <td className="p-4 text-right font-mono text-indigo-600">{formatMoney(totalDebit)}</td>
                                    <td className="p-4 text-right font-mono text-indigo-600">{formatMoney(totalCredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .no-print, header, aside, .SidebarTrigger, nav, button {
                        display: none !important;
                    }
                    .print-area {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    .shadow-xl {
                        box-shadow: none !important;
                    }
                    .border-none {
                        border: 1px solid #e2e8f0 !important;
                    }
                }
            `}</style>
        </div>
    )
}
