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
    Box
} from "lucide-react"
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
import { useLanguage } from "@/lib/i18n/LanguageContext"

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
}

export default function InventoryPage() {
    const { dict, locale } = useLanguage()
    const [items, setItems] = React.useState<Item[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

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
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) setItems(data || [])
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

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                    <p className="text-muted-foreground text-sm">Control your stock levels, track movements, and manage item master data.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => handleActionPlaceholder('Export')}><Download className="h-4 w-4" /> {dict.common.export}</Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg border-none">
                                <Plus className="mr-2 h-4 w-4" /> {dict.common.add} {dict.inventory.itemName}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader><DialogTitle>Register New Component / Product</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Item Name</Label>
                                    <Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKU / Barcode</Label>
                                    <Input value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Initial Stock</Label>
                                    <Input type="number" value={newItem.stock_quantity} onChange={e => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit of Measure (UOM)</Label>
                                    <Input placeholder="e.g. Pcs, Kg, Box" value={newItem.uom} onChange={e => setNewItem({ ...newItem, uom: e.target.value })} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Average Cost (SAR)</Label>
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
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">Total SKU Count</CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.totalItems}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50 border-rose-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> Low Stock Alerts
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{stats.lowStock}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">Total Inventory Value</CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{stats.totalValue.toLocaleString()} SAR</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">Categories</CardDescription>
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
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="h-7 cursor-pointer hover:bg-slate-100" onClick={() => handleActionPlaceholder('Warehouse Filter')}><Warehouse className="h-3 w-3 mr-1" /> Main Warehouse</Badge>
                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleActionPlaceholder('Filters')}><Filter className="h-4 w-4" /></Button>
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
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">On Hand</TableHead>
                                    <TableHead className="text-right">Avg Cost</TableHead>
                                    <TableHead className="text-right">Total Value</TableHead>
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
                                                {item.category || 'General'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold ${item.stock_quantity < 10 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {item.stock_quantity.toLocaleString()} {item.uom}
                                                </span>
                                                {item.stock_quantity < 10 && (
                                                    <span className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-0.5">
                                                        <TrendingDown className="h-2 w-2" /> REORDER
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {item.avg_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {(item.stock_quantity * item.avg_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Item Operations</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('View Transactions')} className="gap-2"><Eye className="h-4 w-4" /> View Transactions</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Edit Item')} className="gap-2"><Edit className="h-4 w-4" /> Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Stock Adjustment')} className="gap-2 text-blue-600"><Box className="h-4 w-4" /> Stock Adjustment</DropdownMenuItem>
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
        </div>
    )
}
