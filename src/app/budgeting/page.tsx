"use client"

import * as React from "react"
import {
    Target,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    PieChart,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    AlertCircle,
    Minus,
    ArrowUp,
    ArrowDown,
    Calculator
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, getYear, getMonth } from "date-fns"

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
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Budget {
    id: string
    budget_code: string
    name: string
    description: string | null
    fiscal_year: number
    period_type: 'Annual' | 'Quarterly' | 'Monthly'
    total_amount: number
    spent_amount: number
    remaining_amount: number
    status: string
    start_date: string
    end_date: string
    department_id: string | null
    created_at: string
    departments?: { name: string }
}

interface BudgetLine {
    id: string
    budget_id: string
    category: string
    description: string | null
    budgeted_amount: number
    actual_amount: number
    variance: number
    variance_percentage: number
}

interface Forecast {
    id: string
    name: string
    fiscal_year: number
    quarter: number | null
    month: number | null
    forecast_type: 'Revenue' | 'Expense' | 'Cash Flow'
    forecasted_amount: number
    actual_amount: number | null
    variance: number | null
    confidence_level: number
    notes: string | null
    created_at: string
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    Draft: { color: 'bg-slate-100 text-slate-600', icon: Edit, label: 'Draft' },
    Active: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Active' },
    Closed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, label: 'Closed' },
    OverBudget: { color: 'bg-rose-100 text-rose-700', icon: AlertCircle, label: 'Over Budget' },
}

const periodLabels: Record<string, string> = {
    Annual: 'Annual',
    Quarterly: 'Quarterly',
    Monthly: 'Monthly',
}

