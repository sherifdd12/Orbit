"use client"

import * as React from "react"
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Truck,
    Eye,
    MoreHorizontal,
    Filter,
    ArrowRight
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

interface SalesOrder {
    id: string
    order_number: string
    customer_id: string
    project_id: string | null
    order_date: string
    delivery_date: string | null
    status: 'Quotation' | 'Confirmed' | 'Delivered' | 'Invoiced' | 'Cancelled'
    total: number
    created_at: string
    customer?: {
        name: string
    }
}

export default function SalesOrdersPage() {
    const { dict, locale } = useLanguage()
    const [orders, setOrders] = React.useState<SalesOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('sale_orders')
            .select(`
                *,
                customer:customers(name)
            `)
            .order('order_date', { ascending: false })

        if (!error) {
            setOrders(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const getStatusBadge = (status: SalesOrder['status']) => {
        switch (status) {
            case 'Confirmed': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>
            case 'Quotation': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Quotation</Badge>
            case 'Delivered': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200"><Truck className="h-3 w-3 mr-1" /> Delivered</Badge>
            case 'Invoiced': return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Invoiced</Badge>
            case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sales.orders}</h2>
                    <p className="text-muted-foreground text-sm">Manage quotations, sales orders, and deliveries.</p>
                </div>
                <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none">
                    <Plus className="mr-2 h-4 w-4" /> Create Order
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase">Pending Quotes</CardDescription>
                        <CardTitle className="text-2xl">{orders.filter(o => o.status === 'Quotation').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">Active Orders</CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{orders.filter(o => o.status === 'Confirmed').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">Ready to Invoice</CardDescription>
                        <CardTitle className="text-2xl text-blue-700">{orders.filter(o => o.status === 'Delivered').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-indigo-600">Total revenue</CardDescription>
                        <CardTitle className="text-2xl text-indigo-700">
                            {orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} SAR
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " orders..."}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="bg-white"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="pl-6">{dict.common.date}</TableHead>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>{dict.operations.customer}</TableHead>
                                    <TableHead className="text-right">{dict.common.amount}</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">{dict.common.noData}</TableCell></TableRow>
                                ) : filtered.map(order => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 text-sm font-medium">
                                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-blue-600">{order.order_number}</TableCell>
                                        <TableCell>{order.customer?.name}</TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR' }).format(order.total || 0)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Order Management</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Confirm Order</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-blue-600"><Truck className="h-4 w-4" /> Ship / Deliver</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-rose-600"><XCircle className="h-4 w-4" /> Cancel</DropdownMenuItem>
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
