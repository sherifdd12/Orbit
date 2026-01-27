"use client"

import * as React from "react"
import {
    Plus,
    Search,
    MoreHorizontal,
    User,
    Mail,
    Phone,
    MapPin,
    Loader2,
    Download
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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

interface Customer {
    id: string
    name: string
    email: string
    phone: string
    address: string
    company: string
    balance: number
}

export const runtime = 'edge';

export default function CustomersPage() {
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [newCustomer, setNewCustomer] = React.useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: ''
    })

    const supabase = createClient()

    const fetchCustomers = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name')

        if (!error) setCustomers(data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const handleAddCustomer = async () => {
        if (!newCustomer.name) return alert("Name is required")
        const { error } = await supabase.from('customers').insert([newCustomer])
        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewCustomer({ name: '', email: '', phone: '', company: '', address: '' })
            fetchCustomers()
        }
    }

    const exportToCSV = () => {
        const headers = ["Name", "Company", "Email", "Phone", "Balance"]
        const csvRows = customers.map(c => [c.name, c.company, c.email, c.phone, c.balance].join(","))
        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "customers_report.csv")
        link.click()
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customer Directory</h2>
                    <p className="text-muted-foreground text-sm">Manage your clients and their accounts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label>Full Name</Label><Input value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Company</Label><Input value={newCustomer.company} onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Email</Label><Input value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Phone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
                                </div>
                                <div className="space-y-2"><Label>Address</Label><Input value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} /></div>
                            </div>
                            <DialogFooter><Button onClick={handleAddCustomer}>Save Customer</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search customers..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow> : filtered.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.address}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</div>
                                            <div className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>
                                        </TableCell>
                                        <TableCell>{c.company}</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-600">${(c.balance || 0).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                                    <DropdownMenuItem>View Statement</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-rose-600">Delete</DropdownMenuItem>
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