export default function BudgetingPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [budgets, setBudgets] = React.useState<Budget[]>([])
    const [budgetLines, setBudgetLines] = React.useState<BudgetLine[]>([])
    const [forecasts, setForecasts] = React.useState<Forecast[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("budgets")
    const [filterYear, setFilterYear] = React.useState(new Date().getFullYear().toString())

    // Create Budget Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newBudget, setNewBudget] = React.useState({
        name: '',
        description: '',
        fiscal_year: new Date().getFullYear(),
        period_type: 'Annual' as 'Annual' | 'Quarterly' | 'Monthly',
        total_amount: 0,
        start_date: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
        end_date: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
    })

    // Create Forecast Dialog
    const [isForecastDialogOpen, setIsForecastDialogOpen] = React.useState(false)
    const [newForecast, setNewForecast] = React.useState({
        name: '',
        fiscal_year: new Date().getFullYear(),
        quarter: 1,
        forecast_type: 'Revenue' as 'Revenue' | 'Expense' | 'Cash Flow',
        forecasted_amount: 0,
        confidence_level: 80,
        notes: ''
    })

    // View Budget Details
    const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)

    // Add Budget Line Dialog
    const [isLineDialogOpen, setIsLineDialogOpen] = React.useState(false)
    const [newLine, setNewLine] = React.useState({
        category: '',
        description: '',
        budgeted_amount: 0
    })

    const supabase = createClient()

    const generateBudgetCode = () => {
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        return `BUD-${year}-${random}`
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [budgetsRes, forecastsRes] = await Promise.all([
            supabase.from('budgets').select('*, departments(name)').eq('fiscal_year', parseInt(filterYear)).order('created_at', { ascending: false }),
            supabase.from('forecasts').select('*').eq('fiscal_year', parseInt(filterYear)).order('created_at', { ascending: false })
        ])

        if (!budgetsRes.error) setBudgets(budgetsRes.data || [])
        if (!forecastsRes.error) setForecasts(forecastsRes.data || [])
        setLoading(false)
    }, [supabase, filterYear])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const fetchBudgetLines = async (budgetId: string) => {
        const { data, error } = await supabase
            .from('budget_lines')
            .select('*')
            .eq('budget_id', budgetId)
            .order('category')

        if (!error) setBudgetLines(data || [])
    }

    const handleCreateBudget = async () => {
        if (!newBudget.name || newBudget.total_amount <= 0) {
            return alert(isArabic ? 'الاسم والمبلغ مطلوبان' : 'Name and amount are required')
        }

        const budgetCode = generateBudgetCode()

        const { error } = await supabase.from('budgets').insert([{
            budget_code: budgetCode,
            ...newBudget,
            spent_amount: 0,
            remaining_amount: newBudget.total_amount,
            status: 'Active'
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsCreateDialogOpen(false)
            setNewBudget({
                name: '',
                description: '',
                fiscal_year: new Date().getFullYear(),
                period_type: 'Annual',
                total_amount: 0,
                start_date: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
                end_date: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
            })
            fetchData()
        }
    }

    const handleCreateForecast = async () => {
        if (!newForecast.name || newForecast.forecasted_amount <= 0) {
            return alert(isArabic ? 'الاسم والمبلغ مطلوبان' : 'Name and amount are required')
        }

        const variance = newForecast.forecasted_amount * (1 - (newForecast.confidence_level / 100))

        const { error } = await supabase.from('forecasts').insert([{
            ...newForecast,
            variance: variance
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsForecastDialogOpen(false)
            setNewForecast({
                name: '',
                fiscal_year: new Date().getFullYear(),
                quarter: 1,
                forecast_type: 'Revenue',
                forecasted_amount: 0,
                confidence_level: 80,
                notes: ''
            })
            fetchData()
        }
    }

    const handleAddBudgetLine = async () => {
        if (!selectedBudget || !newLine.category || newLine.budgeted_amount <= 0) {
            return alert(isArabic ? 'الفئة والمبلغ مطلوبان' : 'Category and amount are required')
        }

        const { error } = await supabase.from('budget_lines').insert([{
            budget_id: selectedBudget.id,
            ...newLine,
            actual_amount: 0,
            variance: newLine.budgeted_amount,
            variance_percentage: 100
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsLineDialogOpen(false)
            setNewLine({ category: '', description: '', budgeted_amount: 0 })
            if (selectedBudget) fetchBudgetLines(selectedBudget.id)
        }
    }

    const handleDeleteBudget = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this budget?')) return

        await supabase.from('budget_lines').delete().eq('budget_id', id)
        const { error } = await supabase.from('budgets').delete().eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleViewBudget = async (budget: Budget) => {
        setSelectedBudget(budget)
        await fetchBudgetLines(budget.id)
        setIsViewDialogOpen(true)
    }

    const handleExport = () => {
        const headers = ["Code", "Name", "Year", "Period", "Total", "Spent", "Remaining", "Status"]
        const data = budgets.map(b => [
            b.budget_code,
            b.name,
            b.fiscal_year,
            b.period_type,
            b.total_amount,
            b.spent_amount,
            b.remaining_amount,
            b.status
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `budgets_${filterYear}.csv`
        a.click()
    }

    // Stats
    const stats = {
        totalBudgets: budgets.length,
        totalBudgetedAmount: budgets.reduce((sum, b) => sum + b.total_amount, 0),
        totalSpent: budgets.reduce((sum, b) => sum + b.spent_amount, 0),
        totalRemaining: budgets.reduce((sum, b) => sum + b.remaining_amount, 0),
        activeBudgets: budgets.filter(b => b.status === 'Active').length,
        overBudget: budgets.filter(b => b.spent_amount > b.total_amount).length,
        forecastedRevenue: forecasts.filter(f => f.forecast_type === 'Revenue').reduce((sum, f) => sum + f.forecasted_amount, 0),
        forecastedExpense: forecasts.filter(f => f.forecast_type === 'Expense').reduce((sum, f) => sum + f.forecasted_amount, 0),
    }

    const utilizationPercentage = stats.totalBudgetedAmount > 0 ? (stats.totalSpent / stats.totalBudgetedAmount) * 100 : 0

    const filteredBudgets = budgets.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.budget_code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const currentYear = new Date().getFullYear()
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Target className="h-8 w-8 text-indigo-600" />
                        {isArabic ? 'الميزانية والتوقعات' : 'Budgeting & Forecasting'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة الميزانيات والتخطيط المالي' : 'Manage budgets and financial planning'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-[120px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100 text-xs font-bold uppercase flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {isArabic ? 'إجمالي الميزانية' : 'Total Budget'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatMoney(stats.totalBudgetedAmount)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span>{isArabic ? 'نسبة الاستخدام' : 'Utilization'}</span>
                                <span>{utilizationPercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={utilizationPercentage} className="h-2 bg-indigo-300" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                            <ArrowUp className="h-3 w-3" /> {isArabic ? 'المصروف' : 'Spent'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-rose-700">{formatMoney(stats.totalSpent)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <ArrowDown className="h-3 w-3" /> {isArabic ? 'المتبقي' : 'Remaining'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-emerald-700">{formatMoney(stats.totalRemaining)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {isArabic ? 'تجاوز الميزانية' : 'Over Budget'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.overBudget}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                        <TabsTrigger value="budgets" className="flex gap-2">
                            <BarChart3 className="h-4 w-4" />
                            {isArabic ? 'الميزانيات' : 'Budgets'}
                        </TabsTrigger>
                        <TabsTrigger value="forecasts" className="flex gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {isArabic ? 'التوقعات' : 'Forecasts'}
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                        {activeTab === 'budgets' && (
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                        <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'ميزانية جديدة' : 'New Budget'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>{isArabic ? 'إنشاء ميزانية جديدة' : 'Create New Budget'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'اسم الميزانية' : 'Budget Name'} *</Label>
                                            <Input
                                                value={newBudget.name}
                                                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                                            <Textarea
                                                value={newBudget.description}
                                                onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'السنة المالية' : 'Fiscal Year'}</Label>
                                                <Select
                                                    value={newBudget.fiscal_year.toString()}
                                                    onValueChange={(v) => setNewBudget({ ...newBudget, fiscal_year: parseInt(v) })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {years.map(year => (
                                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'نوع الفترة' : 'Period Type'}</Label>
                                                <Select
                                                    value={newBudget.period_type}
                                                    onValueChange={(v) => setNewBudget({ ...newBudget, period_type: v as 'Annual' | 'Quarterly' | 'Monthly' })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Annual">{isArabic ? 'سنوي' : 'Annual'}</SelectItem>
                                                        <SelectItem value="Quarterly">{isArabic ? 'ربع سنوي' : 'Quarterly'}</SelectItem>
                                                        <SelectItem value="Monthly">{isArabic ? 'شهري' : 'Monthly'}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'تاريخ البداية' : 'Start Date'}</Label>
                                                <Input
                                                    type="date"
                                                    value={newBudget.start_date}
                                                    onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'تاريخ النهاية' : 'End Date'}</Label>
                                                <Input
                                                    type="date"
                                                    value={newBudget.end_date}
                                                    onChange={(e) => setNewBudget({ ...newBudget, end_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>{isArabic ? 'إجمالي المبلغ' : 'Total Amount'} *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={newBudget.total_amount}
                                                    onChange={(e) => setNewBudget({ ...newBudget, total_amount: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateBudget}>{isArabic ? 'إنشاء' : 'Create Budget'}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                        {activeTab === 'forecasts' && (
                            <Dialog open={isForecastDialogOpen} onOpenChange={setIsForecastDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                                        <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'توقع جديد' : 'New Forecast'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>{isArabic ? 'إنشاء توقع جديد' : 'Create New Forecast'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الاسم' : 'Name'} *</Label>
                                            <Input
                                                value={newForecast.name}
                                                onChange={(e) => setNewForecast({ ...newForecast, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'السنة المالية' : 'Fiscal Year'}</Label>
                                                <Select
                                                    value={newForecast.fiscal_year.toString()}
                                                    onValueChange={(v) => setNewForecast({ ...newForecast, fiscal_year: parseInt(v) })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {years.map(year => (
                                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'الربع' : 'Quarter'}</Label>
                                                <Select
                                                    value={newForecast.quarter.toString()}
                                                    onValueChange={(v) => setNewForecast({ ...newForecast, quarter: parseInt(v) })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Q1</SelectItem>
                                                        <SelectItem value="2">Q2</SelectItem>
                                                        <SelectItem value="3">Q3</SelectItem>
                                                        <SelectItem value="4">Q4</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'النوع' : 'Type'}</Label>
                                                <Select
                                                    value={newForecast.forecast_type}
                                                    onValueChange={(v) => setNewForecast({ ...newForecast, forecast_type: v as 'Revenue' | 'Expense' | 'Cash Flow' })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Revenue">{isArabic ? 'إيرادات' : 'Revenue'}</SelectItem>
                                                        <SelectItem value="Expense">{isArabic ? 'مصروفات' : 'Expense'}</SelectItem>
                                                        <SelectItem value="Cash Flow">{isArabic ? 'تدفق نقدي' : 'Cash Flow'}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'مستوى الثقة' : 'Confidence'} %</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={newForecast.confidence_level}
                                                    onChange={(e) => setNewForecast({ ...newForecast, confidence_level: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>{isArabic ? 'المبلغ المتوقع' : 'Forecasted Amount'} *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={newForecast.forecasted_amount}
                                                    onChange={(e) => setNewForecast({ ...newForecast, forecasted_amount: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                                <Textarea
                                                    value={newForecast.notes}
                                                    onChange={(e) => setNewForecast({ ...newForecast, notes: e.target.value })}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsForecastDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateForecast}>{isArabic ? 'إنشاء' : 'Create Forecast'}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Budgets Tab */}
                <TabsContent value="budgets">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={isArabic ? 'بحث في الميزانيات...' : 'Search budgets...'}
                                    className="pl-9 bg-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/20">
                                            <TableHead className="pl-6">{isArabic ? 'الميزانية' : 'Budget'}</TableHead>
                                            <TableHead>{isArabic ? 'الفترة' : 'Period'}</TableHead>
                                            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'الإجمالي' : 'Total'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'المصروف' : 'Spent'}</TableHead>
                                            <TableHead>{isArabic ? 'نسبة الاستخدام' : 'Utilization'}</TableHead>
                                            <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell>
                                            </TableRow>
                                        ) : filteredBudgets.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                                    {isArabic ? 'لا توجد ميزانيات' : 'No budgets found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredBudgets.map(budget => {
                                            const statusInfo = statusConfig[budget.status] || statusConfig.Draft
                                            const StatusIcon = statusInfo.icon
                                            const utilization = budget.total_amount > 0 ? (budget.spent_amount / budget.total_amount) * 100 : 0
                                            const isOverBudget = utilization > 100

                                            return (
                                                <TableRow key={budget.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{budget.name}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">{budget.budget_code}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {budget.fiscal_year} • {periodLabels[budget.period_type]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold">{formatMoney(budget.total_amount)}</TableCell>
                                                    <TableCell className={`text-right font-mono ${isOverBudget ? 'text-rose-600 font-bold' : ''}`}>
                                                        {formatMoney(budget.spent_amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="w-32">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className={isOverBudget ? 'text-rose-600 font-bold' : ''}>{utilization.toFixed(1)}%</span>
                                                            </div>
                                                            <Progress
                                                                value={Math.min(utilization, 100)}
                                                                className={`h-2 ${isOverBudget ? 'bg-rose-200' : ''}`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>{isArabic ? 'العمليات' : 'Actions'}</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleViewBudget(budget)}>
                                                                    <Eye className="h-4 w-4 mr-2" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteBudget(budget.id)}>
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

                {/* Forecasts Tab */}
                <TabsContent value="forecasts">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <Card className="border-none shadow-md bg-emerald-50/50">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> {isArabic ? 'الإيرادات المتوقعة' : 'Forecasted Revenue'}
                                </CardDescription>
                                <CardTitle className="text-2xl font-bold text-emerald-700">{formatMoney(stats.forecastedRevenue)}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-md bg-rose-50/50">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" /> {isArabic ? 'المصروفات المتوقعة' : 'Forecasted Expenses'}
                                </CardDescription>
                                <CardTitle className="text-2xl font-bold text-rose-700">{formatMoney(stats.forecastedExpense)}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/20">
                                            <TableHead className="pl-6">{isArabic ? 'التوقع' : 'Forecast'}</TableHead>
                                            <TableHead>{isArabic ? 'النوع' : 'Type'}</TableHead>
                                            <TableHead>{isArabic ? 'الفترة' : 'Period'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'المبلغ المتوقع' : 'Forecasted'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'الفعلي' : 'Actual'}</TableHead>
                                            <TableHead>{isArabic ? 'الثقة' : 'Confidence'}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {forecasts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                                    {isArabic ? 'لا توجد توقعات' : 'No forecasts found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : forecasts.map(forecast => {
                                            const typeColor = forecast.forecast_type === 'Revenue'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : forecast.forecast_type === 'Expense'
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-blue-100 text-blue-700'

                                            return (
                                                <TableRow key={forecast.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-6 font-bold">{forecast.name}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`${typeColor} border-none`}>
                                                            {forecast.forecast_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono">{forecast.fiscal_year} Q{forecast.quarter}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold">{formatMoney(forecast.forecasted_amount)}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {forecast.actual_amount ? formatMoney(forecast.actual_amount) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={forecast.confidence_level} className="h-2 w-16" />
                                                            <span className="text-xs font-mono">{forecast.confidence_level}%</span>
                                                        </div>
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

            {/* View Budget Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل الميزانية' : 'Budget Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedBudget && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'الميزانية' : 'Budget'}</span>
                                    <p className="font-bold">{selectedBudget.name}</p>
                                    <span className="text-xs text-muted-foreground font-mono">{selectedBudget.budget_code}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'إجمالي المبلغ' : 'Total Amount'}</span>
                                    <p className="font-bold text-indigo-600">{formatMoney(selectedBudget.total_amount)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'المصروف' : 'Spent'}</span>
                                    <p className="font-bold text-rose-600">{formatMoney(selectedBudget.spent_amount)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'المتبقي' : 'Remaining'}</span>
                                    <p className="font-bold text-emerald-600">{formatMoney(selectedBudget.remaining_amount)}</p>
                                </div>
                            </div>

                            {/* Budget Lines */}
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold">{isArabic ? 'بنود الميزانية' : 'Budget Lines'}</h3>
                                <Dialog open={isLineDialogOpen} onOpenChange={setIsLineDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'إضافة بند' : 'Add Line'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>{isArabic ? 'إضافة بند ميزانية' : 'Add Budget Line'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'الفئة' : 'Category'} *</Label>
                                                <Input
                                                    value={newLine.category}
                                                    onChange={(e) => setNewLine({ ...newLine, category: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                                                <Input
                                                    value={newLine.description}
                                                    onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{isArabic ? 'المبلغ المخصص' : 'Budgeted Amount'} *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={newLine.budgeted_amount}
                                                    onChange={(e) => setNewLine({ ...newLine, budgeted_amount: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsLineDialogOpen(false)}>{dict.common.cancel}</Button>
                                            <Button onClick={handleAddBudgetLine}>{isArabic ? 'إضافة' : 'Add'}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{isArabic ? 'الفئة' : 'Category'}</TableHead>
                                        <TableHead>{isArabic ? 'الوصف' : 'Description'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'المخصص' : 'Budgeted'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الفعلي' : 'Actual'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الفرق' : 'Variance'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budgetLines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                {isArabic ? 'لا توجد بنود. أضف بنود للميزانية.' : 'No budget lines. Add lines to track spending.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : budgetLines.map(line => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-bold">{line.category}</TableCell>
                                            <TableCell className="text-muted-foreground">{line.description || '-'}</TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(line.budgeted_amount)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(line.actual_amount)}</TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${line.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {line.variance >= 0 ? '+' : ''}{formatMoney(line.variance)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
