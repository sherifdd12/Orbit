"use client"

import * as React from "react"
import {
    Landmark,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Upload,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    Trash2,
    Link2,
    Unlink,
    Calendar,
    DollarSign,
    FileText,
    RefreshCcw,
    Scale,
    ArrowDownLeft,
    ArrowUpRight,
    Check
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface BankAccount {
    id: string
    account_name: string
    account_number: string
    bank_name: string
    currency: string
    current_balance: number
}

interface BankReconciliation {
    id: string
    bank_account_id: string
    statement_date: string
    statement_ending_balance: number
    book_balance: number
    reconciled_balance: number | null
    difference: number
    status: string
    notes: string | null
    created_at: string
    bank_accounts?: { account_name: string; bank_name: string }
}

interface BankTransaction {
    id: string
    reconciliation_id: string
    transaction_date: string
    description: string
    reference: string | null
    debit_amount: number
    credit_amount: number
    transaction_type: string
    is_matched: boolean
    matched_transaction_id: string | null
    created_at: string
}

interface SystemTransaction {
    id: string
    date: string
    description: string
    amount: number
    type: 'debit' | 'credit'
    reference: string
    matched: boolean
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    Draft: { color: 'bg-slate-100 text-slate-600', icon: FileText, label: 'Draft' },
    InProgress: { color: 'bg-blue-100 text-blue-700', icon: RefreshCcw, label: 'In Progress' },
    Completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Completed' },
    Discrepancy: { color: 'bg-rose-100 text-rose-700', icon: AlertCircle, label: 'Discrepancy' },
}

export default function BankReconciliationPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [reconciliations, setReconciliations] = React.useState<BankReconciliation[]>([])
    const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
    const [bankTransactions, setBankTransactions] = React.useState<BankTransaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("reconciliations")

    // Create Reconciliation Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newReconciliation, setNewReconciliation] = React.useState({
        bank_account_id: '',
        statement_date: format(new Date(), 'yyyy-MM-dd'),
        statement_ending_balance: 0,
        notes: ''
    })

    // Add Transaction Dialog
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = React.useState(false)
    const [selectedReconciliation, setSelectedReconciliation] = React.useState<BankReconciliation | null>(null)
    const [newTransaction, setNewTransaction] = React.useState({
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        reference: '',
        debit_amount: 0,
        credit_amount: 0,
        transaction_type: 'Deposit'
    })

    // View/Match Transactions Dialog
    const [isMatchDialogOpen, setIsMatchDialogOpen] = React.useState(false)
    const [selectedTransactions, setSelectedTransactions] = React.useState<string[]>([])

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [reconciliationsRes, accountsRes] = await Promise.all([
            supabase.from('bank_reconciliations').select('*, bank_accounts(account_name, bank_name)').order('created_at', { ascending: false }),
            supabase.from('bank_accounts').select('*').eq('is_active', true)
        ])

        if (!reconciliationsRes.error) setReconciliations(reconciliationsRes.data || [])
        if (!accountsRes.error) setBankAccounts(accountsRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const fetchTransactions = async (reconciliationId: string) => {
        const { data, error } = await supabase
            .from('bank_statement_lines')
            .select('*')
            .eq('reconciliation_id', reconciliationId)
            .order('transaction_date', { ascending: false })

        if (!error) setBankTransactions(data || [])
    }

    const handleCreateReconciliation = async () => {
        if (!newReconciliation.bank_account_id) {
            return alert(isArabic ? 'الحساب البنكي مطلوب' : 'Bank account is required')
        }

        const bankAccount = bankAccounts.find(a => a.id === newReconciliation.bank_account_id)
        const bookBalance = bankAccount?.current_balance || 0
        const difference = newReconciliation.statement_ending_balance - bookBalance

        const { error } = await supabase.from('bank_reconciliations').insert([{
            ...newReconciliation,
            book_balance: bookBalance,
            difference: difference,
            status: 'Draft'
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsCreateDialogOpen(false)
            setNewReconciliation({
                bank_account_id: '',
                statement_date: format(new Date(), 'yyyy-MM-dd'),
                statement_ending_balance: 0,
                notes: ''
            })
            fetchData()
        }
    }

    const handleAddTransaction = async () => {
        if (!selectedReconciliation || !newTransaction.description) {
            return alert(isArabic ? 'الوصف مطلوب' : 'Description is required')
        }

        const { error } = await supabase.from('bank_statement_lines').insert([{
            reconciliation_id: selectedReconciliation.id,
            ...newTransaction,
            is_matched: false
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsTransactionDialogOpen(false)
            setNewTransaction({
                transaction_date: format(new Date(), 'yyyy-MM-dd'),
                description: '',
                reference: '',
                debit_amount: 0,
                credit_amount: 0,
                transaction_type: 'Deposit'
            })
            if (selectedReconciliation) {
                fetchTransactions(selectedReconciliation.id)
            }
        }
    }

    const handleMatchTransactions = async () => {
        if (selectedTransactions.length === 0) return

        const { error } = await supabase
            .from('bank_statement_lines')
            .update({ is_matched: true })
            .in('id', selectedTransactions)

        if (error) {
            alert(error.message)
        } else {
            setSelectedTransactions([])
            if (selectedReconciliation) {
                fetchTransactions(selectedReconciliation.id)
                // Recalculate reconciled balance
                recalculateReconciliation(selectedReconciliation.id)
            }
        }
    }

    const recalculateReconciliation = async (reconciliationId: string) => {
        const { data: transactions } = await supabase
            .from('bank_statement_lines')
            .select('*')
            .eq('reconciliation_id', reconciliationId)
            .eq('is_matched', true)

        const matchedCredits = (transactions || []).reduce((sum, t) => sum + (t.credit_amount || 0), 0)
        const matchedDebits = (transactions || []).reduce((sum, t) => sum + (t.debit_amount || 0), 0)
        const reconciledBalance = matchedCredits - matchedDebits

        const reconciliation = reconciliations.find(r => r.id === reconciliationId)
        if (reconciliation) {
            const newDifference = reconciliation.statement_ending_balance - reconciledBalance - reconciliation.book_balance
            await supabase.from('bank_reconciliations').update({
                reconciled_balance: reconciledBalance,
                difference: newDifference
            }).eq('id', reconciliationId)
            fetchData()
        }
    }

    const handleCompleteReconciliation = async (reconciliation: BankReconciliation) => {
        const newStatus = reconciliation.difference === 0 ? 'Completed' : 'Discrepancy'
        const { error } = await supabase.from('bank_reconciliations').update({
            status: newStatus,
            reconciled_at: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }).eq('id', reconciliation.id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeleteReconciliation = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this reconciliation?')) return

        // Delete transactions first
        await supabase.from('bank_statement_lines').delete().eq('reconciliation_id', id)
        const { error } = await supabase.from('bank_reconciliations').delete().eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    const openMatchDialog = async (reconciliation: BankReconciliation) => {
        setSelectedReconciliation(reconciliation)
        await fetchTransactions(reconciliation.id)
        setIsMatchDialogOpen(true)
    }

    const openAddTransactionDialog = (reconciliation: BankReconciliation) => {
        setSelectedReconciliation(reconciliation)
        setIsTransactionDialogOpen(true)
    }

    // Stats
    const stats = {
        totalReconciliations: reconciliations.length,
        completed: reconciliations.filter(r => r.status === 'Completed').length,
        pending: reconciliations.filter(r => r.status === 'Draft' || r.status === 'InProgress').length,
        discrepancies: reconciliations.filter(r => r.status === 'Discrepancy').length,
        totalDiscrepancy: reconciliations.reduce((sum, r) => sum + Math.abs(r.difference || 0), 0)
    }

    const filteredReconciliations = reconciliations.filter(r =>
        r.bank_accounts?.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.bank_accounts?.bank_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isArabic ? 'مطابقة البنك' : 'Bank Reconciliation'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'مطابقة كشوف الحسابات البنكية مع السجلات الداخلية' : 'Match bank statements with internal records'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'مطابقة جديدة' : 'New Reconciliation'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'بدء مطابقة جديدة' : 'Start New Reconciliation'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الحساب البنكي' : 'Bank Account'} *</Label>
                                    <Select
                                        value={newReconciliation.bank_account_id}
                                        onValueChange={(v) => setNewReconciliation({ ...newReconciliation, bank_account_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isArabic ? 'اختر الحساب' : 'Select account'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    <div className="flex flex-col">
                                                        <span>{account.account_name}</span>
                                                        <span className="text-xs text-muted-foreground">{account.bank_name} - {account.account_number}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'تاريخ الكشف' : 'Statement Date'} *</Label>
                                    <Input
                                        type="date"
                                        value={newReconciliation.statement_date}
                                        onChange={(e) => setNewReconciliation({ ...newReconciliation, statement_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'رصيد كشف البنك' : 'Statement Ending Balance'} *</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={newReconciliation.statement_ending_balance}
                                        onChange={(e) => setNewReconciliation({ ...newReconciliation, statement_ending_balance: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                    <Textarea
                                        value={newReconciliation.notes}
                                        onChange={(e) => setNewReconciliation({ ...newReconciliation, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreateReconciliation}>{isArabic ? 'بدء المطابقة' : 'Start Reconciliation'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                            <Scale className="h-3 w-3" /> {isArabic ? 'المطابقات' : 'Reconciliations'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.totalReconciliations}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {isArabic ? 'مكتمل' : 'Completed'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{stats.completed}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <RefreshCcw className="h-3 w-3" /> {isArabic ? 'قيد المعالجة' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {isArabic ? 'فروقات' : 'Discrepancies'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{stats.discrepancies}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">
                            {isArabic ? 'إجمالي الفروقات' : 'Total Difference'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold">{formatMoney(stats.totalDiscrepancy)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Reconciliations Table */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isArabic ? 'بحث...' : 'Search reconciliations...'}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-6">{isArabic ? 'الحساب البنكي' : 'Bank Account'}</TableHead>
                                    <TableHead>{isArabic ? 'تاريخ الكشف' : 'Statement Date'}</TableHead>
                                    <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-right">{isArabic ? 'رصيد الكشف' : 'Statement Balance'}</TableHead>
                                    <TableHead className="text-right">{isArabic ? 'رصيد الدفاتر' : 'Book Balance'}</TableHead>
                                    <TableHead className="text-right">{isArabic ? 'الفرق' : 'Difference'}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell>
                                    </TableRow>
                                ) : filteredReconciliations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                            {isArabic ? 'لا توجد مطابقات' : 'No reconciliations found'}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredReconciliations.map(reconciliation => {
                                    const statusInfo = statusConfig[reconciliation.status] || statusConfig.Draft
                                    const StatusIcon = statusInfo.icon
                                    return (
                                        <TableRow key={reconciliation.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <Landmark className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{reconciliation.bank_accounts?.account_name}</span>
                                                        <span className="text-xs text-muted-foreground">{reconciliation.bank_accounts?.bank_name}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    {format(new Date(reconciliation.statement_date), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(reconciliation.statement_ending_balance)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(reconciliation.book_balance)}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-mono font-bold ${reconciliation.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {reconciliation.difference === 0 ? (
                                                        <span className="flex items-center justify-end gap-1">
                                                            <CheckCircle2 className="h-4 w-4" /> Balanced
                                                        </span>
                                                    ) : formatMoney(reconciliation.difference)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>{isArabic ? 'العمليات' : 'Actions'}</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => openMatchDialog(reconciliation)}>
                                                            <Link2 className="h-4 w-4 mr-2" /> {isArabic ? 'مطابقة المعاملات' : 'Match Transactions'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openAddTransactionDialog(reconciliation)}>
                                                            <Plus className="h-4 w-4 mr-2" /> {isArabic ? 'إضافة معاملة' : 'Add Transaction'}
                                                        </DropdownMenuItem>
                                                        {reconciliation.status !== 'Completed' && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleCompleteReconciliation(reconciliation)} className="text-emerald-600 font-bold">
                                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> {isArabic ? 'إتمام المطابقة' : 'Complete'}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteReconciliation(reconciliation.id)}>
                                                            <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Accounts Summary */}
            <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-blue-600" />
                        {isArabic ? 'الحسابات البنكية' : 'Bank Accounts'}
                    </CardTitle>
                    <CardDescription>{isArabic ? 'ملخص أرصدة الحسابات البنكية' : 'Summary of bank account balances'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {bankAccounts.map(account => (
                            <div key={account.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-slate-50/50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="h-5 w-5 text-blue-600" />
                                        <span className="font-bold">{account.account_name}</span>
                                    </div>
                                    <Badge variant="outline">{account.currency}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{account.account_number}</p>
                                <div className="mt-3 pt-3 border-t">
                                    <span className="text-sm text-muted-foreground">{isArabic ? 'الرصيد الحالي' : 'Current Balance'}</span>
                                    <p className="text-xl font-bold text-emerald-600">{formatMoney(account.current_balance)}</p>
                                </div>
                            </div>
                        ))}
                        {bankAccounts.length === 0 && (
                            <div className="col-span-3 text-center py-10 text-muted-foreground">
                                {isArabic ? 'لا توجد حسابات بنكية مسجلة' : 'No bank accounts configured'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Match Transactions Dialog */}
            <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'مطابقة المعاملات' : 'Match Transactions'}</DialogTitle>
                    </DialogHeader>
                    {selectedReconciliation && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'رصيد الكشف' : 'Statement Balance'}</span>
                                    <p className="font-bold">{formatMoney(selectedReconciliation.statement_ending_balance)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'رصيد الدفاتر' : 'Book Balance'}</span>
                                    <p className="font-bold">{formatMoney(selectedReconciliation.book_balance)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'الفرق' : 'Difference'}</span>
                                    <p className={`font-bold ${selectedReconciliation.difference === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatMoney(selectedReconciliation.difference)}
                                    </p>
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedTransactions.length === bankTransactions.filter(t => !t.is_matched).length && bankTransactions.length > 0}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedTransactions(bankTransactions.filter(t => !t.is_matched).map(t => t.id))
                                                    } else {
                                                        setSelectedTransactions([])
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead>{isArabic ? 'الوصف' : 'Description'}</TableHead>
                                        <TableHead>{isArabic ? 'المرجع' : 'Reference'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'مدين' : 'Debit'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'دائن' : 'Credit'}</TableHead>
                                        <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                {isArabic ? 'لا توجد معاملات. أضف معاملات من كشف البنك.' : 'No transactions. Add transactions from bank statement.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : bankTransactions.map(transaction => (
                                        <TableRow key={transaction.id} className={transaction.is_matched ? 'bg-emerald-50/30' : ''}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedTransactions.includes(transaction.id) || transaction.is_matched}
                                                    disabled={transaction.is_matched}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedTransactions([...selectedTransactions, transaction.id])
                                                        } else {
                                                            setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id))
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd')}</TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell className="font-mono text-xs">{transaction.reference || '-'}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {transaction.debit_amount > 0 && (
                                                    <span className="text-rose-600 flex items-center justify-end gap-1">
                                                        <ArrowUpRight className="h-3 w-3" />
                                                        {formatMoney(transaction.debit_amount)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {transaction.credit_amount > 0 && (
                                                    <span className="text-emerald-600 flex items-center justify-end gap-1">
                                                        <ArrowDownLeft className="h-3 w-3" />
                                                        {formatMoney(transaction.credit_amount)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {transaction.is_matched ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-none gap-1">
                                                        <Check className="h-3 w-3" /> Matched
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-600">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={handleMatchTransactions} disabled={selectedTransactions.length === 0}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isArabic ? 'مطابقة المحدد' : 'Match Selected'} ({selectedTransactions.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Transaction Dialog */}
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'إضافة معاملة بنكية' : 'Add Bank Transaction'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{isArabic ? 'التاريخ' : 'Date'} *</Label>
                            <Input
                                type="date"
                                value={newTransaction.transaction_date}
                                onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'الوصف' : 'Description'} *</Label>
                            <Input
                                value={newTransaction.description}
                                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'المرجع' : 'Reference'}</Label>
                            <Input
                                value={newTransaction.reference}
                                onChange={(e) => setNewTransaction({ ...newTransaction, reference: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'النوع' : 'Type'}</Label>
                            <Select
                                value={newTransaction.transaction_type}
                                onValueChange={(v) => setNewTransaction({ ...newTransaction, transaction_type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Deposit">Deposit (Credit)</SelectItem>
                                    <SelectItem value="Withdrawal">Withdrawal (Debit)</SelectItem>
                                    <SelectItem value="Transfer">Transfer</SelectItem>
                                    <SelectItem value="Fee">Bank Fee</SelectItem>
                                    <SelectItem value="Interest">Interest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isArabic ? 'مدين' : 'Debit'}</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={newTransaction.debit_amount}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, debit_amount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{isArabic ? 'دائن' : 'Credit'}</Label>
                                <Input
                                    type="number"
                                    step="0.001"
                                    value={newTransaction.credit_amount}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, credit_amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>{dict.common.cancel}</Button>
                        <Button onClick={handleAddTransaction}>{isArabic ? 'إضافة' : 'Add Transaction'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
