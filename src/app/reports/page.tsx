"use client"

import * as React from "react"
import {
    BarChart3,
    TrendingUp,
    FileSpreadsheet,
    DollarSign,
    Users,
    Package,
    Briefcase,
    Calendar,
    Loader2,
    Download,
    Clock,
    CheckCircle2,
    AlertTriangle
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
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface DashboardMetrics {
    // Sales Metrics
    totalSalesOrders: number
    pendingQuotations: number
    confirmedOrders: number
    deliveredOrders: number
    totalSalesValue: number

    // Purchasing Metrics
    totalPurchaseOrders: number
    pendingPOs: number
    receivedPOs: number
    totalPurchaseValue: number

    // Inventory Metrics
    totalItems: number
    lowStockItems: number
    outOfStockItems: number
    inventoryValue: number

    // HR Metrics
    totalEmployees: number
    activeEmployees: number
    departments: number

    // Project Metrics
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalBudget: number

    // Task Metrics
    totalTasks: number
    pendingTasks: number
    completedTasks: number
    criticalTasks: number
}

export default function ReportsDashboardPage() {
    const { dict, locale } = useLanguage()
    const { currency, formatMoney } = useSettings()
    const [loading, setLoading] = React.useState(true)
    const [metrics, setMetrics] = React.useState<DashboardMetrics>({
        totalSalesOrders: 0,
        pendingQuotations: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        totalSalesValue: 0,
        totalPurchaseOrders: 0,
        pendingPOs: 0,
        receivedPOs: 0,
        totalPurchaseValue: 0,
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        inventoryValue: 0,
        totalEmployees: 0,
        activeEmployees: 0,
        departments: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalBudget: 0,
        totalTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        criticalTasks: 0
    })

    const supabase = createClient()

    const fetchMetrics = React.useCallback(async () => {
        setLoading(true)

        const [
            salesRes,
            purchaseRes,
            itemsRes,
            employeesRes,
            departmentsRes,
            projectsRes,
            tasksRes
        ] = await Promise.all([
            supabase.from('sale_orders').select('status, total'),
            supabase.from('purchase_orders').select('status, total'),
            supabase.from('items').select('stock_quantity, avg_cost'),
            supabase.from('employees').select('employment_status'),
            supabase.from('departments').select('id'),
            supabase.from('projects').select('status, budget'),
            supabase.from('tasks').select('status, priority')
        ])

        const sales = salesRes.data || []
        const purchases = purchaseRes.data || []
        const items = itemsRes.data || []
        const employees = employeesRes.data || []
        const departments = departmentsRes.data || []
        const projects = projectsRes.data || []
        const tasks = tasksRes.data || []

        setMetrics({
            totalSalesOrders: sales.length,
            pendingQuotations: sales.filter(s => s.status === 'Quotation').length,
            confirmedOrders: sales.filter(s => s.status === 'Confirmed').length,
            deliveredOrders: sales.filter(s => s.status === 'Delivered').length,
            totalSalesValue: sales.reduce((sum, s) => sum + (s.total || 0), 0),

            totalPurchaseOrders: purchases.length,
            pendingPOs: purchases.filter(p => ['Draft', 'Sent', 'Confirmed'].includes(p.status)).length,
            receivedPOs: purchases.filter(p => p.status === 'Received').length,
            totalPurchaseValue: purchases.reduce((sum, p) => sum + (p.total || 0), 0),

            totalItems: items.length,
            lowStockItems: items.filter(i => (i.stock_quantity || 0) < 10 && (i.stock_quantity || 0) > 0).length,
            outOfStockItems: items.filter(i => (i.stock_quantity || 0) === 0).length,
            inventoryValue: items.reduce((sum, i) => sum + ((i.stock_quantity || 0) * (i.avg_cost || 0)), 0),

            totalEmployees: employees.length,
            activeEmployees: employees.filter(e => e.employment_status === 'Full-time' || e.employment_status === 'Part-time').length,
            departments: departments.length,

            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'Active').length,
            completedProjects: projects.filter(p => p.status === 'Completed').length,
            totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),

            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => t.status !== 'Done').length,
            completedTasks: tasks.filter(t => t.status === 'Done').length,
            criticalTasks: tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length
        })

        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchMetrics()
    }, [fetchMetrics])

    const handleExportDashboard = () => {
        const rows = [
            ['ORBIT ERP - Executive Dashboard Report'],
            [`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`],
            [''],
            ['SALES PERFORMANCE'],
            ['Total Orders', metrics.totalSalesOrders],
            ['Pending Quotations', metrics.pendingQuotations],
            ['Confirmed Orders', metrics.confirmedOrders],
            ['Total Sales Value', formatMoney(metrics.totalSalesValue)],
            [''],
            ['PROCUREMENT'],
            ['Total POs', metrics.totalPurchaseOrders],
            ['Pending POs', metrics.pendingPOs],
            ['Received', metrics.receivedPOs],
            ['Total Purchase Value', formatMoney(metrics.totalPurchaseValue)],
            [''],
            ['INVENTORY'],
            ['Total Items', metrics.totalItems],
            ['Low Stock', metrics.lowStockItems],
            ['Out of Stock', metrics.outOfStockItems],
            ['Inventory Value', formatMoney(metrics.inventoryValue)],
            [''],
            ['WORKFORCE'],
            ['Total Employees', metrics.totalEmployees],
            ['Active Employees', metrics.activeEmployees],
            ['Departments', metrics.departments],
            [''],
            ['PROJECTS'],
            ['Total Projects', metrics.totalProjects],
            ['Active', metrics.activeProjects],
            ['Completed', metrics.completedProjects],
            ['Total Budget', formatMoney(metrics.totalBudget)],
            [''],
            ['TASKS'],
            ['Total Tasks', metrics.totalTasks],
            ['Pending', metrics.pendingTasks],
            ['Completed', metrics.completedTasks],
            ['Critical', metrics.criticalTasks]
        ]
        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orbit_dashboard_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        )
    }

    const taskCompletionRate = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0
    const projectCompletionRate = metrics.totalProjects > 0 ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100) : 0

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Executive Dashboard</h2>
                    <p className="text-slate-500 font-medium">Real-time organizational metrics and KPIs</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchMetrics} className="gap-2">
                        <Calendar className="h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={handleExportDashboard} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Download className="h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Sales & Purchasing Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <DollarSign className="h-5 w-5" /> Sales Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-black">{formatMoney(metrics.totalSalesValue)}</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-blue-100 text-xs">Quotations</p>
                                <p className="text-2xl font-bold">{metrics.pendingQuotations}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-blue-100 text-xs">Confirmed</p>
                                <p className="text-2xl font-bold">{metrics.confirmedOrders}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-blue-100 text-xs">Delivered</p>
                                <p className="text-2xl font-bold">{metrics.deliveredOrders}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Package className="h-5 w-5" /> Procurement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-black">{formatMoney(metrics.totalPurchaseValue)}</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-orange-100 text-xs">Total POs</p>
                                <p className="text-2xl font-bold">{metrics.totalPurchaseOrders}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-orange-100 text-xs">Pending</p>
                                <p className="text-2xl font-bold">{metrics.pendingPOs}</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-orange-100 text-xs">Received</p>
                                <p className="text-2xl font-bold">{metrics.receivedPOs}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory & HR Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-emerald-600" /> Inventory Status
                        </CardTitle>
                        <CardDescription>Stock levels and valuation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600 mb-4">{formatMoney(metrics.inventoryValue)}</div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50">
                                <p className="text-xs text-slate-500 font-bold">Total Items</p>
                                <p className="text-2xl font-black text-slate-800">{metrics.totalItems}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50">
                                <p className="text-xs text-amber-600 font-bold">Low Stock</p>
                                <p className="text-2xl font-black text-amber-700">{metrics.lowStockItems}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-rose-50">
                                <p className="text-xs text-rose-600 font-bold">Out of Stock</p>
                                <p className="text-2xl font-black text-rose-700">{metrics.outOfStockItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-600" /> Workforce
                        </CardTitle>
                        <CardDescription>Employee and department overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-violet-600 mb-4">{metrics.totalEmployees} Employees</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-violet-50">
                                <p className="text-xs text-violet-600 font-bold">Active</p>
                                <p className="text-2xl font-black text-violet-700">{metrics.activeEmployees}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-50">
                                <p className="text-xs text-indigo-600 font-bold">Departments</p>
                                <p className="text-2xl font-black text-indigo-700">{metrics.departments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Projects & Tasks Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-600" /> Project Portfolio
                        </CardTitle>
                        <CardDescription>Budget allocation and status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Total Budget Allocated</span>
                            <span className="text-2xl font-black text-indigo-600">{formatMoney(metrics.totalBudget)}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Completion Rate</span>
                                <span className="font-bold">{projectCompletionRate}%</span>
                            </div>
                            <Progress value={projectCompletionRate} className="h-3" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-black text-slate-800">{metrics.totalProjects}</p>
                                <p className="text-xs text-slate-500">Total</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-black text-blue-700">{metrics.activeProjects}</p>
                                <p className="text-xs text-blue-600">Active</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                <p className="text-2xl font-black text-emerald-700">{metrics.completedProjects}</p>
                                <p className="text-xs text-emerald-600">Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-teal-600" /> Task Performance
                        </CardTitle>
                        <CardDescription>Deliverable tracking and urgency</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Tasks Completed</span>
                            <span className="text-2xl font-black text-teal-600">{metrics.completedTasks} / {metrics.totalTasks}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Completion Rate</span>
                                <span className="font-bold">{taskCompletionRate}%</span>
                            </div>
                            <Progress value={taskCompletionRate} className="h-3" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-black text-slate-800">{metrics.pendingTasks}</p>
                                <p className="text-xs text-slate-500">Pending</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                <p className="text-2xl font-black text-emerald-700">{metrics.completedTasks}</p>
                                <p className="text-xs text-emerald-600">Done</p>
                            </div>
                            <div className="text-center p-3 bg-rose-50 rounded-lg">
                                <p className="text-2xl font-black text-rose-700">{metrics.criticalTasks}</p>
                                <p className="text-xs text-rose-600">Critical</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
