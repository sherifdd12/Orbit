"use client"

import * as React from "react"
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    MoreHorizontal,
    Filter,
    FileText,
    Printer,
    Download,
    Send,
    Trash2,
    DollarSign,
    Calendar,
    Mail,
    CreditCard
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { format, differenceInDays } from "date-fns"

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
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"
import { PrintableDocument } from "@/lib/templates/PrintableDocument"
import { defaultInvoiceTemplate } from "@/lib/templates/documentTemplates"

export const runtime = 'edge';

interface Invoice {
    id: string
    invoice_number: string
    customer_id: string
    sale_order_id?: string
    invoice_date: string
    due_date: string
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
    subtotal: number
    discount: number
    tax_rate: number
    tax_amount: number
    total: number
    amount_paid: number
    notes?: string
    created_at: string
    customer?: {
        id: string
        name: string
        email?: string
        phone?: string
        address?: string
    }
}

export default function InvoicesPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const isArabic = locale === 'ar'

    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [isPrintOpen, setIsPrintOpen] = React.useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null)
    const [customers, setCustomers] = React.useState<{ id: string, name: string, email?: string, phone?: string, address?: string }[]>([])
    const [paymentAmount, setPaymentAmount] = React.useState<number>(0)

    // New invoice form state
    const [newInvoice, setNewInvoice] = React.useState({
        customer_id: '',
        invoice_number: `INV-${Date.now().toString().slice(-8)}`,
        invoice_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        subtotal: 0,
        discount: 0,
        tax_rate: 0,
        notes: ''
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [invoicesRes, customersRes] = await Promise.all([
            supabase.from('invoices').select('*, customer:customers(id, name, email, phone, address)').order('invoice_date', { ascending: false }),
            supabase.from('customers').select('id, name, email, phone, address').order('name')
        ])

        if (!invoicesRes.error) {
            // Check for overdue invoices
            const processedInvoices = (invoicesRes.data || []).map(inv => {
                if (inv.status === 'Sent' && new Date(inv.due_date) < new Date()) {
                    return { ...inv, status: 'Overdue' }
                }
                return inv
            })
            setInvoices(processedInvoices)
        }
        if (!customersRes.error) setCustomers(customersRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    // Create invoice
    const handleCreateInvoice = async () => {
        if (!newInvoice.customer_id) {
            alert(isArabic ? 'يرجى اختيار العميل' : 'Please select a customer')
            return
        }
        if (newInvoice.subtotal <= 0) {
            alert(isArabic ? 'يرجى إدخال المبلغ' : 'Please enter an amount')
            return
        }

        const taxAmount = (newInvoice.subtotal - newInvoice.discount) * (newInvoice.tax_rate / 100)
        const total = newInvoice.subtotal - newInvoice.discount + taxAmount

        const { error } = await supabase.from('invoices').insert([{
            ...newInvoice,
            tax_amount: taxAmount,
            total,
            amount_paid: 0,
            status: 'Draft'
        }])

        if (error) {
            alert(error.message)
        } else {
            setIsCreateOpen(false)
            setNewInvoice({
                customer_id: '',
                invoice_number: `INV-${Date.now().toString().slice(-8)}`,
                invoice_date: format(new Date(), "yyyy-MM-dd"),
                due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                subtotal: 0,
                discount: 0,
                tax_rate: 0,
                notes: ''
            })
            fetchData()
        }
    }

    // Update invoice status
    const handleUpdateStatus = async (id: string, newStatus: Invoice['status']) => {
        const { error } = await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    // Record payment
    const handleRecordPayment = async () => {
        if (!selectedInvoice || paymentAmount <= 0) return

        const newAmountPaid = (selectedInvoice.amount_paid || 0) + paymentAmount
        const isPaid = newAmountPaid >= selectedInvoice.total

        const { error } = await supabase
            .from('invoices')
            .update({
                amount_paid: newAmountPaid,
                status: isPaid ? 'Paid' : selectedInvoice.status
            })
            .eq('id', selectedInvoice.id)

        if (error) {
            alert(error.message)
        } else {
            setIsPaymentOpen(false)
            setPaymentAmount(0)
            fetchData()
        }
    }

    // Delete invoice
    const handleDeleteInvoice = async (id: string, invNum: string) => {
        if (!confirm(isArabic ? `هل أنت متأكد من حذف الفاتورة ${invNum}؟` : `Are you sure you want to delete invoice ${invNum}?`)) return

        const { error } = await supabase.from('invoices').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    // Send invoice (email simulation)
    const handleSendInvoice = async (invoice: Invoice) => {
        if (!invoice.customer?.email) {
            alert(isArabic ? 'لا يوجد بريد إلكتروني للعميل' : 'No customer email available')
            return
        }

        // Update status to Sent
        await handleUpdateStatus(invoice.id, 'Sent')
        alert(isArabic ? `تم إرسال الفاتورة إلى ${invoice.customer.email}` : `Invoice sent to ${invoice.customer.email}`)
    }

    // View invoice details
    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsViewOpen(true)
    }

    // Print invoice
    const handlePrintInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsPrintOpen(true)
    }

    // Open payment dialog
    const handleOpenPayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setPaymentAmount(invoice.total - (invoice.amount_paid || 0))
        setIsPaymentOpen(true)
    }

    // Status badge
    const getStatusBadge = (invoice: Invoice) => {
        const daysUntilDue = differenceInDays(new Date(invoice.due_date), new Date())

        const statusConfig = {
            Draft: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
            Sent: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
            Paid: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
            Overdue: { bg: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertCircle },
            Cancelled: { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: FileText }
        }

        const config = statusConfig[invoice.status] || statusConfig.Draft
        const Icon = config.icon

        return (
            <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${config.bg} gap-1`}>
                    <Icon className="h-3 w-3" />
                    {isArabic ? dict.statuses[invoice.status.toLowerCase() as keyof typeof dict.statuses] || invoice.status : invoice.status}
                </Badge>
                {invoice.status === 'Sent' && daysUntilDue <= 7 && daysUntilDue > 0 && (
                    <span className="text-xs text-amber-600">({daysUntilDue}d left)</span>
                )}
            </div>
        )
    }

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Stats
    const stats = {
        draft: invoices.filter(i => i.status === 'Draft').length,
        pending: invoices.filter(i => i.status === 'Sent').length,
        overdue: invoices.filter(i => i.status === 'Overdue').length,
        totalOutstanding: invoices.filter(i => ['Sent', 'Overdue'].includes(i.status)).reduce((sum, i) => sum + (i.total - (i.amount_paid || 0)), 0),
        totalPaid: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sidebar.invoices}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة فواتير العملاء والمدفوعات' : 'Manage customer invoices and payments'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-none">
                                <Plus className="mr-2 h-4 w-4" />
                                {isArabic ? 'فاتورة جديدة' : 'New Invoice'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}</DialogTitle>
                                <DialogDescription>
                                    {isArabic ? 'أدخل تفاصيل الفاتورة' : 'Enter invoice details'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'العميل' : 'Customer'} *</Label>
                                        <Select onValueChange={(val) => setNewInvoice({ ...newInvoice, customer_id: val })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isArabic ? 'اختر العميل...' : 'Select customer...'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'رقم الفاتورة' : 'Invoice Number'}</Label>
                                        <Input value={newInvoice.invoice_number} readOnly className="bg-slate-50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ الفاتورة' : 'Invoice Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newInvoice.invoice_date}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, invoice_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newInvoice.due_date}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'المبلغ' : 'Amount'} *</Label>
                                        <Input
                                            type="number"
                                            value={newInvoice.subtotal || ''}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, subtotal: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.000"
                                            min="0"
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الخصم' : 'Discount'}</Label>
                                        <Input
                                            type="number"
                                            value={newInvoice.discount || ''}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, discount: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.000"
                                            min="0"
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الضريبة %' : 'Tax %'}</Label>
                                        <Input
                                            type="number"
                                            value={newInvoice.tax_rate || ''}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, tax_rate: parseFloat(e.target.value) || 0 })}
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                {/* Total Preview */}
                                <div className="p-4 bg-slate-50 rounded-lg border">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                        <span className="font-mono">{formatMoney(newInvoice.subtotal)}</span>
                                    </div>
                                    {newInvoice.discount > 0 && (
                                        <div className="flex justify-between text-sm text-red-500 mb-2">
                                            <span>{isArabic ? 'الخصم' : 'Discount'}</span>
                                            <span className="font-mono">-{formatMoney(newInvoice.discount)}</span>
                                        </div>
                                    )}
                                    {newInvoice.tax_rate > 0 && (
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>{isArabic ? 'الضريبة' : 'Tax'} ({newInvoice.tax_rate}%)</span>
                                            <span className="font-mono">{formatMoney((newInvoice.subtotal - newInvoice.discount) * (newInvoice.tax_rate / 100))}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-emerald-600">
                                        <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                                        <span className="font-mono">
                                            {formatMoney(
                                                (newInvoice.subtotal - newInvoice.discount) * (1 + newInvoice.tax_rate / 100)
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                    <Textarea
                                        value={newInvoice.notes}
                                        onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                                        placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {dict.common.cancel}
                                </Button>
                                <Button onClick={handleCreateInvoice} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                                    {isArabic ? 'إنشاء الفاتورة' : 'Create Invoice'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-gray-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-600">
                            {isArabic ? 'مسودات' : 'Drafts'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-slate-700">{stats.draft}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600">
                            {isArabic ? 'معلقة' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-amber-700">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600">
                            {isArabic ? 'متأخرة' : 'Overdue'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-rose-700">{stats.overdue}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">
                            {isArabic ? 'مستحقات' : 'Outstanding'}
                        </CardDescription>
                        <CardTitle className="text-2xl text-blue-700">{formatMoney(stats.totalOutstanding)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">
                            {isArabic ? 'المحصل' : 'Collected'}
                        </CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{formatMoney(stats.totalPaid)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Invoices Table */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`${dict.common.search} ${isArabic ? 'الفواتير...' : 'invoices...'}`}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 bg-white">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder={dict.common.filter} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dict.common.all}</SelectItem>
                                    <SelectItem value="Draft">{isArabic ? 'مسودة' : 'Draft'}</SelectItem>
                                    <SelectItem value="Sent">{isArabic ? 'مُرسل' : 'Sent'}</SelectItem>
                                    <SelectItem value="Paid">{isArabic ? 'مدفوع' : 'Paid'}</SelectItem>
                                    <SelectItem value="Overdue">{isArabic ? 'متأخر' : 'Overdue'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="pl-6">{isArabic ? 'الفاتورة' : 'Invoice'}</TableHead>
                                    <TableHead>{dict.operations.customer}</TableHead>
                                    <TableHead>{isArabic ? 'تاريخ الإصدار' : 'Issue Date'}</TableHead>
                                    <TableHead>{isArabic ? 'الاستحقاق' : 'Due Date'}</TableHead>
                                    <TableHead className="text-right">{dict.common.amount}</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                {dict.common.loading}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            {dict.common.noData}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredInvoices.map(inv => (
                                    <TableRow key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <p className="font-bold text-emerald-600">{inv.invoice_number}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{inv.customer?.name}</p>
                                                {inv.customer?.email && (
                                                    <p className="text-xs text-muted-foreground">{inv.customer.email}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(inv.invoice_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(inv.due_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="font-mono font-bold text-emerald-600">{formatMoney(inv.total || 0)}</p>
                                            {inv.amount_paid > 0 && inv.amount_paid < inv.total && (
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic ? 'المدفوع:' : 'Paid:'} {formatMoney(inv.amount_paid)}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(inv)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>{isArabic ? 'إجراءات الفاتورة' : 'Invoice Actions'}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleViewInvoice(inv)} className="gap-2">
                                                        <Eye className="h-4 w-4" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrintInvoice(inv)} className="gap-2">
                                                        <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {inv.status === 'Draft' && (
                                                        <DropdownMenuItem onClick={() => handleSendInvoice(inv)} className="gap-2 text-blue-600">
                                                            <Send className="h-4 w-4" /> {isArabic ? 'إرسال للعميل' : 'Send to Customer'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {['Sent', 'Overdue'].includes(inv.status) && (
                                                        <DropdownMenuItem onClick={() => handleOpenPayment(inv)} className="gap-2 text-emerald-600">
                                                            <DollarSign className="h-4 w-4" /> {isArabic ? 'تسجيل دفعة' : 'Record Payment'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)} className="gap-2 text-rose-600">
                                                        <Trash2 className="h-4 w-4" /> {isArabic ? 'حذف' : 'Delete'}
                                                    </DropdownMenuItem>
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

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تسجيل دفعة' : 'Record Payment'}</DialogTitle>
                        <DialogDescription>
                            {isArabic ? 'أدخل مبلغ الدفعة المستلمة' : 'Enter the payment amount received'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{isArabic ? 'إجمالي الفاتورة' : 'Invoice Total'}</span>
                                    <span className="font-mono font-medium">{formatMoney(selectedInvoice.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2 text-emerald-600">
                                    <span>{isArabic ? 'المدفوع مسبقاً' : 'Previously Paid'}</span>
                                    <span className="font-mono">{formatMoney(selectedInvoice.amount_paid || 0)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 text-rose-600">
                                    <span>{isArabic ? 'المتبقي' : 'Remaining'}</span>
                                    <span className="font-mono">{formatMoney(selectedInvoice.total - (selectedInvoice.amount_paid || 0))}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{isArabic ? 'مبلغ الدفعة' : 'Payment Amount'}</Label>
                                <Input
                                    type="number"
                                    value={paymentAmount || ''}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.001"
                                    max={selectedInvoice.total - (selectedInvoice.amount_paid || 0)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>{dict.common.cancel}</Button>
                        <Button onClick={handleRecordPayment} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isArabic ? 'تسجيل الدفعة' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل الفاتورة' : 'Invoice Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'رقم الفاتورة' : 'Invoice Number'}</p>
                                    <p className="font-bold text-lg text-emerald-600">{selectedInvoice.invoice_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</p>
                                    {getStatusBadge(selectedInvoice)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}</p>
                                    <p className="font-medium">{selectedInvoice.customer?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                                    <p className="font-medium">{format(new Date(selectedInvoice.due_date), "MMM dd, yyyy")}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between mb-2">
                                    <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                                    <span className="font-bold text-xl text-emerald-600">{formatMoney(selectedInvoice.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>{isArabic ? 'المدفوع' : 'Paid'}</span>
                                    <span>{formatMoney(selectedInvoice.amount_paid || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-rose-600 font-medium">
                                    <span>{isArabic ? 'المتبقي' : 'Balance'}</span>
                                    <span>{formatMoney(selectedInvoice.total - (selectedInvoice.amount_paid || 0))}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => { setIsViewOpen(false); handlePrintInvoice(selectedInvoice!) }} className="gap-2">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Dialog */}
            <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none">
                    <DialogHeader className="no-print">
                        <DialogTitle>{isArabic ? 'معاينة الطباعة' : 'Print Preview'}</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <PrintableDocument
                            template={defaultInvoiceTemplate}
                            data={{
                                documentNumber: selectedInvoice.invoice_number,
                                documentDate: selectedInvoice.invoice_date,
                                dueDate: selectedInvoice.due_date,
                                customer: {
                                    name: selectedInvoice.customer?.name || '',
                                    address: selectedInvoice.customer?.address,
                                    phone: selectedInvoice.customer?.phone,
                                    email: selectedInvoice.customer?.email
                                },
                                items: [
                                    { no: 1, description: 'Invoice items', quantity: 1, unit: 'Lot', unitPrice: selectedInvoice.subtotal, total: selectedInvoice.subtotal }
                                ],
                                subtotal: selectedInvoice.subtotal,
                                discount: selectedInvoice.discount,
                                taxRate: selectedInvoice.tax_rate,
                                taxAmount: selectedInvoice.tax_amount,
                                grandTotal: selectedInvoice.total,
                                notes: selectedInvoice.notes
                            }}
                        />
                    )}
                    <DialogFooter className="no-print">
                        <Button variant="outline" onClick={() => setIsPrintOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => window.print()} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
