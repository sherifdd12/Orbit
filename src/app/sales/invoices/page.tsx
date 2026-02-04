"use client"

import * as React from "react"
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Download,
    Eye,
    Printer,
    MoreHorizontal,
    Filter,
    CreditCard,
    AlertCircle
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
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface Invoice {
    id: string
    invoice_number: string
    customer_id: string
    project_id: string | null
    amount: number
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
    due_date: string | null
    created_at: string
    customer?: {
        name: string
    }
}

export default function InvoicesPage() {
    const { dict, locale } = useLanguage()
    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                customer:customers(name)
            `)
            .order('created_at', { ascending: false })

        if (!error) {
            setInvoices(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const getStatusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>
            case 'Sent': return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Sent</Badge>
            case 'Overdue': return <Badge variant="destructive" className="animate-pulse bg-rose-100 text-rose-700 border-rose-200"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>
            case 'Draft': return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200">Draft</Badge>
            case 'Cancelled': return <Badge variant="secondary">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = invoices.filter(i =>
        i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sales.invoices}</h2>
                    <p className="text-muted-foreground text-sm">Issue invoices, track payments, and manage aging receivables.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleActionPlaceholder('Print Bulk')}><Printer className="h-4 w-4 mr-2" /> Print Bulk</Button>
                    <Button
                        onClick={() => handleActionPlaceholder('New Invoice')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-indigo-200 border-none px-6"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-md relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><FileText className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Total Invoiced</CardDescription>
                        <CardTitle className="text-2xl">{invoices.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()} SAR</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-emerald-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Paid</CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()} SAR</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-rose-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><AlertCircle className="h-12 w-12 text-rose-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-rose-600">Outstanding</CardDescription>
                        <CardTitle className="text-2xl text-rose-700">{invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled').reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()} SAR</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-indigo-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard className="h-12 w-12 text-indigo-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-indigo-600">Sent Count</CardDescription>
                        <CardTitle className="text-2xl text-indigo-700">{invoices.filter(i => i.status === 'Sent').length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl border border-slate-100 bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " invoices..."}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="bg-white"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-6">Invoice #</TableHead>
                                    <TableHead>{dict.operations.customer}</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No invoices found.</TableCell></TableRow>
                                ) : filtered.map(invoice => (
                                    <TableRow key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{invoice.invoice_number}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(invoice.created_at), "dd MMM yyyy")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{invoice.customer?.name}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-800">
                                            {invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        <TableCell>
                                            <div className={`text-sm ${invoice.status === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                {invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('View Invoice')} className="gap-2"><Eye className="h-4 w-4" /> View Invoice</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Register Payment')} className="gap-2 text-emerald-600 font-bold"><CreditCard className="h-4 w-4" /> Register Payment</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Print PDF')} className="gap-2"><Printer className="h-4 w-4" /> Print PDF</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Download')} className="gap-2"><Download className="h-4 w-4" /> Download</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Cancel Invoice')} className="gap-2 text-rose-600"><XCircle className="h-4 w-4" /> Cancel Invoice</DropdownMenuItem>
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
