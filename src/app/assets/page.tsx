"use client"

import * as React from "react"
import {
    Building,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Car,
    Monitor,
    Wrench,
    Calendar,
    DollarSign,
    TrendingDown,
    AlertCircle,
    Eye,
    Edit,
    Trash2,
    BarChart3,
    Package,
    Settings,
    FileText,
    CheckCircle2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface AssetCategory {
    id: string
    name: string
    code: string
    depreciation_method: string
    default_useful_life_years: number
}

interface FixedAsset {
    id: string
    asset_number: string
    name: string
    description: string | null
    category_id: string | null
    serial_number: string | null
    barcode: string | null
    purchase_date: string
    purchase_price: number
    warranty_expiry: string | null
    useful_life_years: number
    salvage_value: number
    depreciation_method: string
    depreciation_start_date: string | null
    current_value: number | null
    accumulated_depreciation: number
    status: string
    location: string | null
    notes: string | null
    created_at: string
    asset_categories?: { name: string; code: string }
    departments?: { name: string }
    profiles?: { full_name: string }
}

interface AssetMaintenance {
    id: string
    asset_id: string
    maintenance_type: string
    maintenance_date: string
    description: string | null
    cost: number
    performed_by: string | null
    next_maintenance_date: string | null
    created_at: string
    fixed_assets?: { name: string; asset_number: string }
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    Active: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Active' },
    Inactive: { color: 'bg-slate-100 text-slate-600', icon: Package, label: 'Inactive' },
    UnderMaintenance: { color: 'bg-amber-100 text-amber-700', icon: Wrench, label: 'Under Maintenance' },
    Disposed: { color: 'bg-rose-100 text-rose-700', icon: Trash2, label: 'Disposed' },
    Sold: { color: 'bg-blue-100 text-blue-700', icon: DollarSign, label: 'Sold' },
    WrittenOff: { color: 'bg-gray-100 text-gray-500', icon: AlertCircle, label: 'Written Off' },
}

const categoryIcons: Record<string, React.ElementType> = {
    BUILDING: Building,
    VEHICLE: Car,
    COMPUTER: Monitor,
    MACHINE: Settings,
    FURNITURE: Package,
    OFFICE: FileText,
    LAND: Building,
}

export default function AssetsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [assets, setAssets] = React.useState<FixedAsset[]>([])
    const [categories, setCategories] = React.useState<AssetCategory[]>([])
    const [maintenance, setMaintenance] = React.useState<AssetMaintenance[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterStatus, setFilterStatus] = React.useState("all")
    const [filterCategory, setFilterCategory] = React.useState("all")
    const [activeTab, setActiveTab] = React.useState("assets")

    // Asset Dialog State
    const [isAssetDialogOpen, setIsAssetDialogOpen] = React.useState(false)
    const [newAsset, setNewAsset] = React.useState({
        name: '',
        description: '',
        category_id: '',
        serial_number: '',
        barcode: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        purchase_price: 0,
        warranty_expiry: '',
        useful_life_years: 5,
        salvage_value: 0,
        depreciation_method: 'StraightLine',
        location: '',
        notes: ''
    })

    // Maintenance Dialog State
    const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = React.useState(false)
    const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = React.useState<FixedAsset | null>(null)
    const [newMaintenance, setNewMaintenance] = React.useState({
        maintenance_type: 'Preventive',
        maintenance_date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        cost: 0,
        performed_by: '',
        next_maintenance_date: ''
    })

    const supabase = createClient()

    const generateAssetNumber = () => {
        const prefix = 'AST'
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${prefix}-${timestamp}-${random}`
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [assetsRes, categoriesRes, maintenanceRes] = await Promise.all([
            supabase.from('fixed_assets').select('*, asset_categories(name, code), departments(name), profiles(full_name)').order('created_at', { ascending: false }),
            supabase.from('asset_categories').select('*').order('name'),
            supabase.from('asset_maintenance').select('*, fixed_assets(name, asset_number)').order('maintenance_date', { ascending: false }).limit(50)
        ])

        if (!assetsRes.error) setAssets(assetsRes.data || [])
        if (!categoriesRes.error) setCategories(categoriesRes.data || [])
        if (!maintenanceRes.error) setMaintenance(maintenanceRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateAsset = async () => {
        if (!newAsset.name || !newAsset.purchase_price) {
            return alert(isArabic ? 'الاسم وسعر الشراء مطلوبان' : 'Name and purchase price are required')
        }

        const assetNumber = generateAssetNumber()
        const currentValue = newAsset.purchase_price // Initial value equals purchase price

        const { error } = await supabase.from('fixed_assets').insert([{
            asset_number: assetNumber,
            ...newAsset,
            category_id: newAsset.category_id || null,
            current_value: currentValue,
            accumulated_depreciation: 0,
            status: 'Active',
            depreciation_start_date: newAsset.purchase_date
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsAssetDialogOpen(false)
            setNewAsset({
                name: '',
                description: '',
                category_id: '',
                serial_number: '',
                barcode: '',
                purchase_date: format(new Date(), 'yyyy-MM-dd'),
                purchase_price: 0,
                warranty_expiry: '',
                useful_life_years: 5,
                salvage_value: 0,
                depreciation_method: 'StraightLine',
                location: '',
                notes: ''
            })
            fetchData()
        }
    }

    const handleAddMaintenance = async () => {
        if (!selectedAssetForMaintenance) return

        const { error } = await supabase.from('asset_maintenance').insert([{
            asset_id: selectedAssetForMaintenance.id,
            ...newMaintenance,
            next_maintenance_date: newMaintenance.next_maintenance_date || null
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            // Update asset status if under maintenance
            if (newMaintenance.maintenance_type === 'Repair') {
                await supabase.from('fixed_assets').update({ status: 'Active' }).eq('id', selectedAssetForMaintenance.id)
            }
            setIsMaintenanceDialogOpen(false)
            setSelectedAssetForMaintenance(null)
            setNewMaintenance({
                maintenance_type: 'Preventive',
                maintenance_date: format(new Date(), 'yyyy-MM-dd'),
                description: '',
                cost: 0,
                performed_by: '',
                next_maintenance_date: ''
            })
            fetchData()
        }
    }

    const handleUpdateStatus = async (asset: FixedAsset, newStatus: string) => {
        const { error } = await supabase.from('fixed_assets').update({ status: newStatus }).eq('id', asset.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDelete = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الأصل؟' : 'Are you sure you want to delete this asset?')) return
        const { error } = await supabase.from('fixed_assets').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const calculateDepreciation = (asset: FixedAsset) => {
        if (!asset.depreciation_start_date || asset.useful_life_years === 0) return 0

        const startDate = new Date(asset.depreciation_start_date)
        const now = new Date()
        const yearsElapsed = (now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

        if (asset.depreciation_method === 'StraightLine') {
            const annualDepreciation = (asset.purchase_price - asset.salvage_value) / asset.useful_life_years
            return Math.min(annualDepreciation * yearsElapsed, asset.purchase_price - asset.salvage_value)
        }

        return 0
    }

    const handleExport = () => {
        const headers = ["Asset #", "Name", "Category", "Status", "Purchase Date", "Purchase Price", "Current Value", "Location"]
        const data = assets.map(a => [
            a.asset_number,
            a.name,
            a.asset_categories?.name || '-',
            a.status,
            a.purchase_date,
            a.purchase_price,
            a.current_value || 0,
            a.location || '-'
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assets_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus
        const matchesCategory = filterCategory === 'all' || a.category_id === filterCategory
        return matchesSearch && matchesStatus && matchesCategory
    })

    // Stats
    const stats = {
        totalAssets: assets.length,
        activeAssets: assets.filter(a => a.status === 'Active').length,
        totalValue: assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0),
        currentValue: assets.reduce((sum, a) => sum + (a.current_value || a.purchase_price || 0), 0),
        totalDepreciation: assets.reduce((sum, a) => sum + (a.accumulated_depreciation || 0), 0),
        underMaintenance: assets.filter(a => a.status === 'UnderMaintenance').length
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isArabic ? 'إدارة الأصول الثابتة' : 'Fixed Assets'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'تتبع وإدارة جميع الأصول الثابتة والإهلاك' : 'Track and manage all fixed assets and depreciation'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                    <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'أصل جديد' : 'New Asset'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'تسجيل أصل جديد' : 'Register New Asset'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>{isArabic ? 'اسم الأصل' : 'Asset Name'} *</Label>
                                    <Input
                                        value={newAsset.name}
                                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الفئة' : 'Category'}</Label>
                                    <Select
                                        value={newAsset.category_id}
                                        onValueChange={(v) => {
                                            const cat = categories.find(c => c.id === v)
                                            setNewAsset({
                                                ...newAsset,
                                                category_id: v,
                                                useful_life_years: cat?.default_useful_life_years || 5,
                                                depreciation_method: cat?.depreciation_method || 'StraightLine'
                                            })
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isArabic ? 'اختر الفئة' : 'Select category'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الرقم التسلسلي' : 'Serial Number'}</Label>
                                    <Input
                                        value={newAsset.serial_number}
                                        onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'تاريخ الشراء' : 'Purchase Date'} *</Label>
                                    <Input
                                        type="date"
                                        value={newAsset.purchase_date}
                                        onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'سعر الشراء' : 'Purchase Price'} *</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={newAsset.purchase_price}
                                        onChange={(e) => setNewAsset({ ...newAsset, purchase_price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'العمر الإنتاجي (سنوات)' : 'Useful Life (years)'}</Label>
                                    <Input
                                        type="number"
                                        value={newAsset.useful_life_years}
                                        onChange={(e) => setNewAsset({ ...newAsset, useful_life_years: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'القيمة المتبقية' : 'Salvage Value'}</Label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={newAsset.salvage_value}
                                        onChange={(e) => setNewAsset({ ...newAsset, salvage_value: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'طريقة الإهلاك' : 'Depreciation Method'}</Label>
                                    <Select
                                        value={newAsset.depreciation_method}
                                        onValueChange={(v) => setNewAsset({ ...newAsset, depreciation_method: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="StraightLine">{isArabic ? 'القسط الثابت' : 'Straight Line'}</SelectItem>
                                            <SelectItem value="DecliningBalance">{isArabic ? 'القسط المتناقص' : 'Declining Balance'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'انتهاء الضمان' : 'Warranty Expiry'}</Label>
                                    <Input
                                        type="date"
                                        value={newAsset.warranty_expiry}
                                        onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الموقع' : 'Location'}</Label>
                                    <Input
                                        value={newAsset.location}
                                        onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                                    <Textarea
                                        value={newAsset.description}
                                        onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAssetDialogOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreateAsset}>{isArabic ? 'تسجيل الأصل' : 'Register Asset'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500">
                            {isArabic ? 'إجمالي الأصول' : 'Total Assets'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.totalAssets}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">
                            {isArabic ? 'الأصول النشطة' : 'Active Assets'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{stats.activeAssets}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">
                            {isArabic ? 'قيمة الشراء' : 'Purchase Value'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-blue-700">{formatMoney(stats.totalValue)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-indigo-600">
                            {isArabic ? 'القيمة الحالية' : 'Current Value'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-indigo-700">{formatMoney(stats.currentValue)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> {isArabic ? 'الإهلاك المتراكم' : 'Acc. Depreciation'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-rose-700">{formatMoney(stats.totalDepreciation)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <Wrench className="h-3 w-3" /> {isArabic ? 'تحت الصيانة' : 'Under Maintenance'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.underMaintenance}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                    <TabsTrigger value="assets" className="flex gap-2">
                        <Package className="h-4 w-4" />
                        {isArabic ? 'الأصول' : 'Assets'}
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="flex gap-2">
                        <Wrench className="h-4 w-4" />
                        {isArabic ? 'الصيانة' : 'Maintenance'}
                    </TabsTrigger>
            </Tabs>

            {/* Assets Tab */}
            <TabsContent value="assets">
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'بحث في الأصول...' : 'Search assets...'}
                                    className="pl-9 bg-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[150px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'كل الفئات' : 'All Categories'}</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[140px] bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All Status'}</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="UnderMaintenance">Under Maintenance</SelectItem>
                                        <SelectItem value="Disposed">Disposed</SelectItem>
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
                                        <TableHead className="pl-6">{isArabic ? 'الأصل' : 'Asset'}</TableHead>
                                        <TableHead>{isArabic ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'سعر الشراء' : 'Purchase Price'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'القيمة الحالية' : 'Current Value'}</TableHead>
                                        <TableHead>{isArabic ? 'الموقع' : 'Location'}</TableHead>
                                        <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell>
                                        </TableRow>
                                    ) : filteredAssets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                                {isArabic ? 'لا توجد أصول' : 'No assets found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredAssets.map(asset => {
                                        const statusInfo = statusConfig[asset.status] || statusConfig.Active
                                        const StatusIcon = statusInfo.icon
                                        const CategoryIcon = categoryIcons[asset.asset_categories?.code || ''] || Package
                                        const depreciation = calculateDepreciation(asset)
                                        const currentValue = asset.purchase_price - depreciation

                                        return (
                                            <TableRow key={asset.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                            <CategoryIcon className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{asset.name}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">{asset.asset_number}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{asset.asset_categories?.name || '-'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatMoney(asset.purchase_price)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-mono font-bold">{formatMoney(currentValue)}</span>
                                                        {depreciation > 0 && (
                                                            <span className="text-xs text-rose-500">-{formatMoney(depreciation)}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{asset.location || '-'}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>{isArabic ? 'العمليات' : 'Actions'}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedAssetForMaintenance(asset)
                                                                setIsMaintenanceDialogOpen(true)
                                                            }}>
                                                                <Wrench className="h-4 w-4 mr-2" /> {isArabic ? 'إضافة صيانة' : 'Add Maintenance'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground">{isArabic ? 'تحديث الحالة' : 'Update Status'}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(asset, 'Active')}>
                                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Active
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(asset, 'UnderMaintenance')}>
                                                                <Wrench className="h-4 w-4 mr-2" /> Under Maintenance
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(asset, 'Disposed')}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> Disposed
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(asset.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance">
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader>
                        <CardTitle>{isArabic ? 'سجل الصيانة' : 'Maintenance History'}</CardTitle>
                        <CardDescription>{isArabic ? 'جميع عمليات الصيانة المسجلة' : 'All recorded maintenance activities'}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/20">
                                        <TableHead className="pl-6">{isArabic ? 'الأصل' : 'Asset'}</TableHead>
                                        <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                        <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead>{isArabic ? 'الوصف' : 'Description'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'التكلفة' : 'Cost'}</TableHead>
                                        <TableHead>{isArabic ? 'الصيانة القادمة' : 'Next Maintenance'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell>
                                        </TableRow>
                                    ) : maintenance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                                {isArabic ? 'لا توجد سجلات صيانة' : 'No maintenance records'}
                                            </TableCell>
                                        </TableRow>
                                    ) : maintenance.map(m => (
                                        <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{m.fixed_assets?.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{m.fixed_assets?.asset_number}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    m.maintenance_type === 'Repair' ? 'bg-rose-50 text-rose-700' :
                                                        m.maintenance_type === 'Preventive' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-slate-50 text-slate-700'
                                                }>
                                                    {m.maintenance_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(m.maintenance_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell className="max-w-xs truncate">{m.description || '-'}</TableCell>
                                            <TableCell className="text-right font-mono font-bold">{formatMoney(m.cost)}</TableCell>
                                            <TableCell>
                                                {m.next_maintenance_date ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar className="h-3 w-3 text-amber-500" />
                                                        {format(new Date(m.next_maintenance_date), 'MMM dd, yyyy')}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

            {/* Add Maintenance Dialog */ }
    <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>{isArabic ? 'إضافة صيانة' : 'Add Maintenance Record'}</DialogTitle>
            </DialogHeader>
            {selectedAssetForMaintenance && (
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-muted-foreground">{isArabic ? 'الأصل:' : 'Asset:'}</span>
                        <p className="font-bold">{selectedAssetForMaintenance.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{selectedAssetForMaintenance.asset_number}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{isArabic ? 'نوع الصيانة' : 'Maintenance Type'}</Label>
                            <Select
                                value={newMaintenance.maintenance_type}
                                onValueChange={(v) => setNewMaintenance({ ...newMaintenance, maintenance_type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Preventive">Preventive</SelectItem>
                                    <SelectItem value="Repair">Repair</SelectItem>
                                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                                    <SelectItem value="Inspection">Inspection</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'التاريخ' : 'Date'}</Label>
                            <Input
                                type="date"
                                value={newMaintenance.maintenance_date}
                                onChange={(e) => setNewMaintenance({ ...newMaintenance, maintenance_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'التكلفة' : 'Cost'}</Label>
                            <Input
                                type="number"
                                step="0.001"
                                value={newMaintenance.cost}
                                onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{isArabic ? 'الصيانة القادمة' : 'Next Maintenance'}</Label>
                            <Input
                                type="date"
                                value={newMaintenance.next_maintenance_date}
                                onChange={(e) => setNewMaintenance({ ...newMaintenance, next_maintenance_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                            <Textarea
                                value={newMaintenance.description}
                                onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>{dict.common.cancel}</Button>
                <Button onClick={handleAddMaintenance}>{isArabic ? 'حفظ' : 'Save'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
        </div >
    )
}
