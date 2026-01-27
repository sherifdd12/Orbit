"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Package
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

// Define Item Interface
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

export const runtime = 'edge';

export default function InventoryPage() {
    const [items, setItems] = React.useState<Item[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newItem, setNewItem] = React.useState({
        name: '',
        sku: '',
        category: '',
        stock_quantity: 0,
        uom: 'pcs',
        avg_cost: 0
    })

    const [editingItem, setEditingItem] = React.useState<Item | null>(null)
    const [viewingItem, setViewingItem] = React.useState<Item | null>(null)
    const [isCustomCategory, setIsCustomCategory] = React.useState(false)
    const [customCategory, setCustomCategory] = React.useState("")
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    const fetchItems = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) setItems(data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchItems()
    }, [fetchItems])

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.sku) return alert("Name and SKU are required")
        const finalCategory = isCustomCategory ? customCategory : newItem.category
        const { error } = await supabase.from('items').insert([{
            ...newItem,
            category: finalCategory
        }])

        if (error) alert("Failed to create item: " + error.message)
        else {
            setIsAddOpen(false)
            setNewItem({ name: '', sku: '', category: '', stock_quantity: 0, uom: 'pcs', avg_cost: 0 })
            setCustomCategory("")
            setIsCustomCategory(false)
            fetchItems()
        }
    }

    const handleUpdateItem = async () => {
        if (!editingItem) return
        const { error } = await supabase.from('items').update({
            name: editingItem.name,
            sku: editingItem.sku,
            category: editingItem.category,
            stock_quantity: editingItem.stock_quantity,
            uom: editingItem.uom,
            avg_cost: editingItem.avg_cost
        }).eq('id', editingItem.id)

        if (error) alert(error.message)
        else {
            setEditingItem(null)
            fetchItems()
        }
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Delete this item?")) return
        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchItems()
    }

    const exportToCSV = () => {
        const headers = ["Name", "SKU", "Category", "Stock", "Unit", "Avg Cost"]
        const csvRows = items.map(i => [i.name, i.sku, i.category, i.stock_quantity, i.uom, i.avg_cost].join(","))
        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "inventory_report.csv")
        link.click()
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory Master</h2>
                    <p className="text-muted-foreground text-sm">Manage your products and materials.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Item</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Name</Label><Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="col-span-3" /></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">SKU</Label><Input value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} className="col-span-3" /></div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Category</Label>
                                    <div className="col-span-3 flex flex-col gap-2">
                                        <select className="border rounded p-2 text-sm" value={isCustomCategory ? "NEW" : newItem.category} onChange={e => {
                                            if (e.target.value === "NEW") setIsCustomCategory(true)
                                            else { setIsCustomCategory(false); setNewItem({ ...newItem, category: e.target.value }) }
                                        }}>
                                            <option value="">Select Category</option>
                                            {[...new Set(items.map(i => i.category))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="NEW">+ Add New Category</option>
                                        </select>
                                        {isCustomCategory && <Input placeholder="New Category Name" value={customCategory} onChange={e => setCustomCategory(e.target.value)} />}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Stock/Unit</Label><div className="col-span-3 flex gap-2"><Input type="number" value={newItem.stock_quantity} onChange={e => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })} /><Input placeholder="Unit" value={newItem.uom} onChange={e => setNewItem({ ...newItem, uom: e.target.value })} /></div></div>
                                <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Avg. Cost</Label><Input type="number" className="col-span-3" value={newItem.avg_cost} onChange={e => setNewItem({ ...newItem, avg_cost: Number(e.target.value) })} /></div>
                            </div>
                            <DialogFooter><Button onClick={handleAddItem}>Save</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader><div className="relative w-full md:w-96"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead></TableHead><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Cost</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow> : filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell><Package className="h-4 w-4 text-muted-foreground" /></TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                        <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                        <TableCell className="text-right font-semibold">{item.stock_quantity} {item.uom}</TableCell>
                                        <TableCell className="text-right font-mono">${(item.avg_cost || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingItem(item)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setViewingItem(item)}>View</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteItem(item.id)}>Delete</DropdownMenuItem>
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

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
                    {editingItem && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Name</Label><Input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Stock</Label><Input type="number" value={editingItem.stock_quantity} onChange={e => setEditingItem({ ...editingItem, stock_quantity: Number(e.target.value) })} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Avg. Cost</Label><Input type="number" value={editingItem.avg_cost} onChange={e => setEditingItem({ ...editingItem, avg_cost: Number(e.target.value) })} className="col-span-3" /></div>
                        </div>
                    )}
                    <DialogFooter><Button onClick={handleUpdateItem}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Item Details</DialogTitle></DialogHeader>
                    {viewingItem && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs text-muted-foreground">Name</Label><p className="font-semibold">{viewingItem.name}</p></div>
                                <div><Label className="text-xs text-muted-foreground">SKU</Label><p className="font-mono">{viewingItem.sku}</p></div>
                                <div><Label className="text-xs text-muted-foreground">Category</Label><p>{viewingItem.category || 'N/A'}</p></div>
                                <div><Label className="text-xs text-muted-foreground">Stock</Label><p className="font-semibold">{viewingItem.stock_quantity} {viewingItem.uom}</p></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
