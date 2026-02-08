"use client"

import * as React from "react"
import {
    CreditCard,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Settings,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    Trash2,
    ExternalLink,
    Clock,
    Zap,
    Shield,
    Link2,
    RefreshCw,
    Copy,
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    User
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface PaymentGateway {
    id: string
    name: string
    provider: string
    api_key_masked: string | null
    is_active: boolean
    is_default: boolean
    environment: 'sandbox' | 'production'
    supported_currencies: string[]
    supported_methods: string[]
    webhook_url: string | null
    created_at: string
}

interface GatewayTransaction {
    id: string
    gateway_id: string
    transaction_ref: string
    external_ref: string | null
    transaction_type: 'payment' | 'refund' | 'payout'
    amount: number
    currency: string
    status: string
    customer_email: string | null
    description: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    payment_gateways?: { name: string; provider: string }
}

const providerConfig: Record<string, { color: string; logo: string }> = {
    stripe: { color: 'bg-[#635BFF]', logo: 'Stripe' },
    paypal: { color: 'bg-[#003087]', logo: 'PayPal' },
    square: { color: 'bg-[#000000]', logo: 'Square' },
    adyen: { color: 'bg-[#0ABF53]', logo: 'Adyen' },
    braintree: { color: 'bg-[#003366]', logo: 'Braintree' },
    tap: { color: 'bg-[#2ACE80]', logo: 'Tap' },
    myfatoorah: { color: 'bg-[#00457C]', logo: 'MyFatoorah' },
    hyperpay: { color: 'bg-[#1C355E]', logo: 'HyperPay' },
    other: { color: 'bg-slate-600', logo: 'Custom' },
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: 'Processing' },
    completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Completed' },
    failed: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Failed' },
    refunded: { color: 'bg-purple-100 text-purple-700', icon: ArrowDownLeft, label: 'Refunded' },
    cancelled: { color: 'bg-slate-100 text-slate-600', icon: XCircle, label: 'Cancelled' },
}

