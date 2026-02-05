"use client"

import * as React from "react"
import {
    Search,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Calendar,
    Printer
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface LedgerEntry {
    id: string
    date: string
    description: string
    debit: number
    credit: number
    balance: number
    entry_number: string
    account_id?: string
}

export default function GeneralLedgerPage() {
    const { dict, locale } = useLanguage()
    const { currency } = useSettings()
    const [accounts, setAccounts] = React.useState<{ id: string, name: string, code: string, name_ar: string, type: string }[]>([])
    const [entries, setEntries] = React.useState<LedgerEntry[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedAccountId, setSelectedAccountId] = React.useState("")
    const [dateRange, setDateRange] = React.useState({
        start: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd")
    })

    const supabase = createClient()

    const fetchAccounts = React.useCallback(async () => {
        const { data } = await supabase.from('accounts').select('*').order('code')
        if (data) setAccounts(data)
    }, [supabase])

    React.useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const fetchLedger = React.useCallback(async () => {
        if (!selectedAccountId) return
        setLoading(true)

        // Fetch journal items for the selected account within date range
        const { data, error } = await supabase
            .from('journal_items')
            .select(`
                id,
                debit,
                credit,
                description,
                journal_entries (
                    date,
                    entry_number
                )
            `)
            .eq('account_id', selectedAccountId)
            .gte('journal_entries.date', dateRange.start)
            .lte('journal_entries.date', dateRange.end)
            .order('journal_entries(date)', { ascending: true })

        if (!error && data) {
            let runningBalance = 0
            const processed = data.map((item: any) => {
                const debit = parseFloat(item.debit) || 0
                const credit = parseFloat(item.credit) || 0
                // Simple balance: debit - credit. 
                // Actual logic depends on account type (Asset/Exp: Dr-Cr, Liab/Eq/Inc: Cr-Dr)
                const account = accounts.find(a => a.id === selectedAccountId)
                const isNormalDebit = account?.type === 'Asset' || account?.type === 'Expense'

                if (isNormalDebit) runningBalance += (debit - credit)
                else runningBalance += (credit - debit)

                return {
                    id: item.id,
                    date: item.journal_entries?.date,
                    entry_number: item.journal_entries?.entry_number,
                    description: item.description,
                    debit,
                    credit,
                    balance: runningBalance
                }
            })
            setEntries(processed)
        }
        setLoading(false)
    }, [supabase, selectedAccountId, dateRange, accounts])

    React.useEffect(() => {
        if (selectedAccountId) fetchLedger()
    }, [fetchLedger, selectedAccountId])

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0)
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.finance.generalLedger}</h2>
                    <p className="text-muted-foreground text-sm">Detailed transaction history per account.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Printer className="h-4 w-4 mr-2" /> Print</Button>
                    <Button variant="outline"><Download className="h-4 w-4 mr-2" /> {dict.common.export}</Button>
                </div>
            </div>

            <Card className="border-none shadow-md bg-white">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <Label>{dict.finance.account}</Label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={selectedAccountId}
                                onChange={e => setSelectedAccountId(e.target.value)}
                            >
                                <option value="">Select Account...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {locale === 'ar' ? acc.name_ar : acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedAccountId ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-emerald-50/50 border-emerald-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-2">
                                    <ArrowUpRight className="h-4 w-4" /> Total Debit
                                </CardTitle>
                                <div className="text-2xl font-bold text-emerald-700">{totalDebit.toLocaleString()} {currency}</div>
                            </CardHeader>
                        </Card>
                        <Card className="bg-rose-50/50 border-rose-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-rose-600 flex items-center gap-2">
                                    <ArrowDownLeft className="h-4 w-4" /> Total Credit
                                </CardTitle>
                                <div className="text-2xl font-bold text-rose-700">{totalCredit.toLocaleString()} {currency}</div>
                            </CardHeader>
                        </Card>
                        <Card className="bg-blue-50/50 border-blue-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                                    <Wallet className="h-4 w-4" /> Net Balance
                                </CardTitle>
                                <div className="text-2xl font-bold text-blue-700">{(totalDebit - totalCredit).toLocaleString()} {currency}</div>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card className="border-none shadow-xl">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">{dict.common.date}</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>{dict.common.description}</TableHead>
                                        <TableHead className="text-right">{dict.finance.debit}</TableHead>
                                        <TableHead className="text-right">{dict.finance.credit}</TableHead>
                                        <TableHead className="text-right pr-6">{dict.finance.balance}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                    ) : entries.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-20">No transactions found for this period.</TableCell></TableRow>
                                    ) : (
                                        entries.map((e, idx) => (
                                            <TableRow key={e.id} className="hover:bg-slate-50/50">
                                                <TableCell className="pl-6 font-mono text-xs">
                                                    {format(new Date(e.date), "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="font-bold text-blue-600 text-xs">
                                                    {e.entry_number}
                                                </TableCell>
                                                <TableCell className="text-sm italic text-muted-foreground">
                                                    {e.description}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-emerald-600">
                                                    {e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-rose-600">
                                                    {e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-mono font-bold">
                                                    {e.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50 rounded-xl border-2 border-dashed">
                    <Wallet className="h-12 w-12 text-slate-300" />
                    <div>
                        <h3 className="font-bold text-lg text-slate-600">No Account Selected</h3>
                        <p className="text-sm text-slate-400">Please select an account from the filters above to view its ledger entries.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
