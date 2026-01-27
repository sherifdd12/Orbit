"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Package,
    Loader2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
// import { toast } from "sonner" 

// Define Item Interface
interface Item {
    id: string
    name: string
    sku: string
    category: string
    stock_quantity: number
    uom: string
    avg_cost: number
    status?: string // Derived in UI
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

    // Search state
    const [searchTerm, setSearchTerm] = React.useState("")

    const supabase = createClient()

    // Fetch Items
    const fetchItems = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching items:', error)
            // fallback to empty
        } else {
            setItems(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchItems()
    }, [fetchItems])

    // Handle Add Item
    const handleAddItem = async () => {
        if (!newItem.name || !newItem.sku) {
            alert("Name and SKU are required")
            return
        }

        const { error } = await supabase.from('items').insert([
            {
                name: newItem.name,
                sku: newItem.sku,
                category: newItem.category,
                stock_quantity: newItem.stock_quantity,
                uom: newItem.uom,
                avg_cost: newItem.avg_cost
            }
        ])

        if (error) {
            console.error(error)
            alert("Failed to create item: " + error.message)
        } else {
            setIsAddOpen(false)
            setNewItem({ name: '', sku: '', category: '', stock_quantity: 0, uom: 'pcs', avg_cost: 0 })
            fetchItems() // Refresh
        }
    }

    // Handle Update Item
    const handleUpdateItem = async () => {
        if (!editingItem) return

        const { error } = await supabase
            .from('items')
            .update({
                name: editingItem.name,
                sku: editingItem.sku,
                category: editingItem.category,
                stock_quantity: editingItem.stock_quantity,
                uom: editingItem.uom,
                avg_cost: editingItem.avg_cost
            })
            .eq('id', editingItem.id)

        if (error) {
            alert("Failed to update item: " + error.message)
        } else {
            setEditingItem(null)
            fetchItems()
        }
    }

    // Handle Delete Item
    const handleDeleteItem = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        const { error } = await supabase.from('items').delete().eq('id', id)
        if (error) {
            alert("Failed to delete item: " + error.message)
        } else {
            fetchItems()
        }
    }

    // Derived state for filtering
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory Master</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage your items, materials, and products across all warehouses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Item</DialogTitle>
                                <DialogDescription>
                                    Create a new inventory item. Click save when you&apos;re done.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sku" className="text-right">
                                        SKU
                                    </Label>
                                    <Input
                                        id="sku"
                                        value={newItem.sku}
                                        onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right">
                                        Category
                                    </Label>
                                    <div className="col-span-3 flex gap-2">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        >
                                            <option value="">Select Category</option>
                                            {[...new Set(items.map(i => i.category))].filter(Boolean).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="NEW">+ Add New Category</option>
                                        </select>
                                        {newItem.category === 'NEW' && (
                                            <Input
                                                placeholder="Enter Category"
                                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock & Unit</Label>
                                    <div className="col-span-3 grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            value={newItem.stock_quantity}
                                            onChange={(e) => setNewItem({ ...newItem, stock_quantity: Number(e.target.value) })}
                                        />
                                        <Input
                                            placeholder="Unit (e.g. pcs, kg)"
                                            value={newItem.uom}
                                            onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Avg. Cost</Label>
                                    <Input
                                        type="number"
                                        className="col-span-3"
                                        value={newItem.avg_cost}
                                        onChange={(e) => setNewItem({ ...newItem, avg_cost: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddItem}>Save changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, SKU..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Stock Level</TableHead>
                                    <TableHead className="text-right">Unit</TableHead>
                                    <TableHead className="text-right">Avg. Cost</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                            Loading inventory...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell>
                                                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                                                    <Package className="h-4 w-4 text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground font-mono">{item.sku}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                                                    {item.category || 'Uncategorized'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{item.stock_quantity}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{item.uom}</TableCell>
                                            <TableCell className="text-right font-mono">${(item.avg_cost || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setEditingItem(item)}>Edit Item</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => alert("Item Details: " + JSON.stringify(item, null, 2))}>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteItem(item.id)}>Delete Item</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Total Items: {items.length}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