export default function PaymentsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [gateways, setGateways] = React.useState<PaymentGateway[]>([])
    const [transactions, setTransactions] = React.useState<GatewayTransaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("gateways")
    const [filterStatus, setFilterStatus] = React.useState("all")
    const [filterGateway, setFilterGateway] = React.useState("all")

    // Create Gateway Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newGateway, setNewGateway] = React.useState({
        name: '',
        provider: 'stripe',
        api_key: '',
        api_secret: '',
        environment: 'sandbox' as 'sandbox' | 'production',
        supported_currencies: ['USD', 'EUR'],
        supported_methods: ['card', 'wallet'],
        webhook_secret: ''
    })

    // View Transaction Dialog
    const [selectedTransaction, setSelectedTransaction] = React.useState<GatewayTransaction | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [gatewaysRes, transactionsRes] = await Promise.all([
            supabase.from('payment_gateways').select('*').order('is_default', { ascending: false }),
            supabase.from('gateway_transactions').select('*, payment_gateways(name, provider)').order('created_at', { ascending: false }).limit(100)
        ])

        if (!gatewaysRes.error) setGateways(gatewaysRes.data || [])
        if (!transactionsRes.error) setTransactions(transactionsRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateGateway = async () => {
        if (!newGateway.name || !newGateway.api_key) {
            return alert(isArabic ? 'الاسم ومفتاح API مطلوبان' : 'Name and API key are required')
        }

        // Mask the API key for storage display
        const maskedKey = newGateway.api_key.slice(0, 8) + '...' + newGateway.api_key.slice(-4)

        const { error } = await supabase.from('payment_gateways').insert([{
            name: newGateway.name,
            provider: newGateway.provider,
            api_key_masked: maskedKey,
            environment: newGateway.environment,
            supported_currencies: newGateway.supported_currencies,
            supported_methods: newGateway.supported_methods,
            is_active: true,
            is_default: gateways.length === 0
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsCreateDialogOpen(false)
            setNewGateway({
                name: '',
                provider: 'stripe',
                api_key: '',
                api_secret: '',
                environment: 'sandbox',
                supported_currencies: ['USD', 'EUR'],
                supported_methods: ['card', 'wallet'],
                webhook_secret: ''
            })
            fetchData()
        }
    }

    const handleToggleGateway = async (gateway: PaymentGateway) => {
        const { error } = await supabase.from('payment_gateways').update({ is_active: !gateway.is_active }).eq('id', gateway.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleSetDefault = async (gateway: PaymentGateway) => {
        // First, unset all defaults
        await supabase.from('payment_gateways').update({ is_default: false }).neq('id', gateway.id)
        // Then set this one as default
        const { error } = await supabase.from('payment_gateways').update({ is_default: true }).eq('id', gateway.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeleteGateway = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this gateway?')) return
        const { error } = await supabase.from('payment_gateways').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleExportTransactions = () => {
        const headers = ["Transaction Ref", "Gateway", "Type", "Amount", "Currency", "Status", "Customer", "Date"]
        const data = transactions.map(t => [
            t.transaction_ref,
            t.payment_gateways?.name || '-',
            t.transaction_type,
            t.amount,
            t.currency,
            t.status,
            t.customer_email || '-',
            format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss')
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payment_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert(isArabic ? 'تم النسخ!' : 'Copied!')
    }

    // Stats
    const stats = {
        totalGateways: gateways.length,
        activeGateways: gateways.filter(g => g.is_active).length,
        totalTransactions: transactions.length,
        totalVolume: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
        successRate: transactions.length > 0
            ? (transactions.filter(t => t.status === 'completed').length / transactions.length * 100).toFixed(1)
            : 0,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length
    }

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus
        const matchesGateway = filterGateway === 'all' || t.gateway_id === filterGateway
        return matchesSearch && matchesStatus && matchesGateway
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CreditCard className="h-8 w-8 text-indigo-600" />
                        {isArabic ? 'بوابات الدفع' : 'Payment Gateways'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة بوابات الدفع والمعاملات' : 'Manage payment gateways and transactions'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportTransactions}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                                <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'بوابة جديدة' : 'New Gateway'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'إضافة بوابة دفع' : 'Add Payment Gateway'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'اسم البوابة' : 'Gateway Name'} *</Label>
                                    <Input
                                        value={newGateway.name}
                                        onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                                        placeholder="e.g., My Stripe Account"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'مزود الخدمة' : 'Provider'}</Label>
                                    <Select
                                        value={newGateway.provider}
                                        onValueChange={(v) => setNewGateway({ ...newGateway, provider: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="stripe">Stripe</SelectItem>
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                            <SelectItem value="square">Square</SelectItem>
                                            <SelectItem value="adyen">Adyen</SelectItem>
                                            <SelectItem value="braintree">Braintree</SelectItem>
                                            <SelectItem value="tap">Tap (MENA)</SelectItem>
                                            <SelectItem value="myfatoorah">MyFatoorah</SelectItem>
                                            <SelectItem value="hyperpay">HyperPay</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'البيئة' : 'Environment'}</Label>
                                    <Select
                                        value={newGateway.environment}
                                        onValueChange={(v) => setNewGateway({ ...newGateway, environment: v as 'sandbox' | 'production' })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-xs">Test</Badge> Sandbox
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="production">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs border-none">Live</Badge> Production
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'مفتاح API' : 'API Key'} *</Label>
                                    <Input
                                        type="password"
                                        value={newGateway.api_key}
                                        onChange={(e) => setNewGateway({ ...newGateway, api_key: e.target.value })}
                                        placeholder="sk_live_..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'المفتاح السري' : 'API Secret'}</Label>
                                    <Input
                                        type="password"
                                        value={newGateway.api_secret}
                                        onChange={(e) => setNewGateway({ ...newGateway, api_secret: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-700">{isArabic ? 'تحذير أمني' : 'Security Notice'}</p>
                                            <p className="text-xs text-amber-600">
                                                {isArabic
                                                    ? 'تأكد من أنك تستخدم مفاتيح API الصحيحة للبيئة المحددة'
                                                    : 'Ensure you are using the correct API keys for the selected environment'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreateGateway}>
                                    <Shield className="mr-2 h-4 w-4" /> {isArabic ? 'إضافة البوابة' : 'Add Gateway'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {isArabic ? 'البوابات النشطة' : 'Active Gateways'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.activeGateways} / {stats.totalGateways}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {isArabic ? 'حجم المعاملات' : 'Total Volume'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-emerald-700">{formatMoney(stats.totalVolume)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {isArabic ? 'معدل النجاح' : 'Success Rate'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-700">{stats.successRate}%</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {isArabic ? 'معلقة' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.pendingTransactions}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                    <TabsTrigger value="gateways" className="flex gap-2">
                        <Settings className="h-4 w-4" />
                        {isArabic ? 'البوابات' : 'Gateways'}
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        {isArabic ? 'المعاملات' : 'Transactions'}
                    </TabsTrigger>
                </TabsList>

                {/* Gateways Tab */}
                <TabsContent value="gateways">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gateways.map(gateway => {
                            const provider = providerConfig[gateway.provider] || providerConfig.other
                            return (
                                <Card key={gateway.id} className={`border-none shadow-lg overflow-hidden ${!gateway.is_active ? 'opacity-60' : ''}`}>
                                    <div className={`h-2 ${provider.color}`}></div>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-12 w-12 rounded-lg ${provider.color} flex items-center justify-center text-white font-bold text-xs`}>
                                                    {provider.logo.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{gateway.name}</CardTitle>
                                                    <CardDescription className="capitalize">{gateway.provider}</CardDescription>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleToggleGateway(gateway)}>
                                                        {gateway.is_active ? (
                                                            <><XCircle className="h-4 w-4 mr-2" /> {isArabic ? 'تعطيل' : 'Disable'}</>
                                                        ) : (
                                                            <><CheckCircle2 className="h-4 w-4 mr-2" /> {isArabic ? 'تفعيل' : 'Enable'}</>
                                                        )}
                                                    </DropdownMenuItem>
                                                    {!gateway.is_default && (
                                                        <DropdownMenuItem onClick={() => handleSetDefault(gateway)}>
                                                            <Zap className="h-4 w-4 mr-2" /> {isArabic ? 'جعله افتراضي' : 'Set as Default'}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteGateway(gateway.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</span>
                                                <div className="flex items-center gap-2">
                                                    {gateway.is_default && (
                                                        <Badge className="bg-amber-100 text-amber-700 border-none text-xs">
                                                            Default
                                                        </Badge>
                                                    )}
                                                    <Badge className={gateway.is_active ? 'bg-emerald-100 text-emerald-700 border-none' : 'bg-slate-100 text-slate-600 border-none'}>
                                                        {gateway.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'البيئة' : 'Environment'}</span>
                                                <Badge variant="outline" className={gateway.environment === 'production' ? 'border-emerald-500 text-emerald-600' : ''}>
                                                    {gateway.environment === 'production' ? '🔴 Live' : '🟡 Sandbox'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'مفتاح API' : 'API Key'}</span>
                                                <span className="font-mono text-xs">{gateway.api_key_masked || '••••••••'}</span>
                                            </div>
                                            <div className="pt-2 border-t">
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'العملات المدعومة' : 'Currencies'}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {gateway.supported_currencies?.map(c => (
                                                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                        {gateways.length === 0 && !loading && (
                            <div className="col-span-3 text-center py-20 text-muted-foreground">
                                <CreditCard className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-lg font-bold">{isArabic ? 'لا توجد بوابات دفع' : 'No payment gateways configured'}</p>
                                <p className="text-sm">{isArabic ? 'أضف بوابة دفع لبدء قبول المدفوعات' : 'Add a payment gateway to start accepting payments'}</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={isArabic ? 'بحث في المعاملات...' : 'Search transactions...'}
                                        className="pl-9 bg-white"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[130px] bg-white">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{isArabic ? 'كل الحالات' : 'All Status'}</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterGateway} onValueChange={setFilterGateway}>
                                        <SelectTrigger className="w-[140px] bg-white">
                                            <SelectValue placeholder="Gateway" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{isArabic ? 'كل البوابات' : 'All Gateways'}</SelectItem>
                                            {gateways.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
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
                                            <TableHead className="pl-6">{isArabic ? 'المعاملة' : 'Transaction'}</TableHead>
                                            <TableHead>{isArabic ? 'البوابة' : 'Gateway'}</TableHead>
                                            <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                                            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
                                            <TableHead>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                                            <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-20">{dict.common.loading}</TableCell>
                                            </TableRow>
                                        ) : filteredTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                                    {isArabic ? 'لا توجد معاملات' : 'No transactions found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredTransactions.map(transaction => {
                                            const statusInfo = statusConfig[transaction.status] || statusConfig.pending
                                            const StatusIcon = statusInfo.icon
                                            const provider = providerConfig[transaction.payment_gateways?.provider || 'other'] || providerConfig.other

                                            return (
                                                <TableRow key={transaction.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-sm font-bold">{transaction.transaction_ref}</span>
                                                            {transaction.external_ref && (
                                                                <span className="text-xs text-muted-foreground font-mono">{transaction.external_ref}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-6 w-6 rounded ${provider.color} flex items-center justify-center text-white text-xs font-bold`}>
                                                                {transaction.payment_gateways?.provider?.slice(0, 1).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm">{transaction.payment_gateways?.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {transaction.transaction_type === 'payment' && <ArrowDownLeft className="h-3 w-3 mr-1" />}
                                                            {transaction.transaction_type === 'refund' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                                            {transaction.transaction_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`font-mono font-bold ${transaction.transaction_type === 'refund' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {transaction.transaction_type === 'refund' ? '-' : '+'}{transaction.amount.toFixed(2)} {transaction.currency}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.customer_email ? (
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <User className="h-3 w-3 text-slate-400" />
                                                                {transaction.customer_email}
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setSelectedTransaction(transaction)
                                                                setIsViewDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
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
            </Tabs>

            {/* View Transaction Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل المعاملة' : 'Transaction Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{isArabic ? 'المرجع' : 'Reference'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold">{selectedTransaction.transaction_ref}</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(selectedTransaction.transaction_ref)}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                {selectedTransaction.external_ref && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">{isArabic ? 'المرجع الخارجي' : 'External Ref'}</span>
                                        <span className="font-mono text-sm">{selectedTransaction.external_ref}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{isArabic ? 'المبلغ' : 'Amount'}</span>
                                    <span className="font-mono font-bold text-lg">
                                        {selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</span>
                                    <Badge className={`${statusConfig[selectedTransaction.status]?.color || ''} border-none`}>
                                        {statusConfig[selectedTransaction.status]?.label || selectedTransaction.status}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{isArabic ? 'التاريخ' : 'Date'}</span>
                                    <span className="text-sm">{format(new Date(selectedTransaction.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
                                </div>
                            </div>
                            {selectedTransaction.description && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'الوصف' : 'Description'}</Label>
                                    <p className="mt-1">{selectedTransaction.description}</p>
                                </div>
                            )}
                            {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'البيانات الإضافية' : 'Metadata'}</Label>
                                    <pre className="mt-1 text-xs bg-slate-50 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>{dict.common.close}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
