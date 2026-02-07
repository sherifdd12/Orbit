"use client"

import * as React from "react"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Package,
    FileText,
    Calendar,
    Download,
    Printer,
    Filter,
    ChevronRight,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ShoppingCart,
    Receipt,
    Building2
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface ReportData {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    revenueGrowth: number
    expenseGrowth: number
    totalInvoices: number
    paidInvoices: number
    pendingInvoices: number
    overdueInvoices: number
    totalPurchaseOrders: number
    totalCustomers: number
    totalVendors: number
    inventoryValue: number
    lowStockItems: number
    recentTransactions: {
        id: string
        type: 'invoice' | 'bill' | 'expense' | 'payment'
        reference: string
        amount: number
        date: string
        party: string
    }[]
    topCustomers: { name: string; total: number }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
    monthlyData: { month: string; revenue: number; expenses: number }[]
}

const reportTypes = [
    { id: 'overview', icon: BarChart3, en: 'Business Overview', ar: 'نظرة عامة على الأعمال' },
    { id: 'sales', icon: TrendingUp, en: 'Sales Report', ar: 'تقرير المبيعات' },
    { id: 'purchasing', icon: ShoppingCart, en: 'Purchasing Report', ar: 'تقرير المشتريات' },
    { id: 'inventory', icon: Package, en: 'Inventory Report', ar: 'تقرير المخزون' },
    { id: 'customers', icon: Users, en: 'Customer Report', ar: 'تقرير العملاء' },
    { id: 'financial', icon: Wallet, en: 'Financial Summary', ar: 'الملخص المالي' },
]

