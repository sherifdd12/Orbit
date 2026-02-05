"use client"

import * as React from "react"
import {
    Plus,
    Search,
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
    ArrowDownLeft,
    Tag,
    Globe
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Vendor {
    id: string
    name: string
    contact_name: string | null
    email: string | null
    phone: string | null
    address: string | null
    tax_number: string | null
    payment_terms: number
    balance: number
    vendor_type: 'Local' | 'International'
    category: string | null
    created_at: string
}

export default function VendorsPage() {
    const { dict, locale } = useLanguage()
    const { currency } = useSettings()
    const [vendors, setVendors] = React.useState<Vendor[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    // Form state
    const [newVendor, setNewVendor] = React.useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        tax_number: '',
        payment_terms: 30,
        vendor_type: 'Local' as const,
        category: ''
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .order('name')

        if (!error) {
            setVendors(data || [])
        }
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleAdd = async () => {
        if (!newVendor.name) return alert("Vendor name is required")
        const { error } = await supabase.from('vendors').insert([newVendor])

        if (error) alert(error.message)
        else {
            setIsAddOpen(false)
            setNewVendor({ name: '', contact_name: '', email: '', phone: '', address: '', tax_number: '', payment_terms: 30, vendor_type: 'Local', category: '' })
            fetchData()
        }
    }

    const filtered = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.contact_name && v.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.purchasing.vendors}</h2>
                    <p className="text-muted-foreground text-sm">Manage your supply chain partners and procurement accounts.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-100 border-none">
                            <Plus className="mr-2 h-4 w-4" /> {dict.common.add} Vendor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Vendor Partner</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Company Name</Label>
                                <Input value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Person</Label>
                                <Input value={newVendor.contact_name} onChange={e => setNewVendor({ ...newVendor, contact_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor Type</Label>
                                <select className="w-full border rounded-md p-2 h-10" value={newVendor.vendor_type} onChange={e => setNewVendor({ ...newVendor, vendor_type: e.target.value as any })}>
                                    <option value="Local">Local (KSA)</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={newVendor.email} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>VAT / Tax Number</Label>
                                <Input value={newVendor.tax_number} onChange={e => setNewVendor({ ...newVendor, tax_number: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input placeholder="e.g. Construction Materials" value={newVendor.category} onChange={e => setNewVendor({ ...newVendor, category: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Address</Label>
                                <Input value={newVendor.address} onChange={e => setNewVendor({ ...newVendor, address: e.target.value })} />
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
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">Total Partners</CardDescription>
                        <CardTitle className="text-2xl font-bold">{vendors.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">Active Procurement</CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-700">{vendors.filter(v => v.vendor_type === 'International').length} Intl / {vendors.filter(v => v.vendor_type === 'Local').length} Local</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-orange-600">Total Payables</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-700">{vendors.reduce((sum, v) => sum + (v.balance || 0), 0).toLocaleString()} {currency}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-xl border border-slate-100 bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + " vendors..."}
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
                                    <TableHead className="pl-6">Vendor Name</TableHead>
                                    <TableHead>Category / Type</TableHead>
                                    <TableHead>VAT Number</TableHead>
                                    <TableHead className="text-right">Balance Due</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20">{dict.common.loading}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No vendors found.</TableCell></TableRow>
                                ) : filtered.map(vendor => (
                                    <TableRow key={vendor.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                                    <Building2 className="h-5 w-5 text-orange-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{vendor.name}</span>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase">
                                                        <Mail className="h-2.5 w-2.5" /> {vendor.email || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                    <Tag className="h-3 w-3 text-slate-400" />
                                                    {vendor.category || 'General'}
                                                </div>
                                                <Badge variant="outline" className={`w-fit text-[9px] h-4 uppercase ${vendor.vendor_type === 'Local' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                    {vendor.vendor_type}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono text-slate-500 uppercase">{vendor.tax_number || 'No Tax ID'}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-orange-600">
                                            {vendor.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                            <div className="text-[9px] text-muted-foreground uppercase opacity-50 tracking-tighter">
                                                Terms: Net {vendor.payment_terms}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Vendor Partner</DropdownMenuLabel>
                                                    <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" /> Edit Vendor</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-blue-600"><Wallet className="h-4 w-4" /> Payment History</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 text-rose-600"><Trash2 className="h-4 w-4" /> Remove</DropdownMenuItem>
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
