"use client"

import * as React from "react"
import {
    Plus,
    Search,
    UserCircle,
    Building2,
    Mail,
    Phone,
    MapPin,
    Wallet,
    MoreHorizontal,
    Edit,
    Trash2,
    Filter,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

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
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Customer {
    id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    address: string | null
    balance: number
    customer_type: 'Individual' | 'Company'
    credit_limit: number
    payment_terms: number
    created_at: string
}

export default function CustomersPage() {
    const { dict, locale } = useLanguage()
    const { currency } = useSettings()
    const [customers, setCustomers] = React.useState<Customer[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Form state
    const [newCust, setNewCust] = React.useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        customer_type: 'Company' as const,
        credit_limit: 10000,
        payment_terms: 30
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name')

        if (!error) {
            setCustomers(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAdd = async () => {
        if (!newCust.name) return alert("Customer name is required")
        const { error } = await supabase.from('customers').insert([newCust])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewCust({ name: '', company: '', email: '', phone: '', address: '', customer_type: 'Company', credit_limit: 10000, payment_terms: 30 })
            fetchData()
        }
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sales.customers}</h2>
                    <p className="text-muted-foreground text-sm">Manage your client list, credit limits, and contact information.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> {dict.common.add} {dict.operations.customer}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Full Name / Contact Person</Label>
                                <Input value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input value={newCust.company} onChange={e => setNewCust({ ...newCust, company: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Customer Type</Label>
                                <select className="w-full border rounded-md p-2 h-10" value={newCust.customer_type} onChange={e => setNewCust({ ...newCust, customer_type: e.target.value as any })}>
                                    <option value="Company">Company / Business</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={newCust.email} onChange={e => setNewCust({ ...newCust, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Address</Label>
                                <Input value={newCust.address} onChange={e => setNewCust({ ...newCust, address: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Credit Limit ({currency})</Label>
                                <Input type="number" value={newCust.credit_limit} onChange={e => setNewCust({ ...newCust, credit_limit: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Terms (Days)</Label>
                                <Input type="number" value={newCust.payment_terms} onChange={e => setNewCust({ ...newCust, payment_terms: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{dict.common.cancel}</Button>
                            <Button onClick={handleAdd}>{dict.common.save}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">Total Customers</CardDescription>
                        <CardTitle className="text-2xl font-bold">{customers.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">Active Accounts</CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{customers.filter(c => Math.abs(c.balance) > 0).length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600">Total Receivables</CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{customers.reduce((sum, c) => sum + (c.balance || 0), 0).toLocaleString()} {currency}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " customers..."}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Customer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No customers found.</TableCell></TableRow>
                                ) : filtered.map(customer => (
                                    <TableRow key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                    {customer.customer_type === 'Company' ? <Building2 className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{customer.name}</span>
                                                    {customer.company && <span className="text-xs text-muted-foreground">{customer.company}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={customer.customer_type === 'Company' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700'}>
                                                {customer.customer_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> {customer.email || '-'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> {customer.phone || '-'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono font-bold ${customer.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            <div className="text-[9px] text-muted-foreground uppercase opacity-50 tracking-tighter">
                                                Limit: {customer.credit_limit.toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Customer Profile</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit Profile</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-blue-600"><Wallet className="h-4 w-4" /> View Ledger</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Deactivate</DropdownMenuItem>
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
