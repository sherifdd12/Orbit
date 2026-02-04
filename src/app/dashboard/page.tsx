import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Package,
    Briefcase,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    DollarSign,
    ShoppingCart,
    Calendar,
    ChevronRight,
    Clock,
    Activity
} from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getDictionary, Locale } from "@/lib/i18n/dictionaries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en"
    const locale: Locale = rawLocale === "ar" ? "ar" : "en"
    const dict = getDictionary(locale)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch multi-module statistics with safety
    const results = await Promise.allSettled([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }).lt('stock_quantity', 10),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('sale_orders').select('total').eq('status', 'Confirmed'),
        supabase.from('purchase_orders').select('total').eq('status', 'Confirmed'),
        supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('system_settings').select('value').eq('key', 'base_currency').single()
    ])

    const itemsCount = results[0].status === 'fulfilled' ? (results[0].value as any).count || 0 : 0;
    const lowStockCount = results[1].status === 'fulfilled' ? (results[1].value as any).count || 0 : 0;
    const projectsCount = results[2].status === 'fulfilled' ? (results[2].value as any).count || 0 : 0;
    const employeesCount = results[3].status === 'fulfilled' ? (results[3].value as any).count || 0 : 0;
    const salesOrders = results[4].status === 'fulfilled' ? (results[4].value as any).data : [];
    const purchaseOrders = results[5].status === 'fulfilled' ? (results[5].value as any).data : [];
    const recentActivities = results[6].status === 'fulfilled' ? (results[6].value as any).data : [];
    const baseCurrencyRes = results[7].status === 'fulfilled' ? (results[7].value as any).data : null;
    const currency = baseCurrencyRes?.value || "SAR";

    const totalSales = (salesOrders || []).reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
    const totalPurchases = (purchaseOrders || []).reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);

    const stats = [
        {
            title: "Confirmed Sales",
            value: `${totalSales.toLocaleString()} ${currency}`,
            description: "Total value of active sales orders",
            icon: DollarSign,
            trend: "up",
            color: "text-blue-600",
            bg: "bg-blue-50/50"
        },
        {
            title: "Active Projects",
            value: (projectsCount || 0).toString(),
            description: "Ongoing construction & jobs",
            icon: Briefcase,
            trend: "up",
            color: "text-indigo-600",
            bg: "bg-indigo-50/50"
        },
        {
            title: "Total Workforce",
            value: (employeesCount || 0).toString(),
            description: "Registered employee profiles",
            icon: Users,
            trend: "up",
            color: "text-emerald-600",
            bg: "bg-emerald-50/50"
        },
        {
            title: "Stock Alerts",
            value: (lowStockCount || 0).toString(),
            description: "Items needing urgent reorder",
            icon: AlertCircle,
            trend: "down",
            color: (lowStockCount || 0) > 0 ? "text-rose-600" : "text-slate-400",
            bg: (lowStockCount || 0) > 0 ? "bg-rose-50/50" : "bg-slate-50/50"
        },
    ]

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {dict.dashboard.title}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        Welcome back, <span className="text-primary font-bold">{user?.email?.split('@')[0]}</span>. Here&apos;s what&apos;s happening today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end px-4 py-1 border-r border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Server Time</span>
                        <span className="text-sm font-mono font-bold text-slate-600">11:37 AM</span>
                    </div>
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 border-none">
                        <Activity className="mr-2 h-4 w-4" /> Global Activity
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className={`border-none shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${stat.bg}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <stat.icon className="h-16 w-16" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold tracking-tight text-slate-900">{stat.value}</div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                {stat.description}
                                {stat.trend === "up" ? (
                                    <ArrowUpRight className="h-3 w-3 text-emerald-500 ml-auto" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3 text-rose-500 ml-auto" />
                                )}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Insights */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                {/* Module Health Overview */}
                <Card className="lg:col-span-4 border-none shadow-xl bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Project Operations Pipeline</CardTitle>
                            <CardDescription>Track the latest movements across all active project sites.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary font-bold">View Roadmap <ChevronRight className="ml-1 h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentActivities?.map((activity: any) => (
                                <div key={activity.id} className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                        <Briefcase className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {activity.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] h-4 uppercase border-slate-200">
                                                {activity.status}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {new Date(activity.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )) || (
                                    <div className="text-center py-10">
                                        <Clock className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No project activity logged in the last 24 hours.</p>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sub-widgets */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Financial Quickview */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-2xl font-bold" />
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-slate-400 font-bold">Monthly Financial Yield</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1 font-bold">
                                    <span>Procurement (Purchases)</span>
                                    <span>{totalPurchases.toLocaleString()} {currency}</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1 font-bold">
                                    <span>Operations (Conf. Sales)</span>
                                    <span>{totalSales.toLocaleString()} {currency}</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10 mt-2">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Projected Net Flow</p>
                                <h3 className="text-2xl font-black text-white">{(totalSales - totalPurchases).toLocaleString()} {currency}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Shortcuts */}
                    <Card className="border-none shadow-xl bg-white">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">Operational Shortcuts</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <Link href="/sales/orders">
                                <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col gap-1 border-slate-100 hover:bg-blue-50 hover:text-blue-700 transition-colors group">
                                    <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold">New Sale</span>
                                </Button>
                            </Link>
                            <Link href="/hr/employees">
                                <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col gap-1 border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors group">
                                    <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold">New Employee</span>
                                </Button>
                            </Link>
                            <Link href="/inventory">
                                <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col gap-1 border-slate-100 hover:bg-orange-50 hover:text-orange-700 transition-colors group">
                                    <Package className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold">Check Stock</span>
                                </Button>
                            </Link>
                            <Link href="/projects">
                                <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col gap-1 border-slate-100 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group">
                                    <Briefcase className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold">Project Logs</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
