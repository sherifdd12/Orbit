"use client"
export const runtime = 'edge';

import * as React from "react"
import {
    Truck,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Package,
    MapPin,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    Edit,
    Trash2,
    ArrowRight,
    Plane,
    Ship,
    Box,
    Filter,
    ExternalLink
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
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

interface Shipment {
    id: string
    shipment_number: string
    shipment_type: 'Outbound' | 'Inbound' | 'Transfer'
    status: string
    carrier_id: string | null
    tracking_number: string | null
    ship_date: string | null
    expected_delivery: string | null
    actual_delivery: string | null
    ship_to_name: string | null
    ship_to_address: string | null
    ship_to_city: string | null
    ship_to_country: string | null
    shipping_cost: number
    notes: string | null
    created_at: string
    carriers?: { name: string; tracking_url_template: string | null }
    sale_orders?: { order_number: string }
    purchase_orders?: { po_number: string }
}

interface Carrier {
    id: string
    name: string
    code: string
    tracking_url_template: string | null
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    Pending: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Pending' },
    Picked: { color: 'bg-blue-100 text-blue-700', icon: Package, label: 'Picked' },
    Packed: { color: 'bg-indigo-100 text-indigo-700', icon: Box, label: 'Packed' },
    Shipped: { color: 'bg-amber-100 text-amber-700', icon: Truck, label: 'Shipped' },
    InTransit: { color: 'bg-purple-100 text-purple-700', icon: Plane, label: 'In Transit' },
    Delivered: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Delivered' },
    Returned: { color: 'bg-rose-100 text-rose-700', icon: AlertCircle, label: 'Returned' },
    Cancelled: { color: 'bg-gray-100 text-gray-500', icon: AlertCircle, label: 'Cancelled' },
}

export default function ShipmentsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [shipments, setShipments] = React.useState<Shipment[]>([])
    const [carriers, setCarriers] = React.useState<Carrier[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterStatus, setFilterStatus] = React.useState("all")
    const [filterType, setFilterType] = React.useState("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [selectedShipment, setSelectedShipment] = React.useState<Shipment | null>(null)

    const [newShipment, setNewShipment] = React.useState<{
        shipment_type: 'Outbound' | 'Inbound' | 'Transfer'
        carrier_id: string
        tracking_number: string
        ship_date: string
        expected_delivery: string
        ship_to_name: string
        ship_to_address: string
        ship_to_city: string
        ship_to_country: string
        shipping_cost: number
        notes: string
    }>({
        shipment_type: 'Outbound',
        carrier_id: '',
        tracking_number: '',
        ship_date: format(new Date(), 'yyyy-MM-dd'),
        expected_delivery: '',
        ship_to_name: '',
        ship_to_address: '',
        ship_to_city: '',
        ship_to_country: '',
        shipping_cost: 0,
        notes: ''
    })

    const supabase = createClient()

    const generateShipmentNumber = () => {
        const prefix = 'SHP'
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${prefix}-${timestamp}-${random}`
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [shipmentsRes, carriersRes] = await Promise.all([
            supabase
                .from('shipments')
                .select('*, carriers(name, tracking_url_template), sale_orders(order_number), purchase_orders(po_number)')
                .order('created_at', { ascending: false }),
            supabase.from('carriers').select('*').eq('is_active', true)
        ])

        if (!shipmentsRes.error) setShipments(shipmentsRes.data || [])
        if (!carriersRes.error) setCarriers(carriersRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateShipment = async () => {
        const shipmentNumber = generateShipmentNumber()
        const { error } = await supabase.from('shipments').insert([{
            shipment_number: shipmentNumber,
            ...newShipment,
            carrier_id: newShipment.carrier_id || null,
            status: 'Pending'
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsCreateOpen(false)
            setNewShipment({
                shipment_type: 'Outbound',
                carrier_id: '',
                tracking_number: '',
                ship_date: format(new Date(), 'yyyy-MM-dd'),
                expected_delivery: '',
                ship_to_name: '',
                ship_to_address: '',
                ship_to_city: '',
                ship_to_country: '',
                shipping_cost: 0,
                notes: ''
            })
            fetchData()
        }
    }

    const handleUpdateStatus = async (shipment: Shipment, newStatus: string) => {
        const updates: Record<string, unknown> = { status: newStatus }
        if (newStatus === 'Delivered') {
            updates.actual_delivery = format(new Date(), 'yyyy-MM-dd')
        }

        const { error } = await supabase
            .from('shipments')
            .update(updates)
            .eq('id', shipment.id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleDelete = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this shipment?')) return
        const { error } = await supabase.from('shipments').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleExport = () => {
        const headers = ["Shipment #", "Type", "Status", "Carrier", "Tracking #", "Ship Date", "Destination", "Cost"]
        const data = shipments.map(s => [
            s.shipment_number,
            s.shipment_type,
            s.status,
            s.carriers?.name || '-',
            s.tracking_number || '-',
            s.ship_date || '-',
            `${s.ship_to_city || ''}, ${s.ship_to_country || ''}`,
            s.shipping_cost
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `shipments_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    const openTrackingUrl = (shipment: Shipment) => {
        if (shipment.carriers?.tracking_url_template && shipment.tracking_number) {
            const url = shipment.carriers.tracking_url_template.replace('{tracking_number}', shipment.tracking_number)
            window.open(url, '_blank')
        }
    }

    const filteredShipments = shipments.filter(s => {
        const matchesSearch = s.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.ship_to_name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus
        const matchesType = filterType === 'all' || s.shipment_type === filterType
        return matchesSearch && matchesStatus && matchesType
    })

    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'Pending').length,
        inTransit: shipments.filter(s => ['Shipped', 'InTransit'].includes(s.status)).length,
        delivered: shipments.filter(s => s.status === 'Delivered').length,
        totalCost: shipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isArabic ? 'الشحنات والتوصيل' : 'Shipments & Logistics'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'تتبع وإدارة جميع الشحنات الواردة والصادرة' : 'Track and manage all inbound and outbound shipments'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'شحنة جديدة' : 'New Shipment'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إنشاء شحنة جديدة' : 'Create New Shipment'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'نوع الشحنة' : 'Shipment Type'}</Label>
                                    <Select
                                        value={newShipment.shipment_type}
                                        onValueChange={(v) => setNewShipment({ ...newShipment, shipment_type: v as 'Outbound' | 'Inbound' | 'Transfer' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Outbound">{isArabic ? 'صادر' : 'Outbound'}</SelectItem>
                                            <SelectItem value="Inbound">{isArabic ? 'وارد' : 'Inbound'}</SelectItem>
                                            <SelectItem value="Transfer">{isArabic ? 'تحويل' : 'Transfer'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'شركة الشحن' : 'Carrier'}</Label>
                                    <Select
                                        value={newShipment.carrier_id}
                                        onValueChange={(v) => setNewShipment({ ...newShipment, carrier_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isArabic ? 'اختر الناقل' : 'Select carrier'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {carriers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'رقم التتبع' : 'Tracking Number'}</Label>
                                    <Input
                                        value={newShipment.tracking_number}
                                        onChange={(e) => setNewShipment({ ...newShipment, tracking_number: e.target.value })}
                                        placeholder="e.g., 1Z999AA10123456784"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'تاريخ الشحن' : 'Ship Date'}</Label>
                                    <Input
                                        type="date"
                                        value={newShipment.ship_date}
                                        onChange={(e) => setNewShipment({ ...newShipment, ship_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'التوصيل المتوقع' : 'Expected Delivery'}</Label>
                                    <Input
                                        type="date"
                                        value={newShipment.expected_delivery}
                                        onChange={(e) => setNewShipment({ ...newShipment, expected_delivery: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'تكلفة الشحن' : 'Shipping Cost'}</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={newShipment.shipping_cost}
                                        onChange={(e) => setNewShipment({ ...newShipment, shipping_cost: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{isArabic ? 'اسم المستلم' : 'Recipient Name'}</Label>
                                    <Input
                                        value={newShipment.ship_to_name}
                                        onChange={(e) => setNewShipment({ ...newShipment, ship_to_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{isArabic ? 'العنوان' : 'Address'}</Label>
                                    <Textarea
                                        value={newShipment.ship_to_address}
                                        onChange={(e) => setNewShipment({ ...newShipment, ship_to_address: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'المدينة' : 'City'}</Label>
                                    <Input
                                        value={newShipment.ship_to_city}
                                        onChange={(e) => setNewShipment({ ...newShipment, ship_to_city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الدولة' : 'Country'}</Label>
                                    <Input
                                        value={newShipment.ship_to_country}
                                        onChange={(e) => setNewShipment({ ...newShipment, ship_to_country: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                    <Textarea
                                        value={newShipment.notes}
                                        onChange={(e) => setNewShipment({ ...newShipment, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreateShipment}>{isArabic ? 'إنشاء الشحنة' : 'Create Shipment'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">
                            {isArabic ? 'إجمالي الشحنات' : 'Total Shipments'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {isArabic ? 'قيد الانتظار' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
                            <Truck className="h-3 w-3" /> {isArabic ? 'في الطريق' : 'In Transit'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-700">{stats.inTransit}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {isArabic ? 'تم التوصيل' : 'Delivered'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{stats.delivered}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">
                            {isArabic ? 'تكلفة الشحن' : 'Shipping Cost'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatMoney(stats.totalCost)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isArabic ? 'بحث في الشحنات...' : 'Search shipments...'}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[140px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الأنواع' : 'All Types'}</SelectItem>
                                    <SelectItem value="Outbound">{isArabic ? 'صادر' : 'Outbound'}</SelectItem>
                                    <SelectItem value="Inbound">{isArabic ? 'وارد' : 'Inbound'}</SelectItem>
                                    <SelectItem value="Transfer">{isArabic ? 'تحويل' : 'Transfer'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All Status'}</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Shipped">Shipped</SelectItem>
                                    <SelectItem value="InTransit">In Transit</SelectItem>
                                    <SelectItem value="Delivered">Delivered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-6">{isArabic ? 'رقم الشحنة' : 'Shipment #'}</TableHead>
                                    <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                    <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead>{isArabic ? 'الناقل' : 'Carrier'}</TableHead>
                                    <TableHead>{isArabic ? 'الوجهة' : 'Destination'}</TableHead>
                                    <TableHead>{isArabic ? 'تاريخ الشحن' : 'Ship Date'}</TableHead>
                                    <TableHead className="text-right">{isArabic ? 'التكلفة' : 'Cost'}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20">{dict.common.loading}</TableCell>
                                    </TableRow>
                                ) : filteredShipments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                            {isArabic ? 'لا توجد شحنات' : 'No shipments found'}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredShipments.map(shipment => {
                                    const statusInfo = statusConfig[shipment.status] || statusConfig.Pending
                                    const StatusIcon = statusInfo.icon
                                    return (
                                        <TableRow key={shipment.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-blue-600">{shipment.shipment_number}</span>
                                                    {shipment.tracking_number && (
                                                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                                            <Package className="h-2.5 w-2.5" /> {shipment.tracking_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    shipment.shipment_type === 'Outbound' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        shipment.shipment_type === 'Inbound' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            'bg-purple-50 text-purple-700 border-purple-200'
                                                }>
                                                    {shipment.shipment_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-slate-400" />
                                                    <span>{shipment.carriers?.name || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {shipment.ship_to_city || shipment.ship_to_country ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-slate-400" />
                                                        {shipment.ship_to_city}{shipment.ship_to_city && shipment.ship_to_country && ', '}{shipment.ship_to_country}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {shipment.ship_date ? format(new Date(shipment.ship_date), 'MMM dd, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                {formatMoney(shipment.shipping_cost || 0)}
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
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedShipment(shipment)
                                                            setIsViewOpen(true)
                                                        }}>
                                                            <Eye className="h-4 w-4 mr-2" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                        </DropdownMenuItem>
                                                        {shipment.tracking_number && shipment.carriers?.tracking_url_template && (
                                                            <DropdownMenuItem onClick={() => openTrackingUrl(shipment)}>
                                                                <ExternalLink className="h-4 w-4 mr-2" /> {isArabic ? 'تتبع الشحنة' : 'Track Shipment'}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel className="text-xs text-muted-foreground">{isArabic ? 'تحديث الحالة' : 'Update Status'}</DropdownMenuLabel>
                                                        {shipment.status !== 'Shipped' && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(shipment, 'Shipped')}>
                                                                <Truck className="h-4 w-4 mr-2" /> {isArabic ? 'تم الشحن' : 'Mark Shipped'}
                                                            </DropdownMenuItem>
                                                        )}
                                                        {shipment.status !== 'Delivered' && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(shipment, 'Delivered')}>
                                                                <CheckCircle2 className="h-4 w-4 mr-2" /> {isArabic ? 'تم التوصيل' : 'Mark Delivered'}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-rose-600"
                                                            onClick={() => handleDelete(shipment.id)}
                                                        >
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

            {/* View Shipment Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل الشحنة' : 'Shipment Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedShipment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'رقم الشحنة' : 'Shipment #'}</span>
                                    <p className="font-bold text-blue-600">{selectedShipment.shipment_number}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'رقم التتبع' : 'Tracking #'}</span>
                                    <p className="font-mono">{selectedShipment.tracking_number || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'الناقل' : 'Carrier'}</span>
                                    <p>{selectedShipment.carriers?.name || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</span>
                                    <Badge className={`${statusConfig[selectedShipment.status]?.color || ''} border-none mt-1`}>
                                        {selectedShipment.status}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'تاريخ الشحن' : 'Ship Date'}</span>
                                    <p>{selectedShipment.ship_date ? format(new Date(selectedShipment.ship_date), 'MMM dd, yyyy') : '-'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{isArabic ? 'التوصيل المتوقع' : 'Expected Delivery'}</span>
                                    <p>{selectedShipment.expected_delivery ? format(new Date(selectedShipment.expected_delivery), 'MMM dd, yyyy') : '-'}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-2">{isArabic ? 'عنوان التوصيل' : 'Delivery Address'}</h4>
                                <p className="text-sm">
                                    {selectedShipment.ship_to_name}<br />
                                    {selectedShipment.ship_to_address}<br />
                                    {selectedShipment.ship_to_city}, {selectedShipment.ship_to_country}
                                </p>
                            </div>
                            {selectedShipment.notes && (
                                <div className="border-t pt-4">
                                    <h4 className="font-bold mb-2">{isArabic ? 'ملاحظات' : 'Notes'}</h4>
                                    <p className="text-sm text-muted-foreground">{selectedShipment.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>{dict.common.close}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
