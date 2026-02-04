"use client"

import * as React from "react"
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    AlertCircle,
    CheckCircle
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface JournalLine {
    account_id: string
    debit: number
    credit: number
    description: string
}

export default function NewJournalEntryPage() {
    const { dict, locale } = useLanguage()
    const router = useRouter()
    const supabase = createClient()

    const [accounts, setAccounts] = React.useState<{ id: string, name: string, code: string, name_ar: string }[]>([])
    const [loading, setLoading] = React.useState(false)
    const [fetching, setFetching] = React.useState(true)

    // Form state
    const [header, setHeader] = React.useState({
        entry_number: `JE-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: ''
    })

    const [lines, setLines] = React.useState<JournalLine[]>([
        { account_id: '', debit: 0, credit: 0, description: '' },
        { account_id: '', debit: 0, credit: 0, description: '' }
    ])

    const fetchAccounts = React.useCallback(async () => {
        const { data } = await supabase.from('accounts').select('id, name, name_ar, code').order('code')
        if (data) setAccounts(data)
        setFetching(false)
    }, [supabase])

    React.useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const addLine = () => setLines([...lines, { account_id: '', debit: 0, credit: 0, description: '' }])

    const removeLine = (index: number) => {
        if (lines.length <= 2) return
        setLines(lines.filter((_, i) => i !== index))
    }

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines]
        newLines[index] = { ...newLines[index], [field]: value }

        // Ensure same row can't have both debit and credit
        if (field === 'debit' && value > 0) newLines[index].credit = 0
        if (field === 'credit' && value > 0) newLines[index].debit = 0

        setLines(newLines)
    }

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    const difference = totalDebit - totalCredit
    const isBalanced = totalDebit > 0 && totalDebit === totalCredit

    const handleSave = async (status: 'Draft' | 'Posted') => {
        if (!isBalanced && status === 'Posted') {
            return alert("Journal entry must be balanced to post.")
        }
        if (lines.some(l => !l.account_id)) {
            return alert("All lines must have an account.")
        }

        setLoading(true)

        // 1. Create header
        const { data: entry, error: headError } = await supabase.from('journal_entries').insert([{
            ...header,
            status
        }]).select().single()

        if (headError) {
            alert(headError.message)
            setLoading(false)
            return
        }

        // 2. Create items
        const itemsToInsert = lines.map(line => ({
            journal_entry_id: entry.id,
            account_id: line.account_id,
            debit: line.debit,
            credit: line.credit,
            description: line.description || header.description
        }))

        const { error: itemsError } = await supabase.from('journal_items').insert(itemsToInsert)

        if (itemsError) {
            alert(itemsError.message)
        } else {
            router.push('/finance/journal')
        }
        setLoading(false)
    }

    if (fetching) return <div className="p-8 text-center">{dict.common.loading}</div>

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> {dict.common.back}
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">{dict.finance.newEntry}</h2>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>Enter basic information about this journal entry.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label>Entry Number</Label>
                            <Input value={header.entry_number} onChange={e => setHeader({ ...header, entry_number: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>{dict.common.date}</Label>
                            <Input type="date" value={header.date} onChange={e => setHeader({ ...header, date: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Reference (Optional)</Label>
                            <Input placeholder="e.g. Inv#102, Bank Slip, etc." value={header.reference} onChange={e => setHeader({ ...header, reference: e.target.value })} />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <Label>{dict.common.description}</Label>
                        <Input placeholder="General description for this entry..." value={header.description} onChange={e => setHeader({ ...header, description: e.target.value })} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Journal Lines</CardTitle>
                        <CardDescription className="text-slate-400">Add debit and credit accounts.</CardDescription>
                    </div>
                    <Button variant="secondary" size="sm" onClick={addLine}>
                        <Plus className="h-4 w-4 mr-1" /> Add Line
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 text-left w-64">{dict.finance.account}</th>
                                    <th className="p-4 text-left">{dict.common.description}</th>
                                    <th className="p-4 text-right w-36">{dict.finance.debit}</th>
                                    <th className="p-4 text-right w-36">{dict.finance.credit}</th>
                                    <th className="p-4 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="p-2">
                                            <select
                                                className="w-full border-none bg-transparent focus:ring-0 text-sm"
                                                value={line.account_id}
                                                onChange={e => updateLine(idx, 'account_id', e.target.value)}
                                            >
                                                <option value="">Select Account...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.code} - {locale === 'ar' ? acc.name_ar : acc.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                className="w-full border-none bg-transparent focus:ring-0 text-sm italic"
                                                placeholder="Line description..."
                                                value={line.description}
                                                onChange={e => updateLine(idx, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full border-none bg-transparent focus:ring-0 text-right font-mono"
                                                value={line.debit || ''}
                                                onChange={e => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                className="w-full border-none bg-transparent focus:ring-0 text-right font-mono"
                                                value={line.credit || ''}
                                                onChange={e => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button className="text-slate-300 hover:text-rose-500" onClick={() => removeLine(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 font-bold border-t">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right uppercase text-xs tracking-wider text-slate-500">Totals</td>
                                    <td className="p-4 text-right font-mono">{totalDebit.toFixed(2)}</td>
                                    <td className="p-4 text-right font-mono">{totalCredit.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-100/50 p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isBalanced ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                <CheckCircle className="h-5 w-5" /> Balanced
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                                <AlertCircle className="h-5 w-5" /> Difference: {difference.toFixed(2)}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" disabled={loading} onClick={() => handleSave('Draft')}>Save as Draft</Button>
                        <Button disabled={!isBalanced || loading} onClick={() => handleSave('Posted')}>
                            <Save className="h-4 w-4 mr-2" /> Post Entry
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