export default function ReportsPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [loading, setLoading] = React.useState(true)
    const [reportType, setReportType] = React.useState('overview')
    const [dateRange, setDateRange] = React.useState('month')
    const [startDate, setStartDate] = React.useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'))
    const [data, setData] = React.useState<ReportData>({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        revenueGrowth: 0,
        expenseGrowth: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalPurchaseOrders: 0,
        totalCustomers: 0,
        totalVendors: 0,
        inventoryValue: 0,
        lowStockItems: 0,
        recentTransactions: [],
        topCustomers: [],
        topProducts: [],
        monthlyData: []
    })

    const supabase = createClient()

    const fetchReportData = React.useCallback(async () => {
        setLoading(true)

        try {
            // Fetch all necessary data in parallel
            const [
                invoicesRes,
                purchaseOrdersRes,
                customersRes,
                vendorsRes,
                inventoryRes
            ] = await Promise.all([
                supabase.from('invoices').select('*, customer:customers(name)'),
                supabase.from('purchase_orders').select('*, vendor:vendors(name)'),
                supabase.from('customers').select('id, name'),
                supabase.from('vendors').select('id, name'),
                supabase.from('inventory_items').select('*')
            ])

            const invoices = invoicesRes.data || []
            const purchaseOrders = purchaseOrdersRes.data || []
            const customers = customersRes.data || []
            const vendors = vendorsRes.data || []
            const inventory = inventoryRes.data || []

            // Calculate metrics
            const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0)
            const totalExpenses = purchaseOrders.filter(p => p.status === 'Received').reduce((sum, p) => sum + (p.total || 0), 0)
            const netProfit = totalRevenue - totalExpenses

            // Invoice stats
            const paidInvoices = invoices.filter(i => i.status === 'Paid').length
            const pendingInvoices = invoices.filter(i => i.status === 'Sent').length
            const overdueInvoices = invoices.filter(i => i.status === 'Overdue').length

            // Inventory value
            const inventoryValue = inventory.reduce((sum, item) => sum + ((item.unit_price || 0) * (item.quantity || 0)), 0)
            const lowStockItems = inventory.filter(item => (item.quantity || 0) <= (item.reorder_point || 10)).length

            // Top customers (by invoice total)
            const customerTotals = new Map<string, number>()
            invoices.forEach(inv => {
                if (inv.customer?.name) {
                    const current = customerTotals.get(inv.customer.name) || 0
                    customerTotals.set(inv.customer.name, current + (inv.total || 0))
                }
            })
            const topCustomers = Array.from(customerTotals.entries())
                .map(([name, total]) => ({ name, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)

            // Recent transactions
            const invoiceTransactions = invoices.map(inv => ({
                id: inv.id,
                type: 'invoice' as 'invoice' | 'bill' | 'expense' | 'payment',
                reference: inv.invoice_number,
                amount: inv.total || 0,
                date: inv.invoice_date,
                party: inv.customer?.name || 'Unknown'
            }))

            const poTransactions = purchaseOrders.map(po => ({
                id: po.id,
                type: 'bill' as 'invoice' | 'bill' | 'expense' | 'payment',
                reference: po.po_number,
                amount: po.total || 0,
                date: po.order_date,
                party: po.vendor?.name || 'Unknown'
            }))

            const recentTransactions = [...invoiceTransactions, ...poTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)

            // Monthly data for charts (last 6 months)
            const monthlyData = []
            for (let i = 5; i >= 0; i--) {
                const monthDate = subMonths(new Date(), i)
                const monthStart = startOfMonth(monthDate)
                const monthEnd = endOfMonth(monthDate)

                const monthRevenue = invoices
                    .filter(inv => {
                        const invDate = new Date(inv.invoice_date)
                        return invDate >= monthStart && invDate <= monthEnd && inv.status === 'Paid'
                    })
                    .reduce((sum, inv) => sum + (inv.total || 0), 0)

                const monthExpenses = purchaseOrders
                    .filter(po => {
                        const poDate = new Date(po.order_date)
                        return poDate >= monthStart && poDate <= monthEnd && po.status === 'Received'
                    })
                    .reduce((sum, po) => sum + (po.total || 0), 0)

                monthlyData.push({
                    month: format(monthDate, 'MMM'),
                    revenue: monthRevenue,
                    expenses: monthExpenses
                })
            }

            setData({
                totalRevenue,
                totalExpenses,
                netProfit,
                revenueGrowth: 12.5, // Placeholder - would need historical data
                expenseGrowth: 8.3,
                totalInvoices: invoices.length,
                paidInvoices,
                pendingInvoices,
                overdueInvoices,
                totalPurchaseOrders: purchaseOrders.length,
                totalCustomers: customers.length,
                totalVendors: vendors.length,
                inventoryValue,
                lowStockItems,
                recentTransactions,
                topCustomers,
                topProducts: [],
                monthlyData
            })
        } catch (error) {
            console.error('Error fetching report data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, startDate, endDate])

    React.useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    // Handle date range change
    const handleDateRangeChange = (range: string) => {
        setDateRange(range)
        const today = new Date()

        switch (range) {
            case 'week':
                setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'))
                setEndDate(format(today, 'yyyy-MM-dd'))
                break
            case 'month':
                setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
                setEndDate(format(today, 'yyyy-MM-dd'))
                break
            case 'quarter':
                setStartDate(format(subMonths(today, 3), 'yyyy-MM-dd'))
                setEndDate(format(today, 'yyyy-MM-dd'))
                break
            case 'year':
                setStartDate(format(subMonths(today, 12), 'yyyy-MM-dd'))
                setEndDate(format(today, 'yyyy-MM-dd'))
                break
        }
    }

    // Export to PDF (placeholder)
    const handleExport = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.reports.title}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'تحليلات وتقارير شاملة للأعمال' : 'Comprehensive business analytics and reports'}
                    </p>
                </div>
                <div className="flex gap-2 no-print">
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="h-4 w-4" />
                        {isArabic ? 'تصدير' : 'Export'}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} className="gap-2">
                        <Printer className="h-4 w-4" />
                        {isArabic ? 'طباعة' : 'Print'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm no-print">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>{isArabic ? 'نوع التقرير' : 'Report Type'}</Label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {isArabic ? type.ar : type.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>{isArabic ? 'الفترة' : 'Period'}</Label>
                            <Select value={dateRange} onValueChange={handleDateRangeChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">{isArabic ? 'آخر 7 أيام' : 'Last 7 Days'}</SelectItem>
                                    <SelectItem value="month">{isArabic ? 'هذا الشهر' : 'This Month'}</SelectItem>
                                    <SelectItem value="quarter">{isArabic ? 'آخر 3 أشهر' : 'Last 3 Months'}</SelectItem>
                                    <SelectItem value="year">{isArabic ? 'آخر سنة' : 'Last Year'}</SelectItem>
                                    <SelectItem value="custom">{isArabic ? 'تاريخ مخصص' : 'Custom Range'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {dateRange === 'custom' && (
                            <>
                                <div className="flex-1 space-y-2">
                                    <Label>{isArabic ? 'من تاريخ' : 'From Date'}</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>{isArabic ? 'إلى تاريخ' : 'To Date'}</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground">{dict.common.loading}</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-green-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-emerald-600 mb-1">
                                            {isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}
                                        </p>
                                        <p className="text-2xl font-bold text-emerald-700">{formatMoney(data.totalRevenue)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                                            <ArrowUpRight className="h-3 w-3" />
                                            +{data.revenueGrowth}%
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-200/50">
                                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-gradient-to-br from-rose-50 to-red-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-rose-600 mb-1">
                                            {isArabic ? 'إجمالي المصروفات' : 'Total Expenses'}
                                        </p>
                                        <p className="text-2xl font-bold text-rose-700">{formatMoney(data.totalExpenses)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-rose-600">
                                            <ArrowDownRight className="h-3 w-3" />
                                            +{data.expenseGrowth}%
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-rose-200/50">
                                        <TrendingDown className="h-6 w-6 text-rose-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-blue-600 mb-1">
                                            {isArabic ? 'صافي الربح' : 'Net Profit'}
                                        </p>
                                        <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                                            {formatMoney(data.netProfit)}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                                            <Activity className="h-3 w-3" />
                                            {data.netProfit >= 0 ? (isArabic ? 'ربح' : 'Profit') : (isArabic ? 'خسارة' : 'Loss')}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-200/50">
                                        <DollarSign className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-amber-600 mb-1">
                                            {isArabic ? 'قيمة المخزون' : 'Inventory Value'}
                                        </p>
                                        <p className="text-2xl font-bold text-amber-700">{formatMoney(data.inventoryValue)}</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                            <Package className="h-3 w-3" />
                                            {data.lowStockItems} {isArabic ? 'منخفض' : 'low stock'}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-200/50">
                                        <Package className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Receipt className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-2xl font-bold">{data.totalInvoices}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الفواتير' : 'Total Invoices'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Badge className="mb-2 bg-emerald-100 text-emerald-700">{data.paidInvoices}</Badge>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'مدفوعة' : 'Paid'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Badge className="mb-2 bg-amber-100 text-amber-700">{data.pendingInvoices}</Badge>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'معلقة' : 'Pending'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Badge className="mb-2 bg-rose-100 text-rose-700">{data.overdueInvoices}</Badge>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'متأخرة' : 'Overdue'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Users className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                                <p className="text-2xl font-bold">{data.totalCustomers}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'العملاء' : 'Customers'}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="pt-4 text-center">
                                <Building2 className="h-8 w-8 mx-auto text-orange-400 mb-2" />
                                <p className="text-2xl font-bold">{data.totalVendors}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'الموردون' : 'Vendors'}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Revenue/Expense Chart (Simple Bar Representation) */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    {isArabic ? 'الإيرادات والمصروفات الشهرية' : 'Monthly Revenue vs Expenses'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.monthlyData.map((month, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium w-12">{month.month}</span>
                                                <div className="flex-1 mx-4">
                                                    <div className="flex gap-1">
                                                        <div
                                                            className="h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-sm transition-all"
                                                            style={{
                                                                width: `${Math.min((month.revenue / (Math.max(...data.monthlyData.map(m => m.revenue)) || 1)) * 100, 100)}%`,
                                                                minWidth: month.revenue > 0 ? '4px' : '0'
                                                            }}
                                                        />
                                                        <div
                                                            className="h-6 bg-gradient-to-r from-rose-400 to-rose-500 rounded-sm transition-all"
                                                            style={{
                                                                width: `${Math.min((month.expenses / (Math.max(...data.monthlyData.map(m => m.revenue)) || 1)) * 100, 100)}%`,
                                                                minWidth: month.expenses > 0 ? '4px' : '0'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right w-32">
                                                    <span className="text-emerald-600">{formatMoney(month.revenue)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-4 mt-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded-sm bg-gradient-to-r from-emerald-400 to-emerald-500" />
                                            {isArabic ? 'الإيرادات' : 'Revenue'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded-sm bg-gradient-to-r from-rose-400 to-rose-500" />
                                            {isArabic ? 'المصروفات' : 'Expenses'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Customers */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-500" />
                                    {isArabic ? 'أفضل العملاء' : 'Top Customers'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.topCustomers.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {isArabic ? 'لا توجد بيانات' : 'No data available'}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.topCustomers.map((customer, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                                                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                            idx === 2 ? 'bg-orange-100 text-orange-600' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-medium">{customer.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-emerald-600">{formatMoney(customer.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Transactions */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                {isArabic ? 'آخر المعاملات' : 'Recent Transactions'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="pl-6">{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                                        <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                        <TableHead>{isArabic ? 'المرجع' : 'Reference'}</TableHead>
                                        <TableHead>{isArabic ? 'الطرف' : 'Party'}</TableHead>
                                        <TableHead className="text-right pr-6">{isArabic ? 'المبلغ' : 'Amount'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                {isArabic ? 'لا توجد معاملات' : 'No transactions found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : data.recentTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-slate-50/50">
                                            <TableCell className="pl-6 text-sm">
                                                {format(new Date(tx.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    tx.type === 'invoice' ? 'bg-emerald-50 text-emerald-700' :
                                                        tx.type === 'bill' ? 'bg-orange-50 text-orange-700' :
                                                            'bg-slate-50 text-slate-700'
                                                }>
                                                    {tx.type === 'invoice' ? (isArabic ? 'فاتورة' : 'Invoice') :
                                                        tx.type === 'bill' ? (isArabic ? 'شراء' : 'Purchase') :
                                                            tx.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-blue-600">{tx.reference}</TableCell>
                                            <TableCell>{tx.party}</TableCell>
                                            <TableCell className={`text-right pr-6 font-mono font-bold ${tx.type === 'invoice' ? 'text-emerald-600' : 'text-orange-600'
                                                }`}>
                                                {tx.type === 'invoice' ? '+' : '-'}{formatMoney(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    )
}
