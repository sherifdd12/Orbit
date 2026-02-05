"use client"

import * as React from "react"
import {
    PieChart,
    BarChart3,
    TrendingUp,
    TrendingDown,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Layers,
    Calendar,
    Filter,
    Printer,
    Loader2,
    Download
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface ReportData {
    totalSalesRevenue: number
    totalPurchaseExpense: number
    invoicedAmount: number
    outstandingReceivables: number
    outstandingPayables: number
    inventoryValue: number
    salesByMonth: { month: string, total: number }[]
    purchasesByMonth: { month: string, total: number }[]
    topCustomers: { name: string, total: number }[]
    topVendors: { name: string, total: number }[]
    projectBudgets: { title: string, budget: number, status: string }[]
}

export default function FinancialReportsPage() {
    const { dict, locale } = useLanguage()
    const { currency, formatMoney } = useSettings()
    const [loading, setLoading] = React.useState(true)
    const [data, setData] = React.useState<ReportData>({
        totalSalesRevenue: 0,
        totalPurchaseExpense: 0,
        invoicedAmount: 0,
        outstandingReceivables: 0,
        outstandingPayables: 0,
        inventoryValue: 0,
        salesByMonth: [],
        purchasesByMonth: [],
        topCustomers: [],
        topVendors: [],
        projectBudgets: []
    })

    const supabase = createClient()

    const fetchReportData = React.useCallback(async () => {
        setLoading(true)

        const [
            salesOrdersRes,
            purchaseOrdersRes,
            invoicesRes,
            itemsRes,
            customersRes,
            vendorsRes,
            projectsRes
        ] = await Promise.all([
            supabase.from('sale_orders').select('total, order_date, status, customer_id'),
            supabase.from('purchase_orders').select('total, order_date, status, vendor_id'),
            supabase.from('invoices').select('amount_total, status, issue_date'),
            supabase.from('items').select('stock_quantity, avg_cost'),
            supabase.from('customers').select('id, name'),
            supabase.from('vendors').select('id, name'),
            supabase.from('projects').select('title, budget, status')
        ])

        // Calculate totals
        const salesOrders = salesOrdersRes.data || []
        const purchaseOrders = purchaseOrdersRes.data || []
        const invoices = invoicesRes.data || []
        const items = itemsRes.data || []
        const customers = customersRes.data || []
        const vendors = vendorsRes.data || []
        const projects = projectsRes.data || []

        // Total Sales Revenue (Confirmed + Delivered + Invoiced orders)
        const confirmedStatuses = ['Confirmed', 'Delivered', 'Invoiced']
        const totalSalesRevenue = salesOrders
            .filter(o => confirmedStatuses.includes(o.status))
            .reduce((sum, o) => sum + (o.total || 0), 0)

        // Total Purchase Expense (Received + Billed)
        const purchaseStatuses = ['Received', 'Billed']
        const totalPurchaseExpense = purchaseOrders
            .filter(o => purchaseStatuses.includes(o.status))
            .reduce((sum, o) => sum + (o.total || 0), 0)

        // Invoiced Amount
        const invoicedAmount = invoices
            .filter(i => i.status === 'Paid')
            .reduce((sum, i) => sum + (i.amount_total || 0), 0)

        // Outstanding Receivables (Sent/Overdue invoices)
        const outstandingReceivables = invoices
            .filter(i => ['Sent', 'Overdue'].includes(i.status))
            .reduce((sum, i) => sum + (i.amount_total || 0), 0)

        // Outstanding Payables (Confirmed POs not yet billed)
        const outstandingPayables = purchaseOrders
            .filter(o => ['Confirmed', 'Received'].includes(o.status))
            .reduce((sum, o) => sum + (o.total || 0), 0)

        // Inventory Value
        const inventoryValue = items.reduce((sum, i) => sum + ((i.stock_quantity || 0) * (i.avg_cost || 0)), 0)

        // Sales by Customer
        const customerTotals: Record<string, number> = {}
        salesOrders.forEach(o => {
            if (o.customer_id) {
                customerTotals[o.customer_id] = (customerTotals[o.customer_id] || 0) + (o.total || 0)
            }
        })
        const topCustomers = Object.entries(customerTotals)
            .map(([id, total]) => ({
                name: customers.find(c => c.id === id)?.name || 'Unknown',
                total
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)

        // Purchases by Vendor
        const vendorTotals: Record<string, number> = {}
        purchaseOrders.forEach(o => {
            if (o.vendor_id) {
                vendorTotals[o.vendor_id] = (vendorTotals[o.vendor_id] || 0) + (o.total || 0)
            }
        })
        const topVendors = Object.entries(vendorTotals)
            .map(([id, total]) => ({
                name: vendors.find(v => v.id === id)?.name || 'Unknown',
                total
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)

        // Project Budgets
        const projectBudgets = projects.map(p => ({
            title: p.title,
            budget: p.budget || 0,
            status: p.status
        })).sort((a, b) => b.budget - a.budget).slice(0, 5)

        setData({
            totalSalesRevenue,
            totalPurchaseExpense,
            invoicedAmount,
            outstandingReceivables,
            outstandingPayables,
            inventoryValue,
            salesByMonth: [],
            purchasesByMonth: [],
            topCustomers,
            topVendors,
            projectBudgets
        })

        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    const netProfit = data.totalSalesRevenue - data.totalPurchaseExpense
    const profitMargin = data.totalSalesRevenue > 0 ? ((netProfit / data.totalSalesRevenue) * 100).toFixed(1) : 0

    const handleExportReport = () => {
        const reportData = [
            ['ORBIT ERP - Financial Summary Report'],
            [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
            [''],
            ['REVENUE & EXPENSES'],
            ['Total Sales Revenue', formatMoney(data.totalSalesRevenue)],
            ['Total Purchase Expenses', formatMoney(data.totalPurchaseExpense)],
            ['Net Profit', formatMoney(netProfit)],
            ['Profit Margin', `${profitMargin}%`],
            [''],
            ['RECEIVABLES & PAYABLES'],
            ['Invoiced (Collected)', formatMoney(data.invoicedAmount)],
            ['Outstanding Receivables', formatMoney(data.outstandingReceivables)],
            ['Outstanding Payables', formatMoney(data.outstandingPayables)],
            [''],
            ['INVENTORY'],
            ['Total Inventory Value', formatMoney(data.inventoryValue)],
            [''],
            ['TOP CUSTOMERS BY REVENUE'],
            ...data.topCustomers.map(c => [c.name, formatMoney(c.total)]),
            [''],
            ['TOP VENDORS BY SPEND'],
            ...data.topVendors.map(v => [v.name, formatMoney(v.total)])
        ]
        const csv = reportData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orbit_financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sidebar.reports} - {dict.sidebar.finance}</h2>
                    <p className="text-muted-foreground text-sm">Real-time financial performance based on live data.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={fetchReportData}>
                        <Calendar className="h-4 w-4" /> Refresh Data
                    </Button>
                    <Button className="gap-2" onClick={handleExportReport}>
                        <FileSpreadsheet className="h-4 w-4" /> {dict.common.export} CSV
                    </Button>
                </div>
            </div>

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.revenue}</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatMoney(data.totalSalesRevenue)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-blue-100 gap-1">
                            <ArrowUpRight className="h-3 w-3" /> From confirmed sales orders
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-rose-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.expenses}</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatMoney(data.totalPurchaseExpense)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-rose-100 gap-1">
                            <ArrowDownLeft className="h-3 w-3" /> From received purchases
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.netProfit}</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatMoney(netProfit)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-emerald-100 gap-1">
                            {netProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {profitMargin}% Margin
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Inventory Value</CardDescription>
                        <CardTitle className="text-2xl font-bold text-slate-900">{formatMoney(data.inventoryValue)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            Total stock at average cost
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white/50 backdrop-blur-sm p-1 border">
                    <TabsTrigger value="overview" className="gap-2"><PieChart className="h-4 w-4" /> Overview</TabsTrigger>
                    <TabsTrigger value="receivables" className="gap-2"><TrendingUp className="h-4 w-4" /> Receivables</TabsTrigger>
                    <TabsTrigger value="payables" className="gap-2"><TrendingDown className="h-4 w-4" /> Payables</TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2"><Layers className="h-4 w-4" /> Project Budgets</TabsTrigger>
                </TabsList>

                {/* Overview Content */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Top Customers by Revenue</CardTitle>
                                <CardDescription>Highest contributing clients</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.topCustomers.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No sales data available</p>
                                ) : data.topCustomers.map((customer, idx) => (
                                    <div key={customer.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <span className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                                            <span className="font-medium">{customer.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-blue-600">{formatMoney(customer.total)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Top Vendors by Spend</CardTitle>
                                <CardDescription>Highest procurement sources</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.topVendors.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8">No purchase data available</p>
                                ) : data.topVendors.map((vendor, idx) => (
                                    <div key={vendor.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <span className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                                            <span className="font-medium">{vendor.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-orange-600">{formatMoney(vendor.total)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Receivables Content */}
                <TabsContent value="receivables">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Accounts Receivable Status</CardTitle>
                            <CardDescription>Customer invoices and collection status</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <p className="text-sm font-bold text-emerald-600 uppercase mb-2">Collected</p>
                                    <p className="text-3xl font-black text-emerald-700">{formatMoney(data.invoicedAmount)}</p>
                                    <p className="text-xs text-emerald-600 mt-1">Paid invoices</p>
                                </div>
                                <div className="p-6 rounded-xl bg-amber-50 border border-amber-200">
                                    <p className="text-sm font-bold text-amber-600 uppercase mb-2">Outstanding</p>
                                    <p className="text-3xl font-black text-amber-700">{formatMoney(data.outstandingReceivables)}</p>
                                    <p className="text-xs text-amber-600 mt-1">Sent / Overdue</p>
                                </div>
                                <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
                                    <p className="text-sm font-bold text-blue-600 uppercase mb-2">Total Invoiced</p>
                                    <p className="text-3xl font-black text-blue-700">{formatMoney(data.invoicedAmount + data.outstandingReceivables)}</p>
                                    <p className="text-xs text-blue-600 mt-1">All time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payables Content */}
                <TabsContent value="payables">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Accounts Payable Status</CardTitle>
                            <CardDescription>Vendor obligations and payment schedule</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-xl bg-rose-50 border border-rose-200">
                                    <p className="text-sm font-bold text-rose-600 uppercase mb-2">Outstanding Payables</p>
                                    <p className="text-3xl font-black text-rose-700">{formatMoney(data.outstandingPayables)}</p>
                                    <p className="text-xs text-rose-600 mt-1">Confirmed & received POs awaiting payment</p>
                                </div>
                                <div className="p-6 rounded-xl bg-indigo-50 border border-indigo-200">
                                    <p className="text-sm font-bold text-indigo-600 uppercase mb-2">Total Procurement</p>
                                    <p className="text-3xl font-black text-indigo-700">{formatMoney(data.totalPurchaseExpense)}</p>
                                    <p className="text-xs text-indigo-600 mt-1">Received & billed purchases</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Project Budgets Content */}
                <TabsContent value="projects">
                    <Card className="border-none shadow-xl">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle>Project Budget Overview</CardTitle>
                            <CardDescription>Top projects by allocated budget</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {data.projectBudgets.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">No projects available</p>
                            ) : data.projectBudgets.map((project, idx) => (
                                <div key={project.title} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border">
                                    <div className="flex items-center gap-4">
                                        <span className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">{idx + 1}</span>
                                        <div>
                                            <p className="font-bold text-slate-800">{project.title}</p>
                                            <p className="text-xs text-slate-500">{project.status}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-mono font-black text-indigo-600">{formatMoney(project.budget)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
