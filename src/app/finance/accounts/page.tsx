"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    MoreHorizontal,
    FileText,
    Filter,
    Download,
    Eye,
    Edit,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    XCircle,
    ArrowUpDown
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useLanguage } from "@/lib/i18n/LanguageContext"

import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Account {
    id: string
    code: string
    name: string
    type: string
    category: string
    balance: number
    currency: string
    status: 'Active' | 'Inactive'
}

export default function ChartOfAccountsPage() {
    const { dict, locale } = useLanguage()
    const { currency, formatMoney } = useSettings()
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('code')

        if (!error && data) {
            setAccounts(data as Account[])
        } else {
            // Mock data for premium UI display if table is empty or missing
            setAccounts([
                { id: '1', code: '1010', name: 'Cash at Bank', type: 'Asset', category: 'Current Asset', balance: 450000.00, currency: currency, status: 'Active' },
                { id: '2', code: '1200', name: 'Accounts Receivable', type: 'Asset', category: 'Current Asset', balance: 125000.50, currency: currency, status: 'Active' },
                { id: '3', code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liability', balance: 85000.00, currency: currency, status: 'Active' },
                { id: '4', code: '4000', name: 'Sales Revenue', type: 'Revenue', category: 'Operating Income', balance: 1200000.00, currency: currency, status: 'Active' },
                { id: '5', code: '5000', name: 'Cost of Goods Sold', type: 'Expense', category: 'Direct Cost', balance: 750000.00, currency: currency, status: 'Active' },
            ])
        }
        setLoading(false)
    }, [supabase, currency])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'asset': return 'text-emerald-600 bg-emerald-50'
            case 'liability': return 'text-rose-600 bg-rose-50'
            case 'equity': return 'text-indigo-600 bg-indigo-50'
            case 'revenue': return 'text-blue-600 bg-blue-50'
            case 'expense': return 'text-orange-600 bg-orange-50'
            default: return 'text-slate-600 bg-slate-50'
        }
    }

    const filtered = accounts.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{dict.finance.chartOfAccounts}</h2>
                    <p className="text-slate-500 font-medium">Define your fiscal structure, categorize ledgers, and monitor real-time balances.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 shadow-sm"><Download className="h-4 w-4 mr-2" /> Export COA</Button>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-100 border-none h-11 px-6">
                        <Plus className="mr-2 h-4 w-4" /> Create Ledger Account
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Total Asset Value</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-600">{currency} {accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Total Liabilities</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-600">{currency} {accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Net Revenue (YTD)</CardDescription>
                        <CardTitle className="text-2xl font-black text-blue-600">{currency} 1.2M</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Operational Expenses</CardDescription>
                        <CardTitle className="text-2xl font-black text-orange-600">{currency} 750K</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search accounts by code or name..."
                                className="h-12 pl-12 bg-white border-none shadow-sm text-base rounded-xl"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white"><Filter className="h-4 w-4 mr-2" /> Filter by Type</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-8 py-4 w-32">Account Code</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead>Type & Category</TableHead>
                                    <TableHead className="text-right">Current Balance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic animate-pulse">Syncing Fiscal Ledger...</TableCell></TableRow>
                                ) : filtered.map(account => (
                                    <TableRow key={account.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-6">
                                            <span className="font-mono font-black text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded tracking-widest">{account.code}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg group-hover:text-primary transition-colors">{account.name}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{account.category}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`border-none font-black text-[10px] uppercase tracking-wider ${getTypeColor(account.type)}`}>
                                                {account.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-6">
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-black text-lg text-slate-800">
                                                    {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{account.currency}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={account.status === 'Active' ? 'outline' : 'secondary'} className={account.status === 'Active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50/30' : ''}>
                                                {account.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-5 w-5" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none p-2">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Operations</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2 p-3 rounded-lg"><Eye className="h-4 w-4" /> View Ledger (G/L)</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 p-3 rounded-lg"><Edit className="h-4 w-4" /> Modify Definition</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                    <DropdownMenuItem className="gap-2 p-3 rounded-lg text-blue-600 font-bold"><ArrowRightLeft className="h-4 w-4" /> Internal Transfer</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
