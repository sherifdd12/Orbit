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

export default function DashboardPage() {
    const stats = [
        {
            title: "Total Inventory Value",
            value: "$124,500.00",
            description: "+12.5% from last month",
            icon: Package,
            trend: "up",
            color: "text-blue-600",
        },
        {
            title: "Active Projects",
            value: "12",
            description: "3 nearing deadline",
            icon: Briefcase,
            trend: "up",
            color: "text-purple-600",
        },
        {
            title: "Monthly Revenue",
            value: "$45,230.50",
            description: "+8.2% from last month",
            icon: TrendingUp,
            trend: "up",
            color: "text-emerald-600",
        },
        {
            title: "Pending Tasks",
            value: "28",
            description: "5 high priority",
            icon: AlertCircle,
            trend: "down",
            color: "text-orange-600",
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground">
                    Welcome back to Orbit. Here's what's happening across your business today.
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
                            Updates from your active contracting and service projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            Modern Office Renovation - Stage 2
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Material delivery confirmed by Warehouse A
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm text-muted-foreground">
                                        Just now
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Stock Alerts</CardTitle>
                        <CardDescription>
                            Items reaching low stock levels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: "Steel Rebar 12mm", stock: "450kg", min: "500kg" },
                                { name: "Cement Portland", stock: "20 bags", min: "50 bags" },
                                { name: "Copper Wiring 2.5mm", stock: "15 rolls", min: "25 rolls" },
                            ].map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-xs text-rose-500">Stock: {item.stock} / Min: {item.min}</p>
                                    </div>
                                    <button className="text-xs font-semibold text-primary hover:underline">
                                        Reorder
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
