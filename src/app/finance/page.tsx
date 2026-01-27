"use client"

import * as React from "react"
import {
    DollarSign,
    Download,
    Plus,
    TrendingDown,
    TrendingUp,
    Loader2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const runtime = 'edge';

interface Transaction {
    id: string
    date: string
    description: string
    category: string
    amount: number
    type: 'Income' | 'Expense'
}

export default function FinancePage() {
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newTx, setNewTx] = React.useState({
        description: '',
        amount: 0,
        type: 'Expense' as 'Income' | 'Expense',
        category: '',
        date: new Date().toISOString().split('T')[0]
    })

    const supabase = createClient()

    const fetchTransactions = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('finance_records')
            .select('*')
            .order('date', { ascending: false })

        if (!error) setTransactions(data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleAddTransaction = async () => {
        if (!newTx.description || !newTx.amount) return alert("Description and Amount are required")
        const { error } = await supabase.from('finance_records').insert([newTx])
        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewTx({ description: '', amount: 0, type: 'Expense', category: '', date: new Date().toISOString().split('T')[0] })
            fetchTransactions()
        }
    }

    const exportToCSV = () => {
        const headers = ["Date", "Description", "Category", "Amount", "Type"]
        const csvRows = transactions.map(t => [t.date, t.description, t.category, t.amount, t.type].join(","))
        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "finance_report.csv")
        link.click()
    }

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const balance = totalIncome - totalExpenses

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
                    <p className="text-muted-foreground text-sm">Monitor cash flow and track business expenses.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Transaction</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Description</Label><Input value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Amount</Label><Input type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: Number(e.target.value) })} /></div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select className="w-full border rounded p-2" value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value as any })}>
                                            <option value="Expense">Expense</option>
                                            <option value="Income">Income</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Category</Label><Input value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Date</Label><Input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} /></div>
                            </div>
                            <DialogFooter><Button onClick={handleAddTransaction}>Save</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-950 text-slate-50 border-none shadow-xl">
                    <CardHeader><CardTitle className="text-sm">Net Balance</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">${balance.toLocaleString()}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm">Income</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-emerald-600">${totalIncome.toLocaleString()}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-sm">Expenses</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-rose-600">${totalExpenses.toLocaleString()}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow> : transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell className="font-medium text-slate-900">{tx.description}</TableCell>
                                    <TableCell>{tx.category}</TableCell>
                                    <TableCell className={`text-right font-bold ${tx.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.type === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
