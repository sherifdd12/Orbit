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

        if (error) {
            console.error('Error fetching transactions:', error)
        } else {
            setTransactions(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const handleAddTransaction = async () => {
        if (!newTx.description || !newTx.amount) return alert("Description and Amount are required")

        const { error } = await supabase.from('finance_records').insert([newTx])

        if (error) {
            alert("Error adding transaction: " + error.message)
        } else {
            setIsAddOpen(false)
            setNewTx({
                description: '',
                amount: 0,
                type: 'Expense',
                category: '',
                date: new Date().toISOString().split('T')[0]
            })
            fetchTransactions()
        }
    }

    // Totals
    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const balance = totalIncome - totalExpenses

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
                    <p className="text-muted-foreground text-sm">
                        Monitor cash flow, manage invoices, and track business expenses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Report
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Transaction</DialogTitle>
                                <DialogDescription>Record a new income or expense entry.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={newTx.description}
                                        onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                                        placeholder="e.g. Office Supplies"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Amount</Label>
                                        <Input
                                            type="number"
                                            value={newTx.amount}
                                            onChange={e => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newTx.type}
                                            onChange={e => setNewTx({ ...newTx, type: e.target.value as 'Income' | 'Expense' })}
                                        >
                                            <option value="Expense">Expense</option>
                                            <option value="Income">Income</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input
                                        value={newTx.category}
                                        onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                                        placeholder="e.g. Rent, Materials, Sales"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={newTx.date}
                                        onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTransaction}>Save Transaction</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-950 text-slate-50 border-none shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">${totalIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">${totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest financial activity across your business.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                        <TableCell>{tx.category}</TableCell>
                                        <TableCell className={`text-right font-mono font-bold ${tx.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.type === 'Income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No transactions recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

