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
    Printer
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

export default function FinancialReportsPage() {
    const { dict, locale } = useLanguage()

    // In a real app, these would fetch summary totals from the database
    // For now, providing a high-quality dashboard structure

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.sidebar.reports} - {dict.sidebar.finance}</h2>
                    <p className="text-muted-foreground text-sm">Real-time financial performance and legal statements.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Period: FY 2026</Button>
                    <Button className="gap-2"><FileSpreadsheet className="h-4 w-4" /> {dict.common.export} Excel</Button>
                </div>
            </div>

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.revenue}</CardDescription>
                        <CardTitle className="text-2xl font-bold">482,900.00 SAR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-blue-100 gap-1">
                            <ArrowUpRight className="h-3 w-3" /> +12% from last month
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-rose-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.expenses}</CardDescription>
                        <CardTitle className="text-2xl font-bold">145,230.00 SAR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-rose-100 gap-1">
                            <ArrowDownLeft className="h-3 w-3" /> -4% optimization
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-100 text-xs font-bold uppercase tracking-wider">{dict.dashboard.netProfit}</CardDescription>
                        <CardTitle className="text-2xl font-bold">337,670.00 SAR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-emerald-100 gap-1">
                            <TrendingUp className="h-3 w-3" /> 28.5% Margin
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Cash on Hand</CardDescription>
                        <CardTitle className="text-2xl font-bold text-slate-900">1,240,000.00 SAR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            Across all bank accounts
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white/50 backdrop-blur-sm p-1 border">
                    <TabsTrigger value="overview" className="gap-2"><PieChart className="h-4 w-4" /> Overview</TabsTrigger>
                    <TabsTrigger value="pl" className="gap-2"><TrendingUp className="h-4 w-4" /> Profit & Loss</TabsTrigger>
                    <TabsTrigger value="balance" className="gap-2"><Layers className="h-4 w-4" /> Balance Sheet</TabsTrigger>
                    <TabsTrigger value="cash" className="gap-2"><DollarSign className="h-4 w-4" /> Cash Flow</TabsTrigger>
                </TabsList>

                {/* Overview Content */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Revenue vs Expenses</CardTitle>
                                <CardDescription>Monthly comparison for the current fiscal year.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80 flex items-center justify-center bg-slate-50 rounded-md m-6 mt-0 border border-dashed border-slate-200">
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <BarChart3 className="h-12 w-12 opacity-20" />
                                    <p className="text-sm">Interactive visualization will be loaded here.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle>Expense Distribution</CardTitle>
                                <CardDescription>Top expense categories by volume.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80 flex items-center justify-center bg-slate-50 rounded-md m-6 mt-0 border border-dashed border-slate-200">
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <PieChart className="h-12 w-12 opacity-20" />
                                    <p className="text-sm">Interactive visualization will be loaded here.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Profit & Loss Content */}
                <TabsContent value="pl">
                    <Card className="border-none shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{dict.finance.profitLoss}</CardTitle>
                                <CardDescription>Comparative statement for Jul 2025 - Jun 2026</CardDescription>
                            </div>
                            <Button variant="outline"><Printer className="h-4 w-4 mr-2" /> Print PDF</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-8 space-y-8 max-w-4xl mx-auto">
                                <div className="space-y-4">
                                    <h3 className="font-bold border-b pb-2 text-slate-900 uppercase tracking-wide text-sm">{dict.finance.income}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm py-1 border-b border-dotted">
                                            <span>Sales Revenue</span>
                                            <span className="font-mono">450,000.00</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1 border-b border-dotted">
                                            <span>Service Revenue</span>
                                            <span className="font-mono">32,900.00</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm bg-slate-50 p-2 rounded">
                                            <span>Total Revenue</span>
                                            <span className="font-mono">482,900.00</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold border-b pb-2 text-slate-900 uppercase tracking-wide text-sm">Cost of Sales</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm py-1 border-b border-dotted">
                                            <span>Cost of Goods Sold (COGS)</span>
                                            <span className="font-mono">(120,000.00)</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm bg-rose-50 p-2 rounded text-rose-700">
                                            <span>Gross Profit</span>
                                            <span className="font-mono">362,900.00</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold border-b pb-2 text-slate-900 uppercase tracking-wide text-sm">{dict.finance.expense}</h3>
                                    <div className="space-y-1">
                                        {[
                                            { name: "Salaries & Benefits", val: "25,230.00" },
                                            { name: "Rent & Utilities", val: "4,000.00" },
                                            { name: "Marketing", val: "1,000.00" }
                                        ].map(item => (
                                            <div key={item.name} className="flex justify-between text-sm py-1 border-b border-dotted">
                                                <span>{item.name}</span>
                                                <span className="font-mono">{item.val}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold text-sm bg-slate-50 p-2 rounded">
                                            <span>Total Expenses</span>
                                            <span className="font-mono">(30,230.00)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t-4 border-double border-slate-900 pt-4 flex justify-between font-bold text-xl uppercase italic">
                                    <span>{dict.finance.netProfit}</span>
                                    <span className="font-mono">332,670.00 SAR</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Other tabs can be implemented similarly */}
            </Tabs>
        </div>
    )
}
