"use client"

import * as React from "react"
import {
    Plus,
    Search,
    ShoppingBag,
    CheckCircle2,
    Clock,
    XCircle,
    Truck,
    Eye,
    MoreHorizontal,
    Filter,
    ArrowDown
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

interface PurchaseOrder {
    id: string
    order_number: string
    vendor_id: string
    order_date: string
    expected_date: string | null
    status: 'Draft' | 'Sent' | 'Confirmed' | 'Received' | 'Billed' | 'Cancelled'
    total: number
    created_at: string
    vendor?: {
        name: string
    }
}

export default function PurchaseOrdersPage() {
    const { dict, locale } = useLanguage()
    const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                vendor:vendors(name)
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

    const getStatusBadge = (status: PurchaseOrder['status']) => {
        switch (status) {
            case 'Confirmed': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Confirmed</Badge>
            case 'Draft': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Draft</Badge>
            case 'Received': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200"><Truck className="h-3 w-3 mr-1" /> Received</Badge>
            case 'Billed': return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Fully Billed</Badge>
            case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>
            case 'Sent': return <Badge variant="outline" className="text-blue-600 border-blue-200 font-bold">Waiting Response</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filtered = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.purchasing.orders}</h2>
                    <p className="text-muted-foreground text-sm">Create and track purchase orders with vendors.</p>
                </div>
                <Button className="shadow-lg shadow-orange-200 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 border-none px-6">
                    <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight">Active Requests</CardDescription>
                        <CardTitle className="text-2xl">{orders.filter(o => o.status === 'Sent' || o.status === 'Draft').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-emerald-600">Pending Delivery</CardDescription>
                        <CardTitle className="text-2xl text-emerald-700">{orders.filter(o => o.status === 'Confirmed').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-blue-600">Total Spent (Year)</CardDescription>
                        <CardTitle className="text-2xl text-blue-700">{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} SAR</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-tight text-orange-600">Open Liability</CardDescription>
                        <CardTitle className="text-2xl text-orange-700">
                            {orders.filter(o => o.status === 'Received').reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} SAR
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl border border-slate-100 bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " POs..."}
                                className="pl-9 bg-white shadow-inner"
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
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-6">{dict.common.date}</TableHead>
                                    <TableHead>PO #</TableHead>
                                    <TableHead>{dict.purchasing.vendors}</TableHead>
                                    <TableHead className="text-right">{dict.common.amount}</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead>Expected Date</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">{dict.common.noData}</TableCell></TableRow>
                                ) : filtered.map(order => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 text-sm">
                                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-orange-600">{order.order_number}</TableCell>
                                        <TableCell className="font-medium">{order.vendor?.name}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-800">
                                            {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm text-slate-600 flex items-center gap-2">
                                                <Clock className="h-3 w-3 opacity-50" />
                                                {order.expected_date ? format(new Date(order.expected_date), "MMM dd, yyyy") : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>PO Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-emerald-600 font-bold"><CheckCircle2 className="h-4 w-4" /> Receive Goods</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-blue-600 font-bold"><ShoppingBag className="h-4 w-4" /> Create Bill</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-rose-600"><XCircle className="h-4 w-4" /> Cancel PO</DropdownMenuItem>
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
