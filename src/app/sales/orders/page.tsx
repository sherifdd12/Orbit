"use client"

import * as React from "react"
import {
    Plus,
    Search,
    CheckCircle2,
    XCircle,
    Truck,
    Eye,
    MoreHorizontal,
    Filter,
    BarChart3,
    FileText,
    Printer,
    Download,
    Send,
    Edit,
    Trash2,
    ChevronDown,
    Package,
    Calendar
} from "lucide-react"
import Link from "next/link"
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
import { defaultQuoteTemplate, defaultInvoiceTemplate } from "@/lib/templates/documentTemplates"

interface SalesOrderItem {
    id?: string
    description: string
    descriptionAr?: string
    quantity: number
    unit: string
    unitPrice: number
    discount: number
    total: number
}

interface SalesOrder {
    id: string
    order_number: string
    customer_id: string
    project_id: string | null
    order_date: string
    delivery_date: string | null
    status: 'Quotation' | 'Confirmed' | 'Delivered' | 'Invoiced' | 'Cancelled'
    subtotal: number
    discount: number
    tax_rate: number
    tax_amount: number
    total: number
    notes: string | null
    created_at: string
    customer?: {
        id: string
        name: string
        email?: string
        phone?: string
        address?: string
    }
    items?: SalesOrderItem[]
}

interface InventoryItem {
    id: string
    name: string
    sku: string
    unit_price: number
    quantity: number
    unit: string
}

