"use client"

import * as React from "react"
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    Package,
    Truck,
    Eye,
    MoreHorizontal,
    Filter,
    FileText,
    Printer,
    Trash2,
    ShoppingCart,
    Building2,
    XCircle
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
import { defaultPurchaseOrderTemplate } from "@/lib/templates/documentTemplates"
import { printDocument } from "@/lib/utils/printHelper"

export const runtime = 'edge';

interface PurchaseOrderItem {
    id?: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    total: number
}

interface PurchaseOrder {
    id: string
    po_number: string
    vendor_id: string
    order_date: string
    expected_date: string | null
    status: 'Draft' | 'Sent' | 'Confirmed' | 'Received' | 'PartiallyReceived' | 'Cancelled'
    subtotal: number
    discount: number
    tax_rate: number
    tax_amount: number
    total: number
    notes?: string
    created_at: string
    vendor?: {
        id: string
        name: string
        email?: string
        phone?: string
        address?: string
    }
    items?: PurchaseOrderItem[]
}

export default function PurchaseOrdersPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const isArabic = locale === 'ar'

    const [orders, setOrders] = React.useState<PurchaseOrder[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [isPrintOpen, setIsPrintOpen] = React.useState(false)
    const [selectedOrder, setSelectedOrder] = React.useState<PurchaseOrder | null>(null)
    const [vendors, setVendors] = React.useState<{ id: string, name: string, email?: string, phone?: string, address?: string }[]>([])

    // New order form state
    const [newOrder, setNewOrder] = React.useState({
        vendor_id: '',
        po_number: `PO-${Date.now().toString().slice(-8)}`,
        order_date: format(new Date(), "yyyy-MM-dd"),
        expected_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        notes: '',
        items: [{ description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, total: 0 }] as PurchaseOrderItem[]
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [ordersRes, vendorsRes] = await Promise.all([
            supabase.from('purchase_orders').select('*, vendor:vendors(id, name, email, phone, address), items:purchase_order_items(*)').order('order_date', { ascending: false }),
            supabase.from('vendors').select('id, name, email, phone, address').order('name')
        ])

        if (!ordersRes.error) setOrders(ordersRes.data || [])
        if (!vendorsRes.error) setVendors(vendorsRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    // Calculate totals
    const calculateTotals = (items: PurchaseOrderItem[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.total, 0)
        return { subtotal }
    }

    // Update item total when quantity or price changes
    const updateItemTotal = (index: number, field: keyof PurchaseOrderItem, value: number | string) => {
        const updatedItems = [...newOrder.items]
        updatedItems[index] = { ...updatedItems[index], [field]: value }

        // Recalculate total
        const qty = updatedItems[index].quantity || 0
        const price = updatedItems[index].unitPrice || 0
        updatedItems[index].total = qty * price

        setNewOrder({ ...newOrder, items: updatedItems })
    }

    // Add new line item
    const addLineItem = () => {
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, total: 0 }]
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
        if (!newOrder.vendor_id) {
            alert(isArabic ? 'يرجى اختيار المورد' : 'Please select a vendor')
            return
        }
        if (newOrder.items.length === 0 || !newOrder.items[0].description) {
            alert(isArabic ? 'يرجى إضافة بند واحد على الأقل' : 'Please add at least one item')
            return
        }

        const { subtotal } = calculateTotals(newOrder.items)

        const { data: orderData, error: orderError } = await supabase.from('purchase_orders').insert([{
            vendor_id: newOrder.vendor_id,
            po_number: newOrder.po_number,
            order_date: newOrder.order_date,
            expected_date: newOrder.expected_date || null,
            status: 'Draft',
            notes: newOrder.notes,
            subtotal,
            discount: 0,
            tax_rate: 0,
            tax_amount: 0,
            total: subtotal
        }]).select().single()

        if (orderError) {
            alert(orderError.message)
            return
        }

        if (orderData) {
            // Insert Items
            const itemsToInsert = newOrder.items.map(item => ({
                purchase_order_id: orderData.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unitPrice,
                total: item.total
            }))

            const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert)

            if (itemsError) {
                console.error('Error inserting items:', itemsError)
                alert(isArabic ? 'تم إنشاء أمر الشراء ولكن فشل حفظ البنود' : 'PO created but failed to save items')
            } else {
                setIsCreateOpen(false)
                setNewOrder({
                    vendor_id: '',
                    po_number: `PO-${Date.now().toString().slice(-8)}`,
                    order_date: format(new Date(), "yyyy-MM-dd"),
                    expected_date: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
                    notes: '',
                    items: [{ description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, total: 0 }]
                })
                fetchData()
            }
        }
    }

    // Update order status
    const handleUpdateStatus = async (id: string, newStatus: PurchaseOrder['status']) => {
        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    // Delete order
    const handleDeleteOrder = async (id: string, poNum: string) => {
        if (!confirm(isArabic ? `هل أنت متأكد من حذف أمر الشراء ${poNum}؟` : `Are you sure you want to delete PO ${poNum}?`)) return

        const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    // View order details
    const handleViewOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order)
        setIsViewOpen(true)
    }

    // Print order
    const handlePrintOrder = (order: PurchaseOrder) => {
        setSelectedOrder(order)
        setIsPrintOpen(true)
    }

    // Status badge
    const getStatusBadge = (status: PurchaseOrder['status']) => {
        const statusConfig = {
            Draft: { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
            Sent: { bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
            Confirmed: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle2 },
            Received: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package },
            PartiallyReceived: { bg: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
            Cancelled: { bg: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle }
        }

        const config = statusConfig[status] || statusConfig.Draft
        const Icon = config.icon

        const statusLabels: Record<string, { en: string, ar: string }> = {
            Draft: { en: 'Draft', ar: 'مسودة' },
            Sent: { en: 'Sent', ar: 'مُرسل' },
            Confirmed: { en: 'Confirmed', ar: 'مؤكد' },
            Received: { en: 'Received', ar: 'مُستلم' },
            PartiallyReceived: { en: 'Partial', ar: 'جزئي' },
            Cancelled: { en: 'Cancelled', ar: 'ملغى' }
        }

        return (
            <Badge variant="outline" className={`${config.bg} gap-1`}>
                <Icon className="h-3 w-3" />
                {isArabic ? statusLabels[status]?.ar : statusLabels[status]?.en || status}
            </Badge>
        )
    }

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.vendor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Stats
    const stats = {
        draft: orders.filter(o => o.status === 'Draft').length,
        pending: orders.filter(o => ['Sent', 'Confirmed'].includes(o.status)).length,
        received: orders.filter(o => o.status === 'Received').length,
        totalSpending: orders.filter(o => o.status === 'Received').reduce((sum, o) => sum + (o.total || 0), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.purchasing.orders}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة أوامر الشراء ومتابعة المشتريات' : 'Manage purchase orders and track procurement'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 border-none">
                                <Plus className="mr-2 h-4 w-4" />
                                {isArabic ? 'أمر شراء جديد' : 'New Purchase Order'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إنشاء أمر شراء جديد' : 'Create New Purchase Order'}</DialogTitle>
                                <DialogDescription>
                                    {isArabic ? 'أدخل تفاصيل أمر الشراء والبنود' : 'Enter purchase order details and line items'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {/* Vendor & Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'المورد' : 'Vendor'} *</Label>
                                        <Select onValueChange={(val) => setNewOrder({ ...newOrder, vendor_id: val })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isArabic ? 'اختر المورد...' : 'Select vendor...'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vendors.map(v => (
                                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'رقم أمر الشراء' : 'PO Number'}</Label>
                                        <Input value={newOrder.po_number} readOnly className="bg-slate-50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ الطلب' : 'Order Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newOrder.order_date}
                                            onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}</Label>
                                        <Input
                                            type="date"
                                            value={newOrder.expected_date}
                                            onChange={(e) => setNewOrder({ ...newOrder, expected_date: e.target.value })}
                                        />
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
                                                    <TableHead className="w-[45%]">{isArabic ? 'الوصف' : 'Description'}</TableHead>
                                                    <TableHead className="w-[12%] text-center">{isArabic ? 'الكمية' : 'Qty'}</TableHead>
                                                    <TableHead className="w-[10%] text-center">{isArabic ? 'الوحدة' : 'Unit'}</TableHead>
                                                    <TableHead className="w-[15%] text-right">{isArabic ? 'السعر' : 'Price'}</TableHead>
                                                    <TableHead className="w-[15%] text-right">{isArabic ? 'الإجمالي' : 'Total'}</TableHead>
                                                    <TableHead className="w-[3%]"></TableHead>
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
                                                        <TableCell className="p-1 text-right font-mono font-bold text-orange-600">
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
                                            <div className="flex justify-between py-2 text-lg font-bold text-orange-600 border-t-2">
                                                <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                                                <span className="font-mono">{formatMoney(calculateTotals(newOrder.items).subtotal)}</span>
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
                                <Button onClick={handleCreateOrder} className="bg-gradient-to-r from-orange-600 to-red-600">
                                    {isArabic ? 'إنشاء أمر الشراء' : 'Create PO'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            {isArabic ? 'قيد المعالجة' : 'In Progress'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-amber-700">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">
                            {isArabic ? 'مُستلم' : 'Received'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-emerald-700">{stats.received}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-red-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-orange-600">
                            {isArabic ? 'إجمالي المشتريات' : 'Total Spending'}
                        </CardDescription>
                        <CardTitle className="text-2xl text-orange-700">{formatMoney(stats.totalSpending)}</CardTitle>
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
                                placeholder={`${dict.common.search} ${isArabic ? 'أوامر الشراء...' : 'purchase orders...'}`}
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
                                    <SelectItem value="Confirmed">{isArabic ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                    <SelectItem value="Received">{isArabic ? 'مُستلم' : 'Received'}</SelectItem>
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
                                    <TableHead>{isArabic ? 'رقم أمر الشراء' : 'PO #'}</TableHead>
                                    <TableHead>{isArabic ? 'المورد' : 'Vendor'}</TableHead>
                                    <TableHead>{isArabic ? 'التسليم المتوقع' : 'Expected'}</TableHead>
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
                                                <div className="h-5 w-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                                {dict.common.loading}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            {dict.common.noData}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.map(order => (
                                    <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 text-sm font-medium">
                                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-orange-600">{order.po_number}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.vendor?.name}</p>
                                                {order.vendor?.email && (
                                                    <p className="text-xs text-muted-foreground">{order.vendor.email}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {order.expected_date ? format(new Date(order.expected_date), "MMM dd, yyyy") : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-orange-600">
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
                                                    <DropdownMenuLabel>{isArabic ? 'إجراءات' : 'Actions'}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleViewOrder(order)} className="gap-2">
                                                        <Eye className="h-4 w-4" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrintOrder(order)} className="gap-2">
                                                        <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {order.status === 'Draft' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Sent')} className="gap-2 text-blue-600">
                                                            <Clock className="h-4 w-4" /> {isArabic ? 'إرسال للمورد' : 'Send to Vendor'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status === 'Sent' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Confirmed')} className="gap-2 text-amber-600">
                                                            <CheckCircle2 className="h-4 w-4" /> {isArabic ? 'تأكيد' : 'Mark Confirmed'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {order.status === 'Confirmed' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'Received')} className="gap-2 text-emerald-600">
                                                            <Package className="h-4 w-4" /> {isArabic ? 'تم الاستلام' : 'Mark Received'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteOrder(order.id, order.po_number)} className="gap-2 text-rose-600">
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
                        <DialogTitle>{isArabic ? 'تفاصيل أمر الشراء' : 'Purchase Order Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'رقم أمر الشراء' : 'PO Number'}</p>
                                    <p className="font-bold text-lg text-orange-600">{selectedOrder.po_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</p>
                                    {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'المورد' : 'Vendor'}</p>
                                    <p className="font-medium">{selectedOrder.vendor?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'التسليم المتوقع' : 'Expected Delivery'}</p>
                                    <p className="font-medium">
                                        {selectedOrder.expected_date
                                            ? format(new Date(selectedOrder.expected_date), "MMM dd, yyyy")
                                            : '-'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground mb-2">{isArabic ? 'الإجمالي' : 'Total'}</p>
                                <p className="font-bold text-2xl text-orange-600">{formatMoney(selectedOrder.total || 0)}</p>
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
                            template={defaultPurchaseOrderTemplate}
                            data={{
                                documentNumber: selectedOrder.po_number,
                                documentDate: selectedOrder.order_date,
                                dueDate: selectedOrder.expected_date || undefined,
                                vendor: {
                                    name: selectedOrder.vendor?.name || '',
                                    address: selectedOrder.vendor?.address,
                                    phone: selectedOrder.vendor?.phone,
                                    email: selectedOrder.vendor?.email
                                },
                                items: [
                                    { no: 1, description: 'Purchase order items', quantity: 1, unit: 'Lot', unitPrice: selectedOrder.total, total: selectedOrder.total }
                                ],
                                subtotal: selectedOrder.subtotal || selectedOrder.total,
                                discount: selectedOrder.discount || 0,
                                taxRate: selectedOrder.tax_rate || 0,
                                taxAmount: selectedOrder.tax_amount || 0,
                                grandTotal: selectedOrder.total,
                                notes: selectedOrder.notes
                            }}
                        />
                    )}
                    <DialogFooter className="no-print">
                        <Button variant="outline" onClick={() => setIsPrintOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => printDocument()} className="gap-2 bg-gradient-to-r from-orange-600 to-red-600">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
