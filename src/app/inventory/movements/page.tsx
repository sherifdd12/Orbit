"use client"

import * as React from "react"
import {
    Plus,
    Search,
    ArrowUpCircle,
    ArrowDownCircle,
    ArrowRightLeft,
    Package,
    Calendar,
    Filter,
    Printer,
    Download,
    Eye,
    MoreHorizontal,
    FileText,
    Truck,
    ClipboardCheck,
    Building2,
    TrendingUp,
    TrendingDown,
    BarChart3,
    CheckCircle2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
type MovementStatus = 'Pending' | 'Approved' | 'Completed' | 'Cancelled'

interface StockMovement {
    id: string
    movement_number: string
    movement_type: MovementType
    movement_date: string
    status: MovementStatus
    from_warehouse_id?: string
    to_warehouse_id?: string
    reference_type?: string
    reference_id?: string
    reference_number?: string
    notes?: string
    created_by?: string
    approved_by?: string
    created_at: string
    items: StockMovementItem[]
    from_warehouse?: { id: string, name: string }
    to_warehouse?: { id: string, name: string }
}

interface StockMovementItem {
    id?: string
    item_id: string
    item_name?: string
    sku?: string
    quantity: number
    unit: string
    unit_cost?: number
    notes?: string
}

interface InventoryItem {
    id: string
    name: string
    sku: string
    uom: string
    avg_cost: number
    stock_quantity: number
}

interface Warehouse {
    id: string
    name: string
    code: string
}

const movementTypeConfig = {
    IN: {
        label: 'Goods Receipt',
        labelAr: 'استلام بضائع',
        icon: ArrowDownCircle,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    OUT: {
        label: 'Goods Issue',
        labelAr: 'صرف بضائع',
        icon: ArrowUpCircle,
        color: 'bg-rose-100 text-rose-700 border-rose-200'
    },
    TRANSFER: {
        label: 'Transfer',
        labelAr: 'تحويل',
        icon: ArrowRightLeft,
        color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    ADJUSTMENT: {
        label: 'Adjustment',
        labelAr: 'تعديل',
        icon: ClipboardCheck,
        color: 'bg-amber-100 text-amber-700 border-amber-200'
    }
}

const statusConfig = {
    Pending: { color: 'bg-amber-100 text-amber-700', icon: Calendar },
    Approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    Completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    Cancelled: { color: 'bg-slate-100 text-slate-500', icon: FileText }
}

export default function StockMovementsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [movements, setMovements] = React.useState<StockMovement[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [typeFilter, setTypeFilter] = React.useState<string>("all")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [isViewOpen, setIsViewOpen] = React.useState(false)
    const [isPrintOpen, setIsPrintOpen] = React.useState(false)
    const [selectedMovement, setSelectedMovement] = React.useState<StockMovement | null>(null)
    const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([])
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])

    // New movement form
    const [newMovement, setNewMovement] = React.useState({
        movement_type: 'IN' as MovementType,
        movement_number: `SM-${Date.now().toString().slice(-8)}`,
        movement_date: format(new Date(), "yyyy-MM-dd"),
        from_warehouse_id: '',
        to_warehouse_id: '',
        reference_type: '',
        reference_number: '',
        notes: '',
        items: [{ item_id: '', item_name: '', quantity: 1, unit: 'Pcs', unit_cost: 0, notes: '' }] as StockMovementItem[]
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [movementsRes, itemsRes, warehousesRes] = await Promise.all([
                supabase.from('stock_movements')
                    .select('*, from_warehouse:warehouses!stock_movements_from_warehouse_id_fkey(id, name), to_warehouse:warehouses!stock_movements_to_warehouse_id_fkey(id, name)')
                    .order('movement_date', { ascending: false }),
                supabase.from('inventory_items').select('id, name, sku, uom, avg_cost, stock_quantity').order('name'),
                supabase.from('warehouses').select('id, name, code').order('name')
            ])

            // Fallback for inventory_items if 404
            let finalItems = itemsRes.data || []
            if (itemsRes.error && (itemsRes.error.code === '42P01' || itemsRes.error.message.includes('not found'))) {
                const { data: fallbackData } = await supabase.from('items').select('id, name, sku, uom, avg_cost, stock_quantity').order('name')
                if (fallbackData) finalItems = fallbackData
            }

            if (!movementsRes.error) setMovements(movementsRes.data || [])
            setInventoryItems(finalItems)
            if (!warehousesRes.error) setWarehouses(warehousesRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    // Generate movement number based on type
    const generateMovementNumber = (type: MovementType) => {
        const prefix = type === 'IN' ? 'GRN' : type === 'OUT' ? 'GIN' : type === 'TRANSFER' ? 'TRF' : 'ADJ'
        return `${prefix}-${Date.now().toString().slice(-8)}`
    }

    // Update movement type
    const handleTypeChange = (type: MovementType) => {
        setNewMovement({
            ...newMovement,
            movement_type: type,
            movement_number: generateMovementNumber(type),
            from_warehouse_id: type === 'IN' ? '' : newMovement.from_warehouse_id,
            to_warehouse_id: type === 'OUT' ? '' : newMovement.to_warehouse_id
        })
    }

    // Add item to movement
    const addMovementItem = () => {
        setNewMovement({
            ...newMovement,
            items: [...newMovement.items, { item_id: '', item_name: '', quantity: 1, unit: 'Pcs', unit_cost: 0, notes: '' }]
        })
    }

    // Remove item from movement
    const removeMovementItem = (index: number) => {
        if (newMovement.items.length > 1) {
            setNewMovement({
                ...newMovement,
                items: newMovement.items.filter((_, i) => i !== index)
            })
        }
    }

    // Update item in movement
    const updateMovementItem = (index: number, field: string, value: string | number) => {
        const updatedItems = [...newMovement.items]
        if (field === 'item_id') {
            const item = inventoryItems.find(i => i.id === value)
            if (item) {
                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: item.id,
                    item_name: item.name,
                    unit: item.uom,
                    unit_cost: item.avg_cost
                }
            }
        } else {
            updatedItems[index] = { ...updatedItems[index], [field]: value }
        }
        setNewMovement({ ...newMovement, items: updatedItems })
    }

    // Create movement
    const handleCreateMovement = async () => {
        if (newMovement.items.length === 0 || !newMovement.items[0].item_id) {
            alert(isArabic ? 'يرجى إضافة عنصر واحد على الأقل' : 'Please add at least one item')
            return
        }

        if (newMovement.movement_type === 'IN' && !newMovement.to_warehouse_id) {
            alert(isArabic ? 'يرجى اختيار المستودع الوجهة' : 'Please select destination warehouse')
            return
        }

        if (newMovement.movement_type === 'OUT' && !newMovement.from_warehouse_id) {
            alert(isArabic ? 'يرجى اختيار المستودع المصدر' : 'Please select source warehouse')
            return
        }

        if (newMovement.movement_type === 'TRANSFER' && (!newMovement.from_warehouse_id || !newMovement.to_warehouse_id)) {
            alert(isArabic ? 'يرجى اختيار المستودعين' : 'Please select both warehouses')
            return
        }

        const { error } = await supabase.from('stock_movements').insert([{
            movement_number: newMovement.movement_number,
            movement_type: newMovement.movement_type,
            movement_date: newMovement.movement_date,
            from_warehouse_id: newMovement.from_warehouse_id || null,
            to_warehouse_id: newMovement.to_warehouse_id || null,
            reference_type: newMovement.reference_type || null,
            reference_number: newMovement.reference_number || null,
            notes: newMovement.notes || null,
            status: 'Pending',
            items: newMovement.items
        }])

        if (error) {
            alert(error.message)
        } else {
            setIsCreateOpen(false)
            setNewMovement({
                movement_type: 'IN',
                movement_number: generateMovementNumber('IN'),
                movement_date: format(new Date(), "yyyy-MM-dd"),
                from_warehouse_id: '',
                to_warehouse_id: '',
                reference_type: '',
                reference_number: '',
                notes: '',
                items: [{ item_id: '', item_name: '', quantity: 1, unit: 'Pcs', unit_cost: 0, notes: '' }]
            })
            fetchData()
        }
    }

    // Update movement status
    const handleUpdateStatus = async (id: string, newStatus: MovementStatus) => {
        const { error } = await supabase
            .from('stock_movements')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            // If completed, update inventory quantities
            if (newStatus === 'Completed') {
                const movement = movements.find(m => m.id === id)
                if (movement) {
                    // TODO: Update inventory quantities based on movement type
                    // This would require additional logic for stock adjustments
                }
            }
            fetchData()
        } else {
            alert(error.message)
        }
    }

    // View movement
    const handleViewMovement = (movement: StockMovement) => {
        setSelectedMovement(movement)
        setIsViewOpen(true)
    }

    // Print movement
    const handlePrintMovement = (movement: StockMovement) => {
        setSelectedMovement(movement)
        setIsPrintOpen(true)
    }

    // Get type badge
    const getTypeBadge = (type: MovementType) => {
        const config = movementTypeConfig[type]
        const Icon = config.icon
        return (
            <Badge variant="outline" className={`${config.color} gap-1`}>
                <Icon className="h-3 w-3" />
                {isArabic ? config.labelAr : config.label}
            </Badge>
        )
    }

    // Get status badge
    const getStatusBadge = (status: MovementStatus) => {
        const config = statusConfig[status]
        const Icon = config.icon
        return (
            <Badge variant="outline" className={`${config.color} gap-1`}>
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        )
    }

    // Filter movements
    const filteredMovements = movements.filter(movement => {
        const matchesSearch =
            movement.movement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (movement.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === 'all' || movement.movement_type === typeFilter
        const matchesStatus = statusFilter === 'all' || movement.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
    })

    // Stats
    const stats = {
        incoming: movements.filter(m => m.movement_type === 'IN').length,
        outgoing: movements.filter(m => m.movement_type === 'OUT').length,
        transfers: movements.filter(m => m.movement_type === 'TRANSFER').length,
        pending: movements.filter(m => m.status === 'Pending').length
    }

    // Calculate total value
    const calculateTotalValue = (items: StockMovementItem[]) => {
        return items.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isArabic ? 'حركات المخزون' : 'Stock Movements'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة الاستلام والصرف والتحويلات وتعديلات المخزون' : 'Manage goods receipts, issues, transfers, and adjustments'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-lg shadow-primary/20 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none">
                                <Plus className="mr-2 h-4 w-4" />
                                {isArabic ? 'حركة جديدة' : 'New Movement'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إنشاء حركة مخزون' : 'Create Stock Movement'}</DialogTitle>
                                <DialogDescription>
                                    {isArabic ? 'سجّل استلام أو صرف أو تحويل أو تعديل المخزون' : 'Record goods receipt, issue, transfer, or adjustment'}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                {/* Movement Type Selection */}
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'نوع الحركة' : 'Movement Type'}</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(Object.keys(movementTypeConfig) as MovementType[]).map(type => {
                                            const config = movementTypeConfig[type]
                                            const Icon = config.icon
                                            const isSelected = newMovement.movement_type === type
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => handleTypeChange(type)}
                                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                                                    <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                                        {isArabic ? config.labelAr : config.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'رقم الحركة' : 'Movement #'}</Label>
                                        <Input value={newMovement.movement_number} readOnly className="bg-slate-50 font-mono" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'التاريخ' : 'Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newMovement.movement_date}
                                            onChange={(e) => setNewMovement({ ...newMovement, movement_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'رقم المرجع' : 'Reference #'}</Label>
                                        <Input
                                            value={newMovement.reference_number}
                                            onChange={(e) => setNewMovement({ ...newMovement, reference_number: e.target.value })}
                                            placeholder={isArabic ? 'رقم أمر الشراء/الفاتورة...' : 'PO/Invoice number...'}
                                        />
                                    </div>
                                </div>

                                {/* Warehouses */}
                                <div className="grid grid-cols-2 gap-4">
                                    {(newMovement.movement_type === 'OUT' || newMovement.movement_type === 'TRANSFER') && (
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'من المستودع' : 'From Warehouse'} *</Label>
                                            <Select
                                                value={newMovement.from_warehouse_id}
                                                onValueChange={(val) => setNewMovement({ ...newMovement, from_warehouse_id: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isArabic ? 'اختر المستودع...' : 'Select warehouse...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map(wh => (
                                                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {(newMovement.movement_type === 'IN' || newMovement.movement_type === 'TRANSFER') && (
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'إلى المستودع' : 'To Warehouse'} *</Label>
                                            <Select
                                                value={newMovement.to_warehouse_id}
                                                onValueChange={(val) => setNewMovement({ ...newMovement, to_warehouse_id: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isArabic ? 'اختر المستودع...' : 'Select warehouse...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.filter(wh => wh.id !== newMovement.from_warehouse_id).map(wh => (
                                                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {newMovement.movement_type === 'ADJUSTMENT' && (
                                        <div className="space-y-2 col-span-2">
                                            <Label>{isArabic ? 'المستودع' : 'Warehouse'} *</Label>
                                            <Select
                                                value={newMovement.to_warehouse_id}
                                                onValueChange={(val) => setNewMovement({ ...newMovement, to_warehouse_id: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isArabic ? 'اختر المستودع...' : 'Select warehouse...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map(wh => (
                                                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Items */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">{isArabic ? 'الأصناف' : 'Items'}</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addMovementItem}>
                                            <Plus className="h-4 w-4 mr-1" /> {isArabic ? 'إضافة صنف' : 'Add Item'}
                                        </Button>
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50">
                                                    <TableHead className="w-[40%]">{isArabic ? 'الصنف' : 'Item'}</TableHead>
                                                    <TableHead className="w-[15%] text-center">{isArabic ? 'الكمية' : 'Qty'}</TableHead>
                                                    <TableHead className="w-[12%] text-center">{isArabic ? 'الوحدة' : 'Unit'}</TableHead>
                                                    <TableHead className="w-[18%] text-right">{isArabic ? 'التكلفة' : 'Unit Cost'}</TableHead>
                                                    <TableHead className="w-[15%] text-right">{isArabic ? 'الإجمالي' : 'Total'}</TableHead>
                                                    <TableHead className="w-[5%]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {newMovement.items.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="p-1">
                                                            <Select
                                                                value={item.item_id}
                                                                onValueChange={(val) => updateMovementItem(idx, 'item_id', val)}
                                                            >
                                                                <SelectTrigger className="border-0 shadow-none h-9">
                                                                    <SelectValue placeholder={isArabic ? 'اختر الصنف...' : 'Select item...'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {inventoryItems.map(inv => (
                                                                        <SelectItem key={inv.id} value={inv.id}>
                                                                            {inv.name} ({inv.sku})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateMovementItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="text-center border-0 shadow-none focus-visible:ring-1"
                                                                min="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1 text-center text-sm text-muted-foreground">
                                                            {item.unit || '-'}
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.unit_cost || ''}
                                                                onChange={(e) => updateMovementItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                                className="text-right border-0 shadow-none focus-visible:ring-1"
                                                                min="0"
                                                                step="0.001"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="p-1 text-right font-mono font-bold text-emerald-600">
                                                            {formatMoney(item.quantity * (item.unit_cost || 0))}
                                                        </TableCell>
                                                        <TableCell className="p-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-rose-500 hover:text-rose-700"
                                                                onClick={() => removeMovementItem(idx)}
                                                                disabled={newMovement.items.length === 1}
                                                            >
                                                                ×
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-end">
                                        <div className="w-64 p-3 bg-slate-50 rounded-lg">
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>{isArabic ? 'الإجمالي' : 'Total Value'}</span>
                                                <span className="font-mono text-emerald-600">
                                                    {formatMoney(calculateTotalValue(newMovement.items))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                    <Textarea
                                        value={newMovement.notes}
                                        onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                                        placeholder={isArabic ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {dict.common.cancel}
                                </Button>
                                <Button onClick={handleCreateMovement} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                                    {isArabic ? 'إنشاء الحركة' : 'Create Movement'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4" />
                            {isArabic ? 'الاستلام' : 'Goods Received'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-emerald-700">{stats.incoming}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4" />
                            {isArabic ? 'الصرف' : 'Goods Issued'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-rose-700">{stats.outgoing}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4" />
                            {isArabic ? 'التحويلات' : 'Transfers'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-blue-700">{stats.transfers}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {isArabic ? 'في الانتظار' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-3xl text-amber-700">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Movements Table */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={`${dict.common.search} ${isArabic ? 'الحركات...' : 'movements...'}`}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-36 bg-white">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder={isArabic ? 'النوع' : 'Type'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dict.common.all}</SelectItem>
                                    <SelectItem value="IN">{isArabic ? 'استلام' : 'Goods Receipt'}</SelectItem>
                                    <SelectItem value="OUT">{isArabic ? 'صرف' : 'Goods Issue'}</SelectItem>
                                    <SelectItem value="TRANSFER">{isArabic ? 'تحويل' : 'Transfer'}</SelectItem>
                                    <SelectItem value="ADJUSTMENT">{isArabic ? 'تعديل' : 'Adjustment'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32 bg-white">
                                    <SelectValue placeholder={isArabic ? 'الحالة' : 'Status'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dict.common.all}</SelectItem>
                                    <SelectItem value="Pending">{isArabic ? 'معلق' : 'Pending'}</SelectItem>
                                    <SelectItem value="Approved">{isArabic ? 'معتمد' : 'Approved'}</SelectItem>
                                    <SelectItem value="Completed">{isArabic ? 'مكتمل' : 'Completed'}</SelectItem>
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
                                    <TableHead>{isArabic ? 'الرقم' : 'Number'}</TableHead>
                                    <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                    <TableHead>{isArabic ? 'المستودع' : 'Warehouse'}</TableHead>
                                    <TableHead>{isArabic ? 'المرجع' : 'Reference'}</TableHead>
                                    <TableHead>{dict.common.status}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                {dict.common.loading}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredMovements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            {isArabic ? 'لا توجد حركات' : 'No movements found'}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredMovements.map(movement => (
                                    <TableRow key={movement.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 text-sm font-medium">
                                            {format(new Date(movement.movement_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-indigo-600">
                                            {movement.movement_number}
                                        </TableCell>
                                        <TableCell>{getTypeBadge(movement.movement_type)}</TableCell>
                                        <TableCell className="text-sm">
                                            {movement.movement_type === 'IN' && movement.to_warehouse?.name}
                                            {movement.movement_type === 'OUT' && movement.from_warehouse?.name}
                                            {movement.movement_type === 'TRANSFER' && (
                                                <span className="flex items-center gap-1">
                                                    {movement.from_warehouse?.name}
                                                    <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                                                    {movement.to_warehouse?.name}
                                                </span>
                                            )}
                                            {movement.movement_type === 'ADJUSTMENT' && movement.to_warehouse?.name}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {movement.reference_number || '-'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(movement.status)}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>{isArabic ? 'إجراءات' : 'Actions'}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleViewMovement(movement)} className="gap-2">
                                                        <Eye className="h-4 w-4" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handlePrintMovement(movement)} className="gap-2">
                                                        <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {movement.status === 'Pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(movement.id, 'Approved')} className="gap-2 text-blue-600">
                                                                <CheckCircle2 className="h-4 w-4" /> {isArabic ? 'اعتماد' : 'Approve'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(movement.id, 'Completed')} className="gap-2 text-emerald-600">
                                                                <CheckCircle2 className="h-4 w-4" /> {isArabic ? 'إتمام' : 'Complete'}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {movement.status === 'Approved' && (
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(movement.id, 'Completed')} className="gap-2 text-emerald-600">
                                                            <CheckCircle2 className="h-4 w-4" /> {isArabic ? 'إتمام' : 'Complete'}
                                                        </DropdownMenuItem>
                                                    )}
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

            {/* View Movement Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل الحركة' : 'Movement Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedMovement && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'رقم الحركة' : 'Movement #'}</p>
                                    <p className="font-bold text-lg text-indigo-600">{selectedMovement.movement_number}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'النوع' : 'Type'}</p>
                                    {getTypeBadge(selectedMovement.movement_type)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'التاريخ' : 'Date'}</p>
                                    <p className="font-medium">{format(new Date(selectedMovement.movement_date), "MMM dd, yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</p>
                                    {getStatusBadge(selectedMovement.status)}
                                </div>
                                {selectedMovement.from_warehouse && (
                                    <div>
                                        <p className="text-muted-foreground">{isArabic ? 'من المستودع' : 'From Warehouse'}</p>
                                        <p className="font-medium">{selectedMovement.from_warehouse.name}</p>
                                    </div>
                                )}
                                {selectedMovement.to_warehouse && (
                                    <div>
                                        <p className="text-muted-foreground">{isArabic ? 'إلى المستودع' : 'To Warehouse'}</p>
                                        <p className="font-medium">{selectedMovement.to_warehouse.name}</p>
                                    </div>
                                )}
                            </div>
                            {selectedMovement.items && selectedMovement.items.length > 0 && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground mb-2">{isArabic ? 'الأصناف' : 'Items'}</p>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        {selectedMovement.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between py-1">
                                                <span>{item.item_name || 'Item'}</span>
                                                <span className="font-mono">{item.quantity} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedMovement.notes && (
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground mb-2">{isArabic ? 'ملاحظات' : 'Notes'}</p>
                                    <p className="text-sm bg-slate-50 p-3 rounded-lg">{selectedMovement.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => { setIsViewOpen(false); handlePrintMovement(selectedMovement!) }} className="gap-2">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Movement Dialog */}
            <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="no-print">
                        <DialogTitle>{isArabic ? 'معاينة الطباعة' : 'Print Preview'}</DialogTitle>
                    </DialogHeader>
                    {selectedMovement && (
                        <div className="p-8 bg-white printable-document">
                            {/* Print Header */}
                            <div className="border-b-2 border-slate-800 pb-4 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-800">
                                            {movementTypeConfig[selectedMovement.movement_type].label}
                                        </h1>
                                        <p className="text-lg text-slate-600">
                                            {movementTypeConfig[selectedMovement.movement_type].labelAr}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-mono font-bold text-indigo-600">
                                            {selectedMovement.movement_number}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {format(new Date(selectedMovement.movement_date), "dd/MM/yyyy")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warehouse Info */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {selectedMovement.from_warehouse && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                                            {isArabic ? 'من المستودع' : 'From Warehouse'}
                                        </p>
                                        <p className="font-bold text-lg">{selectedMovement.from_warehouse.name}</p>
                                    </div>
                                )}
                                {selectedMovement.to_warehouse && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">
                                            {isArabic ? 'إلى المستودع' : 'To Warehouse'}
                                        </p>
                                        <p className="font-bold text-lg">{selectedMovement.to_warehouse.name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <table className="w-full border-collapse mb-6">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="border p-2 text-left">#</th>
                                        <th className="border p-2 text-left">{isArabic ? 'الصنف' : 'Item'}</th>
                                        <th className="border p-2 text-center">{isArabic ? 'الكمية' : 'Quantity'}</th>
                                        <th className="border p-2 text-center">{isArabic ? 'الوحدة' : 'Unit'}</th>
                                        <th className="border p-2 text-right">{isArabic ? 'التكلفة' : 'Unit Cost'}</th>
                                        <th className="border p-2 text-right">{isArabic ? 'الإجمالي' : 'Total'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedMovement.items || []).map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="border p-2">{idx + 1}</td>
                                            <td className="border p-2 font-medium">{item.item_name || 'Item'}</td>
                                            <td className="border p-2 text-center font-mono">{item.quantity}</td>
                                            <td className="border p-2 text-center">{item.unit}</td>
                                            <td className="border p-2 text-right font-mono">{formatMoney(item.unit_cost || 0)}</td>
                                            <td className="border p-2 text-right font-mono font-bold">
                                                {formatMoney(item.quantity * (item.unit_cost || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-bold">
                                        <td colSpan={5} className="border p-2 text-right">
                                            {isArabic ? 'الإجمالي' : 'Total Value'}
                                        </td>
                                        <td className="border p-2 text-right font-mono text-lg">
                                            {formatMoney(calculateTotalValue(selectedMovement.items || []))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Notes */}
                            {selectedMovement.notes && (
                                <div className="mb-6">
                                    <p className="text-sm font-bold mb-1">{isArabic ? 'ملاحظات:' : 'Notes:'}</p>
                                    <p className="text-sm bg-slate-50 p-3 rounded">{selectedMovement.notes}</p>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-3 gap-8 mt-12">
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-300 pt-2 mt-12">
                                        <p className="text-sm font-medium">{isArabic ? 'المُعد' : 'Prepared By'}</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-300 pt-2 mt-12">
                                        <p className="text-sm font-medium">{isArabic ? 'المُستلم' : 'Received By'}</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-300 pt-2 mt-12">
                                        <p className="text-sm font-medium">{isArabic ? 'المُعتمد' : 'Approved By'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Print Footer */}
                            <div className="mt-8 pt-4 border-t text-center text-xs text-slate-400">
                                <p>{isArabic ? 'تم الطباعة بتاريخ' : 'Printed on'}: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="no-print">
                        <Button variant="outline" onClick={() => setIsPrintOpen(false)}>{dict.common.close}</Button>
                        <Button onClick={() => window.print()} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                            <Printer className="h-4 w-4" /> {isArabic ? 'طباعة' : 'Print'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .printable-document, .printable-document * {
                        visibility: visible;
                    }
                    .printable-document {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    )
}