export default function SalesOrdersPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const isArabic = locale === 'ar'

    const [orders, setOrders] = React.useState<SalesOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [isPrintOpen, setIsPrintOpen] = React.useState(false)
    const [selectedOrder, setSelectedOrder] = React.useState<SalesOrder | null>(null)
    const [customers, setCustomers] = React.useState<{ id: string, name: string, email?: string, phone?: string, address?: string }[]>([])
    const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([])

    // New order form state
    const [newOrder, setNewOrder] = React.useState({
        customer_id: '',
        order_number: `SO-${Date.now().toString().slice(-8)}`,
        order_date: format(new Date(), "yyyy-MM-dd"),
        delivery_date: '',
        status: 'Quotation' as SalesOrder['status'],
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discount: 0, total: 0 }] as SalesOrderItem[]
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [ordersRes, customersRes, inventoryRes] = await Promise.all([
            supabase.from('sale_orders').select('*, customer:customers(id, name, email, phone, address), items:sale_order_items(*)').order('order_date', { ascending: false }),
            supabase.from('customers').select('id, name, email, phone, address').order('name'),
            supabase.from('inventory_items').select('id, name, sku, unit_price, quantity, unit').order('name')
        ])

        if (!ordersRes.error) setOrders(ordersRes.data || [])
        if (!customersRes.error) setCustomers(customersRes.data || [])
        if (!inventoryRes.error) setInventoryItems(inventoryRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    // Calculate totals
    const calculateTotals = (items: SalesOrderItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0)
        const discount = items.reduce((sum, item) => sum + item.discount, 0)
        return { subtotal, discount }
    }

    // Update item total when quantity or price changes
    const updateItemTotal = (index: number, field: keyof SalesOrderItem, value: number | string) => {
        const updatedItems = [...newOrder.items]
        updatedItems[index] = { ...updatedItems[index], [field]: value }

        // Recalculate total
        const qty = updatedItems[index].quantity || 0
        const price = updatedItems[index].unitPrice || 0
        const disc = updatedItems[index].discount || 0
        updatedItems[index].total = (qty * price) - disc

        setNewOrder({ ...newOrder, items: updatedItems })
    }

    // Add new line item
    const addLineItem = () => {
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discount: 0, total: 0 }]
        })
    }

    // Remove line item
    const removeLineItem = (index: number) => {
        if (newOrder.items.length > 1) {
            const updatedItems = newOrder.items.filter((_, i) => i !== index)
            setNewOrder({ ...newOrder, items: updatedItems })
        }
    }

    // Create order
    const handleCreateOrder = async () => {
        if (!newOrder.customer_id) {
            alert(isArabic ? 'يرجى اختيار العميل' : 'Please select a customer')
            return
        }
        if (newOrder.items.length === 0 || !newOrder.items[0].description) {
            alert(isArabic ? 'يرجى إضافة بند واحد على الأقل' : 'Please add at least one item')
            return
        }

        const { subtotal, discount } = calculateTotals(newOrder.items)
        const taxRate = 0 // Could be configurable
        const taxAmount = (subtotal - discount) * (taxRate / 100)
        const total = subtotal - discount + taxAmount

        const { data: orderData, error: orderError } = await supabase.from('sale_orders').insert([{
            customer_id: newOrder.customer_id,
            order_number: newOrder.order_number,
            order_date: newOrder.order_date,
            delivery_date: newOrder.delivery_date || null,
            status: newOrder.status,
            notes: newOrder.notes,
            subtotal,
            discount,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            total
        }]).select().single()

        if (orderError) {
            alert(orderError.message)
            return
        }

        if (orderData) {
            // Insert Items
            const itemsToInsert = newOrder.items.map(item => ({
                sale_order_id: orderData.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unitPrice,
                discount: item.discount,
                total: item.total
            }))

            const { error: itemsError } = await supabase.from('sale_order_items').insert(itemsToInsert)

            if (itemsError) {
                console.error('Error inserting items:', itemsError)
                alert(isArabic ? 'تم إنشاء الطلب ولكن فشل حفظ البنود' : 'Order created but failed to save items')
            } else {
                setIsCreateOpen(false)
                setNewOrder({
                    customer_id: '',
                    order_number: `SO-${Date.now().toString().slice(-8)}`,
                    order_date: format(new Date(), "yyyy-MM-dd"),
                    delivery_date: '',
                    status: 'Quotation',
                    notes: '',
                    items: [{ description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discount: 0, total: 0 }]
                })
                fetchData()
            }
        }
    }

    // Update order status
    const handleUpdateStatus = async (id: string, newStatus: SalesOrder['status']) => {
        const { error } = await supabase
            .from('sale_orders')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    // Delete order
    const handleDeleteOrder = async (id: string, orderNum: string) => {
        if (!confirm(isArabic ? `هل أنت متأكد من حذف الطلب ${orderNum}؟` : `Are you sure you want to delete order ${orderNum}?`)) return

        const { error } = await supabase.from('sale_orders').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    // View order details
    const handleViewOrder = (order: SalesOrder) => {
        setSelectedOrder(order)
        setIsViewOpen(true)
    }

    // Print order
    const handlePrintOrder = (order: SalesOrder) => {
        setSelectedOrder(order)
        setIsPrintOpen(true)
    }

    // Convert to Invoice
    const handleConvertToInvoice = async (order: SalesOrder) => {
        if (!confirm(isArabic ? 'تحويل هذا الطلب إلى فاتورة?' : 'Convert this order to an invoice?')) return

        // Create invoice from order
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
        const { error } = await supabase.from('invoices').insert([{
            invoice_number: invoiceNumber,
            customer_id: order.customer_id,
            sale_order_id: order.id,
            invoice_date: format(new Date(), 'yyyy-MM-dd'),
            due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            subtotal: order.subtotal,
            discount: order.discount,
            tax_rate: order.tax_rate,
            tax_amount: order.tax_amount,
            total: order.total,
            status: 'Draft'
        }])

        if (error) {
            alert(error.message)
        } else {
            // Update order status to Invoiced
            await handleUpdateStatus(order.id, 'Invoiced')
            alert(isArabic ? `تم إنشاء الفاتورة ${invoiceNumber}` : `Invoice ${invoiceNumber} created successfully`)
        }
    }

    // Status badge
    const getStatusBadge = (status: SalesOrder['status']) => {
        const statusConfig = {
            Quotation: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: FileText },
            Confirmed: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
            Delivered: { bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
            Invoiced: { bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: FileText },
            Cancelled: { bg: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle }
        }
        const config = statusConfig[status] || { bg: 'bg-gray-100 text-gray-700', icon: FileText }
        const Icon = config.icon

        return (
            <Badge variant="outline" className={`${config.bg} gap-1`}>
                <Icon className="h-3 w-3" />
                {isArabic ? dict.statuses[status.toLowerCase() as keyof typeof dict.statuses] || status : status}
            </Badge>
        )
    }

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Stats
    const stats = {
        quotations: orders.filter(o => o.status === 'Quotation').length,
        confirmed: orders.filter(o => o.status === 'Confirmed').length,
        delivered: orders.filter(o => o.status === 'Delivered').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sales.orders}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة عروض الأسعار وأوامر البيع والتسليمات' : 'Manage quotations, sales orders, and deliveries'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none">
                                <Plus className="mr-2 h-4 w-4" />
                                {isArabic ? 'أمر جديد' : 'New Order'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إنشاء أمر بيع جديد' : 'Create New Sales Order'}</DialogTitle>
                                <DialogDescription>
                                    {isArabic ? 'أدخل تفاصيل الطلب والبنود' : 'Enter order details and line items'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {/* Customer & Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'العميل' : 'Customer'} *</Label>
                                        <Select onValueChange={(val) => setNewOrder({ ...newOrder, customer_id: val })}>
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
                                        <Label>{isArabic ? 'رقم الطلب' : 'Order Number'}</Label>
                                        <Input value={newOrder.order_number} readOnly className="bg-slate-50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ الطلب' : 'Order Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newOrder.order_date}
                                            onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ التسليم' : 'Delivery Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newOrder.delivery_date}
                                            onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الحالة' : 'Status'}</Label>
                                        <Select
                                            value={newOrder.status}
                                            onValueChange={(val: SalesOrder['status']) => setNewOrder({ ...newOrder, status: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Quotation">{isArabic ? 'عرض سعر' : 'Quotation'}</SelectItem>
                                                <SelectItem value="Confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">{isArabic ? 'البنود' : 'Line Items'}</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                            <Plus className="h-4 w-4 mr-1" /> {isArabic ? 'إضافة بند' : 'Add Item'}
                                        </Button>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50">
                                                    <TableHead className="w-[40%]">{isArabic ? 'الوصف' : 'Description'}</TableHead>
                                                    <TableHead className="w-[12%] text-center">{isArabic ? 'الكمية' : 'Qty'}</TableHead>
                                                    <TableHead className="w-[10%] text-center">{isArabic ? 'الوحدة' : 'Unit'}</TableHead>
                                                    <TableHead className="w-[15%] text-right">{isArabic ? 'السعر' : 'Price'}</TableHead>
                                                    <TableHead className="w-[15%] text-right">{isArabic ? 'الإجمالي' : 'Total'}</TableHead>
                                                    <TableHead className="w-[8%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {newOrder.items.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="p-1">
                                                            <Input
                                                                value={item.description}
                                                                onChange={(e) => updateItemTotal(idx, 'description', e.target.value)}
                                                                placeholder={isArabic ? 'وصف البند' : 'Item description'}
                                                                className="border-0 shadow-none focus-visible:ring-1"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemTotal(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="text-center border-0 shadow-none focus-visible:ring-1"
                                                                min="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Select
                                                                value={item.unit}
                                                                onValueChange={(val) => updateItemTotal(idx, 'unit', val)}
                                                            >
                                                                <SelectTrigger className="border-0 shadow-none h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Pcs">Pcs</SelectItem>
                                                                    <SelectItem value="Kg">Kg</SelectItem>
                                                                    <SelectItem value="M">M</SelectItem>
                                                                    <SelectItem value="L">L</SelectItem>
                                                                    <SelectItem value="Box">Box</SelectItem>
                                                                    <SelectItem value="Hr">Hr</SelectItem>
                                                                    <SelectItem value="Day">Day</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateItemTotal(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                className="text-right border-0 shadow-none focus-visible:ring-1"
                                                                min="0"
                                                                step="0.001"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1 text-right font-mono font-bold text-emerald-600">
                                                            {formatMoney(item.total)}
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                onClick={() => removeLineItem(idx)}
                                                                disabled={newOrder.items.length === 1}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Totals */}
                                    <div className="flex justify-end">
                                        <div className="w-72 space-y-2 text-sm">
                                            <div className="flex justify-between py-1 border-b">
                                                <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                                <span className="font-mono font-medium">{formatMoney(calculateTotals(newOrder.items).subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 text-lg font-bold text-blue-600 border-t-2">
                                                <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                                                <span className="font-mono">{formatMoney(calculateTotals(newOrder.items).subtotal - calculateTotals(newOrder.items).discount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                    <Textarea
                                        value={newOrder.notes}
                                        onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                                        placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {dict.common.cancel}
                                </Button>
                                <Button onClick={handleCreateOrder} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {isArabic ? 'إنشاء الطلب' : 'Create Order'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Link href="/reports">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> {dict.sidebar.reports}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600">
                            {isArabic ? 'عروض الأسعار' : 'Pending Quotes'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-amber-700">{stats.quotations}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">
                            {isArabic ? 'الطلبات المؤكدة' : 'Active Orders'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-emerald-700">{stats.confirmed}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">
                            {isArabic ? 'جاهز للفوترة' : 'Ready to Invoice'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-blue-700">{stats.delivered}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-indigo-600">
                            {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
                        </CardDescription>
                        <CardTitle className="text-2xl text-indigo-700">{formatMoney(stats.totalRevenue)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Orders Table */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`${dict.common.search} ${isArabic ? 'الطلبات...' : 'orders...'}`}
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
                                    <SelectItem value="Quotation">{isArabic ? 'عروض الأسعار' : 'Quotations'}</SelectItem>
                                    <SelectItem value="Confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                    <SelectItem value="Delivered">{isArabic ? 'تم التسليم' : 'Delivered'}</SelectItem>
                                    <SelectItem value="Invoiced">{isArabic ? 'مفوتر' : 'Invoiced'}</SelectItem>
                                    <SelectItem value="Cancelled">{isArabic ? 'ملغى' : 'Cancelled'}</SelectItem>
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
                                    <TableHead className="pl-6">{dict.common.date}</TableHead>
                                    <TableHead>{isArabic ? 'رقم الطلب' : 'Order #'}</TableHead>
                                    <TableHead>{dict.operations.customer}</TableHead>
                                    <TableHead className="text-right">{dict.common.amount}</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                {dict.common.loading}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            {dict.common.noData}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.map(order => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 text-sm font-medium">
                                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-blue-600">{order.order_number}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.customer?.name}</p>
                                                {order.customer?.email && (
                                                    <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-600">
                                            {formatMoney(order.total || 0)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>{isArabic ? 'إدارة الطلب' : 'Order Actions'}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleViewOrder(order)} className="gap-2">
                                                        <Eye className="h-4 w-4" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrintOrder(order)} className="gap-2">
                                                        <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {order.status === 'Quotation' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Confirmed')} className="gap-2 text-emerald-600">
                                                            <CheckCircle2 className="h-4 w-4" /> {isArabic ? 'تأكيد الطلب' : 'Confirm Order'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status === 'Confirmed' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Delivered')} className="gap-2 text-blue-600">
                                                            <Truck className="h-4 w-4" /> {isArabic ? 'تم التسليم' : 'Mark Delivered'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status === 'Delivered' && (
                                                        <DropdownMenuItem onClick={() => handleConvertToInvoice(order)} className="gap-2 text-indigo-600">
                                                            <FileText className="h-4 w-4" /> {isArabic ? 'تحويل إلى فاتورة' : 'Convert to Invoice'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteOrder(order.id, order.order_number)} className="gap-2 text-rose-600">
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

            {/* View Order Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'رقم الطلب' : 'Order Number'}</p>
                                    <p className="font-bold text-lg text-blue-600">{selectedOrder.order_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</p>
                                    {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'العميل' : 'Customer'}</p>
                                    <p className="font-medium">{selectedOrder.customer?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'التاريخ' : 'Date'}</p>
                                    <p className="font-medium">{format(new Date(selectedOrder.order_date), "MMM dd, yyyy")}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground mb-2">{isArabic ? 'الإجمالي' : 'Total'}</p>
                                <p className="font-bold text-2xl text-emerald-600">{formatMoney(selectedOrder.total || 0)}</p>
                            </div>
                            {selectedOrder.notes && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground mb-2">{isArabic ? 'ملاحظات' : 'Notes'}</p>
                                    <p className="text-sm bg-slate-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => { setIsViewOpen(false); handlePrintOrder(selectedOrder!) }} className="gap-2">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Dialog */}
            <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="no-print">
                        <DialogTitle>{isArabic ? 'معاينة الطباعة' : 'Print Preview'}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <PrintableDocument
                            template={selectedOrder.status === 'Quotation' ? defaultQuoteTemplate : defaultInvoiceTemplate}
                            data={{
                                documentNumber: selectedOrder.order_number,
                                documentDate: selectedOrder.order_date,
                                dueDate: selectedOrder.delivery_date || undefined,
                                customer: {
                                    name: selectedOrder.customer?.name || '',
                                    address: selectedOrder.customer?.address,
                                    phone: selectedOrder.customer?.phone,
                                    email: selectedOrder.customer?.email
                                },
                                items: [
                                    { no: 1, description: 'Order items', quantity: 1, unit: 'Lot', unitPrice: selectedOrder.total, total: selectedOrder.total }
                                ],
                                subtotal: selectedOrder.subtotal || selectedOrder.total,
                                discount: selectedOrder.discount || 0,
                                taxRate: selectedOrder.tax_rate || 0,
                                taxAmount: selectedOrder.tax_amount || 0,
                                grandTotal: selectedOrder.total,
                                notes: selectedOrder.notes || undefined
                            }}
                        />
                    )}
                    <DialogFooter className="no-print">
                        <Button variant="outline" onClick={() => setIsPrintOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => window.print()} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
