"use client"

import * as React from "react"
import {
    Plus,
    Search,
    Building2,
    MapPin,
    Package,
    Warehouse,
    MoreHorizontal,
    Box,
    Truck,
    ArrowRightLeft,
    ShieldCheck,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    Navigation,
    Phone
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
import { Progress } from "@/components/ui/progress"
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


interface WarehouseData {
    id: string
    name: string
    code: string
    location: string
    manager?: string
    capacity_used: number
    total_capacity: number
    status: 'Active' | 'Full' | 'Inactive'
    contact_phone?: string
}

export default function WarehousesPage() {
    const { dict, locale } = useLanguage()
    const [warehouses, setWarehouses] = React.useState<WarehouseData[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isAddOpen, setIsAddOpen] = React.useState(false)
    const [newWarehouse, setNewWarehouse] = React.useState({
        name: '',
        code: '',
        location: '',
        status: 'Active' as const,
        total_capacity: 100,
        contact_phone: ''
    })

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('warehouses')
            .select(`
                *,
                manager:profiles(full_name)
            `)
            .order('name')

        if (!error && data) {
            setWarehouses(data.map((w: any) => ({
                ...w,
                manager: w.manager?.full_name || 'Unassigned'
            })) as WarehouseData[])
        } else {
            // Only use mock if database fetch fails and it's a first load
            if (!warehouses.length) {
                setWarehouses([
                    { id: '1', name: 'Main Central Hub', code: 'WH-MAIN', location: 'Riyadh Industrial City', capacity_used: 75, total_capacity: 100, status: 'Active', manager: 'Ahmed Al-Shehri', contact_phone: '+966-505-1234' },
                    { id: '2', name: 'Jeddah Coastal Port', code: 'WH-JED-01', location: 'King Abdullah Port', capacity_used: 92, total_capacity: 100, status: 'Full', manager: 'Sami Bakri', contact_phone: '+966-501-5678' },
                    { id: '3', name: 'Dammam Eastern Depot', code: 'WH-DAM-03', location: 'Dammam Port Area', capacity_used: 40, total_capacity: 100, status: 'Active', manager: 'Fahad Aziz', contact_phone: '+966-504-9900' },
                    { id: '4', name: 'Al-Khobar Supply Site', code: 'WH-KHB-02', location: 'Al-Khobar North', capacity_used: 0, total_capacity: 100, status: 'Inactive', manager: 'Khalid Omar' }
                ])
            }
        }
        setLoading(false)
    }, [supabase])

    const handleAddWarehouse = async () => {
        if (!newWarehouse.name || !newWarehouse.code) return alert("Name and Code are required")
        const { error } = await supabase.from('warehouses').insert([newWarehouse])
        if (error) {
            alert(error.message)
        } else {
            setIsAddOpen(false)
            setNewWarehouse({ name: '', code: '', location: '', status: 'Active', total_capacity: 100, contact_phone: '' })
            fetchData()
        }
    }

    const handleDeleteWarehouse = async (id: string) => {
        if (!confirm("Are you sure you want to decommission this logistics node?")) return
        const { error } = await supabase.from('warehouses').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const getStatusBadge = (status: WarehouseData['status']) => {
        switch (status) {
            case 'Active': return <Badge className="bg-emerald-100 text-emerald-700 border-none">Operational</Badge>
            case 'Full': return <Badge className="bg-rose-100 text-rose-700 border-none">Near Capacity</Badge>
            case 'Inactive': return <Badge variant="secondary">Offline</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const handleActionPlaceholder = (action: string) => {
        alert(`${action} feature is under development. Coming soon!`)
    }

    const filtered = warehouses.filter(w =>
        (w.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (w.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{dict.sidebar.warehouses}</h2>
                    <p className="text-slate-500 font-medium">Manage logistics nodes, storage capacities, and supply chain hubs.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 shadow-sm" onClick={() => handleActionPlaceholder('Global Map')}><Navigation className="h-4 w-4 mr-2" /> Global Map</Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-xl shadow-blue-100 border-none h-11 px-6"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Logistics Node
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader><DialogTitle>Register Logistics Node</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Warehouse Name</Label>
                                    <Input value={newWarehouse.name} onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })} placeholder="e.g. Central Distribution Center" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Code</Label>
                                        <Input value={newWarehouse.code} onChange={e => setNewWarehouse({ ...newWarehouse, code: e.target.value })} placeholder="WH-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Capacity (Units)</Label>
                                        <Input type="number" value={newWarehouse.total_capacity} onChange={e => setNewWarehouse({ ...newWarehouse, total_capacity: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input value={newWarehouse.location} onChange={e => setNewWarehouse({ ...newWarehouse, location: e.target.value })} placeholder="City, Area" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Phone</Label>
                                    <Input value={newWarehouse.contact_phone} onChange={e => setNewWarehouse({ ...newWarehouse, contact_phone: e.target.value })} placeholder="+966..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddWarehouse} className="bg-blue-600">Register Node</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Building2 className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Active Hubs</CardDescription>
                        <CardTitle className="text-3xl font-black">{warehouses.filter(w => w.status !== 'Inactive').length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-emerald-600"><Package className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Items Stored</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-700">12,402</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Truck className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">In-Transit</CardDescription>
                        <CardTitle className="text-3xl font-black">408 Units</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50 relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-blue-600"><TrendingUp className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Daily Throughput</CardDescription>
                        <CardTitle className="text-3xl font-black text-blue-700">+12%</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search logistics nodes..."
                                className="h-12 pl-12 bg-white border-none shadow-sm text-base rounded-xl"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-12 px-6 rounded-xl bg-white shadow-sm font-bold gap-2">
                                <ArrowRightLeft className="h-4 w-4" /> Manage Transfers
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="pl-8 py-4">Node Profile</TableHead>
                                    <TableHead>Location & Stakeholder</TableHead>
                                    <TableHead className="w-64">Capacity Utilization</TableHead>
                                    <TableHead>System Status</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="py-20 text-center"><Warehouse className="h-10 w-10 animate-bounce text-slate-200 mx-auto" /></TableCell></TableRow>
                                ) : filtered.map(node => (
                                    <TableRow key={node.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all shadow-inner">
                                                    <Warehouse className="h-6 w-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 leading-none mb-1 text-lg">{node.name}</span>
                                                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                                                        <Box className="h-3 w-3" /> {node.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                    <MapPin className="h-3.5 w-3.5 text-rose-500" /> {node.location}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> {node.manager}
                                                    {node.contact_phone && <span className="flex items-center gap-1 ml-2"><Phone className="h-3 w-3" /> {node.contact_phone}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2 pr-10">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                                                    <span className="text-slate-400">Storage Load</span>
                                                    <span className={node.capacity_used > 90 ? 'text-rose-600' : 'text-slate-900'}>{node.capacity_used}%</span>
                                                </div>
                                                <Progress
                                                    value={node.capacity_used}
                                                    className={`h-2 shadow-inner ${node.capacity_used > 90 ? '[&>div]:bg-rose-500' : '[&>div]:bg-blue-600'}`}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(node.status)}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-5 w-5" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none p-2">
                                                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Operations</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Audit Inventory')} className="gap-2 p-3 rounded-lg"><Eye className="h-4 w-4" /> Audit Inventory</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Node Settings')} className="gap-2 p-3 rounded-lg"><Edit className="h-4 w-4" /> Node Settings</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleActionPlaceholder('Inventory Transfer')} className="gap-2 p-3 rounded-lg text-blue-600 font-bold"><ArrowRightLeft className="h-4 w-4" /> Inventory Transfer</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                                    <DropdownMenuItem onClick={() => handleDeleteWarehouse(node.id)} className="gap-2 p-3 rounded-lg text-rose-600"><Trash2 className="h-4 w-4" /> Decommission Node</DropdownMenuItem>
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
