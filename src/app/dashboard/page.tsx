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
    ArrowDownRight
} from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getDictionary, Locale } from "@/lib/i18n/dictionaries"

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    try {
        const supabase = await createClient()
        const cookieStore = await cookies()
        const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en"
        const locale: Locale = rawLocale === "ar" ? "ar" : "en"
        const dict = getDictionary(locale)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            redirect('/login')
        }

        // Fetch real counts/data from Supabase
        const [{ count: itemsCount }, { count: projectsCount }, { data: recentProjects }] = await Promise.all([
            supabase.from('items').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
            supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(3)
        ])

        // Simple inventory value calculation placeholder (Sum of stock * price)
        const { data: inventoryValueData } = await supabase
            .from('items')
            .select('stock_quantity, purchase_price')

        const totalValue = (inventoryValueData as { stock_quantity: number; purchase_price: number }[] | null)?.reduce((acc: number, item) =>
            acc + (Number(item.stock_quantity) * Number(item.purchase_price)), 0) || 0

        const stats = [
            {
                title: dict.dashboard.inventoryValue,
                value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                description: "Live calculated from master",
                icon: Package,
                trend: "up",
                color: "text-blue-600",
            },
            {
                title: dict.dashboard.activeProjects,
                value: (projectsCount || 0).toString(),
                description: "Ongoing contracting jobs",
                icon: Briefcase,
                trend: "up",
                color: "text-purple-600",
            },
            {
                title: dict.dashboard.totalItems,
                value: (itemsCount || 0).toString(),
                description: "Unique SKUs in stock",
                icon: TrendingUp,
                trend: "up",
                color: "text-emerald-600",
            },
            {
                title: dict.dashboard.stockAlerts,
                value: "0", // Hardcoded placeholder for now or fetch items with stock < min
                description: "Items below threshold",
                icon: AlertCircle,
                trend: "down",
                color: "text-orange-600",
            },
        ]

        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{dict.dashboard.title}</h2>
                    <p className="text-muted-foreground">
                        {dict.dashboard.welcome}, {user?.email}. {dict.dashboard.latestUpdates}
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.title} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    {stat.trend === "up" ? (
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                                    )}
                                    <span className={stat.trend === "up" ? "text-emerald-500" : "text-rose-500"}>
                                        {stat.description.split(" ")[0]}
                                    </span>
                                    {stat.description.split(" ").slice(1).join(" ")}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Recent Project Activity</CardTitle>
                            <CardDescription>
                                Latest updates from your projects database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {(recentProjects as { id: string; title: string; client_name?: string; status: string; created_at: string }[] | null)?.map((project) => (
                                    <div key={project.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {project.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Client: {project.client_name || 'N/A'} - Status: {project.status}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-sm text-muted-foreground">
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                )) || (
                                        <p className="text-sm text-muted-foreground text-center py-4">No recent projects found.</p>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Stock Alerts</CardTitle>
                            <CardDescription>
                                Low stock monitoring system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-center py-8">
                                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">All items above threshold settings.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    } catch (error: any) {
        if (error?.digest?.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Dashboard Render Error:", error);
        return (
            <div className="p-8 text-center bg-white rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-rose-600">Failed to load Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    This might be due to missing database tables or environment variables.
                </p>
                <div className="mt-4 p-4 bg-slate-50 rounded text-left text-xs font-mono overflow-auto max-w-lg mx-auto">
                    {error?.message || "Unknown error"}
                </div>
            </div>
        )
    }
}
