"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Package,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Warehouse,
    Filter,
    Edit,
    Trash2,
    Eye,
    Barcode,
    Box,
    BarChart3
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
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
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Item {
    id: string
    name: string
    sku: string
    category: string
    stock_quantity: number
    uom: string
    avg_cost: number
    status?: string
    warehouse_id?: string
}

export default function InventoryPage() {
    const { dict, locale } = useLanguage()
    const isArabic = locale === 'ar'
    const { currency, formatMoney } = useSettings()
    const [items, setItems] = React.useState<Item[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAdjustmentOpen, setIsAdjustmentOpen] = React.useState(false)
    const [selectedItemForAdjustment, setSelectedItemForAdjustment] = React.useState<Item | null>(null)
    const [adjustmentQuantity, setAdjustmentQuantity] = React.useState(0)
    const [adjustmentType, setAdjustmentType] = React.useState<'add' | 'subtract'>('add')
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<Item | null>(null)

    const [warehouses, setWarehouses] = React.useState<{ id: string, name: string }[]>([])
    const [warehouseFilter, setWarehouseFilter] = React.useState<string>("All")
    const [categoryFilter, setCategoryFilter] = React.useState<string>("All")

    const [newItem, setNewItem] = React.useState({
        name: '',
        sku: '',
        category: '',
        stock_quantity: 0,
        uom: 'pcs',
        avg_cost: 0
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [itemsRes, warehousesRes] = await Promise.all([
            supabase.from('items').select('*').order('name'),
            supabase.from('warehouses').select('id, name')
        ])

        if (!itemsRes.error) setItems(itemsRes.data || [])
        if (!warehousesRes.error) setWarehouses(warehousesRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.sku) return alert("Name and SKU are required")
        const { error } = await supabase.from('items').insert([newItem])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewItem({ name: '', sku: '', category: '', stock_quantity: 0, uom: 'pcs', avg_cost: 0 })
            fetchData()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(dict.common.confirm + "?")) return
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleEditItem = async () => {
        if (!editingItem) return
        const { error } = await supabase
            .from('items')
            .update({
                name: editingItem.name,
                sku: editingItem.sku,
                category: editingItem.category,
                uom: editingItem.uom,
                avg_cost: editingItem.avg_cost
            })
            .eq('id', editingItem.id)

        if (error) alert(error.message)
        else {
            setIsEditOpen(false)
            setEditingItem(null)
            fetchData()
        }
    }

    const handleExport = () => {
        const headers = ["Name", "SKU", "Category", "Stock", "UOM", "Avg Cost", "Total Value"]
        const data = items.map(i => [
            i.name, i.sku, i.category, i.stock_quantity, i.uom, i.avg_cost, i.stock_quantity * i.avg_cost
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const handleAdjustment = async () => {
        if (!selectedItemForAdjustment) return
        const newTotal = adjustmentType === 'add'
            ? selectedItemForAdjustment.stock_quantity + adjustmentQuantity
            : selectedItemForAdjustment.stock_quantity - adjustmentQuantity

        if (newTotal < 0) return alert("Stock cannot be negative")

        const { error } = await supabase
            .from('items')
            .update({ stock_quantity: newTotal })
            .eq('id', selectedItemForAdjustment.id)

        if (error) alert(error.message)
        else {
            setIsAdjustmentOpen(false)
            setSelectedItemForAdjustment(null)
            setAdjustmentQuantity(0)
            fetchData()
        }
    }

    const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(false)
    const [selectedItemForTransactions, setSelectedItemForTransactions] = React.useState<Item | null>(null)
    const [itemAuditLogs, setItemAuditLogs] = React.useState<any[]>([])

    const fetchItemAuditLogs = async (itemId: string) => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('record_id', itemId)
            .order('created_at', { ascending: false })

        if (!error) setItemAuditLogs(data || [])
    }

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())

        const matchesCategory = categoryFilter === "All" || item.category === categoryFilter
        const matchesWarehouse = warehouseFilter === "All" || item.warehouse_id === warehouseFilter

        return matchesSearch && matchesCategory && matchesWarehouse
    })

    const categories = Array.from(new Set(items.map(i => i.category))).filter(Boolean)

    const stats = {
        totalItems: items.length,
        lowStock: items.filter(i => i.stock_quantity < 10).length,
        totalValue: items.reduce((sum, i) => sum + (i.stock_quantity * i.avg_cost), 0),
        categories: new Set(items.map(i => i.category)).size
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.inventory.title}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'التحكم في مستويات المخزون، تتبع الحركات، وإدارة البيانات الأساسية للأصناف.' : 'Control your stock levels, track movements, and manage item master data.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="h-4 w-4" /> {dict.common.export}</Button>
                    <Link href="/reports">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" /> {dict.sidebar.reports}
                        </Button>
                    </Link>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg border-none">
                                <Plus className="mr-2 h-4 w-4" /> {dict.common.add} {dict.inventory.itemName}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>{isArabic ? 'تسجيل صنف / منتج جديد' : 'Register New Component / Product'}</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>{dict.inventory.itemName}</Label>
                                    <Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{dict.inventory.sku} / {dict.inventory.barcode}</Label>
                                    <Input value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{dict.inventory.category}</Label>
                                    <Input value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'المخزون الابتدائي' : 'Initial Stock'}</Label>
                                    <Input type="number" value={newItem.stock_quantity} onChange={e => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'وحدة القياس' : 'Unit of Measure (UOM)'}</Label>
                                    <Input placeholder={isArabic ? 'مثال: قطعة، كجم، صندوق' : 'e.g. Pcs, Kg, Box'} value={newItem.uom} onChange={e => setNewItem({ ...newItem, uom: e.target.value })} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{dict.inventory.avgCost} ({currency})</Label>
                                    <Input type="number" step="0.01" value={newItem.avg_cost} onChange={e => setNewItem({ ...newItem, avg_cost: Number(e.target.value) })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleAddItem}>{dict.common.save}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">{isArabic ? 'إجمالي عدد الأصناف' : 'Total SKU Count'}</CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.totalItems}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50 border-rose-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> {dict.inventory.lowStock}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{stats.lowStock}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">{isArabic ? 'إجمالي قيمة المخزون' : 'Total Inventory Value'}</CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{formatMoney(stats.totalValue)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">{isArabic ? 'الفئات' : 'Categories'}</CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.categories}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " inventory..."}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                                <SelectTrigger className="w-48 bg-white border-none shadow-sm h-10">
                                    <SelectValue placeholder="All Warehouses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Warehouses</SelectItem>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-40 bg-white border-none shadow-sm h-10">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{dict.common.all}</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
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
                                    <TableHead className="pl-6 w-12"></TableHead>
                                    <TableHead>{dict.inventory.itemName}</TableHead>
                                    <TableHead>{dict.inventory.category}</TableHead>
                                    <TableHead className="text-right">{dict.inventory.onHand}</TableHead>
                                    <TableHead className="text-right">{dict.inventory.avgCost}</TableHead>
                                    <TableHead className="text-right">{dict.inventory.totalValue}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No items found.</TableCell></TableRow>
                                ) : filteredItems.map(item => (
                                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <Package className="h-4 w-4" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.name}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 uppercase tracking-tight">
                                                    <Barcode className="h-2.5 w-2.5" /> {item.sku}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium h-5">
                                                {item.category || dict.inventory.general}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold ${item.stock_quantity < 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {item.stock_quantity.toLocaleString()} {item.uom}
                                                </span>
                                                {item.stock_quantity < 10 && (
                                                    <span className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-0.5">
                                                        <TrendingDown className="h-2 w-2" /> {dict.inventory.reorder}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatMoney(item.avg_cost || 0)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {formatMoney((item.stock_quantity * item.avg_cost) || 0)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>{dict.inventory.itemOperations}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedItemForTransactions(item)
                                                        fetchItemAuditLogs(item.id)
                                                        setIsTransactionsOpen(true)
                                                    }} className="gap-2">
                                                        <Eye className="h-4 w-4" /> {dict.inventory.viewTransactions}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingItem(item)
                                                        setIsEditOpen(true)
                                                    }} className="gap-2"><Edit className="h-4 w-4" /> {dict.inventory.editDetails}</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedItemForAdjustment(item)
                                                        setIsAdjustmentOpen(true)
                                                    }} className="gap-2 text-blue-600 font-bold"><Box className="h-4 w-4" /> {dict.inventory.stockAdjustment}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" /> Delete Item
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
            <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تصحيح المخزون' : 'Inventory Correction'}: {selectedItemForAdjustment?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                                className={adjustmentType === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                onClick={() => setAdjustmentType('add')}
                            >
                                <Plus className="h-4 w-4 mr-2" /> {isArabic ? 'إضافة مخزون' : 'Add Stock'}
                            </Button>
                            <Button
                                variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                                className={adjustmentType === 'subtract' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                                onClick={() => setAdjustmentType('subtract')}
                            >
                                <TrendingDown className="h-4 w-4 mr-2" /> {isArabic ? 'صرف مخزون' : 'Subtract Stock'}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantity to adjust ({selectedItemForAdjustment?.uom})</Label>
                            <Input
                                type="number"
                                value={adjustmentQuantity}
                                onChange={e => setAdjustmentQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg text-sm">
                            {isArabic ? 'المخزون المتوقع الجديد' : 'New Projected Stock'}: <span className="font-bold">
                                {adjustmentType === 'add'
                                    ? (selectedItemForAdjustment?.stock_quantity || 0) + adjustmentQuantity
                                    : (selectedItemForAdjustment?.stock_quantity || 0) - adjustmentQuantity} {selectedItemForAdjustment?.uom}
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustmentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdjustment} className="bg-blue-600">Apply Correction</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>{isArabic ? 'تعديل البيانات الأساسية للصنف' : 'Edit Item Master Data'}</DialogTitle></DialogHeader>
                    {editingItem && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label>{dict.inventory.itemName}</Label>
                                <Input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.inventory.sku} / {dict.inventory.barcode}</Label>
                                <Input value={editingItem.sku} onChange={e => setEditingItem({ ...editingItem, sku: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.inventory.category}</Label>
                                <Input value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{isArabic ? 'وحدة القياس' : 'Unit of Measure (UOM)'}</Label>
                                <Input value={editingItem.uom} onChange={e => setEditingItem({ ...editingItem, uom: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>{dict.inventory.avgCost} ({currency})</Label>
                                <Input type="number" step="0.01" value={editingItem.avg_cost} onChange={e => setEditingItem({ ...editingItem, avg_cost: Number(e.target.value) })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>{dict.common.cancel}</Button>
                        <Button onClick={handleEditItem}>{dict.common.save}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Item History: {selectedItemForTransactions?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itemAuditLogs.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No transaction history found.</TableCell></TableRow>
                                ) : itemAuditLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                                        <TableCell className="text-xs max-w-xs truncate">
                                            {log.changed_fields?.join(", ") || "Initial Creation"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsTransactionsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
