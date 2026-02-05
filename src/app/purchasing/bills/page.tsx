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
    AlertCircle,
    ArrowDownToLine
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
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Bill {
    id: string
    bill_number: string
    vendor_id: string
    purchase_order_id: string | null
    amount: number
    status: 'Draft' | 'Posted' | 'Paid' | 'Overdue' | 'Cancelled'
    due_date: string | null
    created_at: string
    vendor?: {
        name: string
    }
}

export default function VendorBillsPage() {
    const { dict, locale } = useLanguage()
    const { currency } = useSettings()
    const [bills, setBills] = React.useState<Bill[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('vendor_bills')
            .select(`
                *,
                vendor:vendors(name)
            `)
            .order('created_at', { ascending: false })

        if (!error) {
            setBills(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const getStatusBadge = (status: Bill['status']) => {
        switch (status) {
            case 'Paid': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>
            case 'Posted': return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Posted</Badge>
            case 'Overdue': return <Badge variant="destructive" className="animate-pulse bg-rose-100 text-rose-700 border-rose-200"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>
            case 'Draft': return <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200">Draft</Badge>
            case 'Cancelled': return <Badge variant="secondary">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = bills.filter(b =>
        b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.purchasing.bills}</h2>
                    <p className="text-muted-foreground text-sm">Register vendor invoices, manage payables, and schedule outlays.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><ArrowDownToLine className="h-4 w-4 mr-2" /> Import</Button>
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md border-none px-6">
                        <Plus className="mr-2 h-4 w-4" /> New Bill
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-md relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><FileText className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider">Estimated Payables</CardDescription>
                        <CardTitle className="text-2xl">{bills.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()} {currency}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-emerald-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-600">Settled</CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()} {currency}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-orange-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><AlertCircle className="h-12 w-12 text-orange-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-orange-600">Waiting Payment</CardDescription>
                        <CardTitle className="text-2xl text-orange-700">{bills.filter(b => b.status === 'Posted' || b.status === 'Overdue').reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()} {currency}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-rose-50 relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><XCircle className="h-12 w-12 text-rose-600" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-rose-600">Overdue Drafts</CardDescription>
                        <CardTitle className="text-2xl text-rose-700">{bills.filter(b => b.status === 'Overdue').length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl border border-slate-100 bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " bills..."}
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
                                    <TableHead className="pl-6">Bill #</TableHead>
                                    <TableHead>{dict.purchasing.vendors}</TableHead>
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
                                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No vendor bills found.</TableCell></TableRow>
                                ) : filtered.map(bill => (
                                    <TableRow key={bill.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{bill.bill_number}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(bill.created_at), "dd MMM yyyy")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{bill.vendor?.name}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-800">
                                            {bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                                        <TableCell>
                                            <div className={`text-sm ${bill.status === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                {bill.due_date ? format(new Date(bill.due_date), "MMM dd, yyyy") : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Bill Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-emerald-600 font-bold"><CreditCard className="h-4 w-4" /> Register Payment</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print PDF</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-rose-600"><XCircle className="h-4 w-4" /> Cancel Bill</DropdownMenuItem>
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
