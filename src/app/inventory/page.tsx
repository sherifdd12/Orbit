"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    ArrowUpDown,
    Download,
    Package
} from "lucide-react"

import { Button } from "@/components/ui/button"
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

const mockItems = [
    {
        id: "1",
        name: "Steel Rebar 12mm",
        sku: "ST-RB-12",
        category: "Construction",
        stock: 450,
        uom: "kg",
        price: 0.85,
        status: "Low Stock",
    },
    {
        id: "2",
        name: "Portland Cement",
        sku: "CM-PT-50",
        category: "Construction",
        stock: 120,
        uom: "bags",
        price: 12.50,
        status: "In Stock",
    },
    {
        id: "3",
        name: "Copper Wire 2.5mm",
        sku: "EL-CW-25",
        category: "Electrical",
        stock: 15,
        uom: "rolls",
        price: 45.00,
        status: "Critical",
    },
    {
        id: "4",
        name: "Safety Helmets (White)",
        sku: "SF-HM-WH",
        category: "Safety",
        stock: 85,
        uom: "pcs",
        price: 8.00,
        status: "In Stock",
    },
]

export default function InventoryPage() {
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
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Item
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, SKU, or category..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Icon</TableHead>
                                    <TableHead>
                                        <div className="flex items-center">
                                            Item Name
                                            <ArrowUpDown className="ml-2 h-4 w-4 cursor-pointer" />
                                        </div>
                                    </TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Stock Level</TableHead>
                                    <TableHead className="text-right">Unit</TableHead>
                                    <TableHead className="text-right">Avg. Cost</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockItems.map((item) => (
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
                                                {item.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{item.stock}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{item.uom}</TableCell>
                                        <TableCell className="text-right font-mono">${item.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-rose-100 text-rose-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
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
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Edit Stock</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-rose-600">Delete Item</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing <strong>4</strong> of <strong>128</strong> items
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
