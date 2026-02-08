"use client"

import * as React from "react"
import {
    Wallet,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Users,
    Calendar,
    DollarSign,
    Calculator,
    FileText,
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Send,
    Play,
    PauseCircle,
    TrendingUp,
    Banknote
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
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface PayrollRun {
    id: string
    payroll_code: string
    period_start: string
    period_end: string
    pay_date: string | null
    status: string
    total_gross: number
    total_deductions: number
    total_net: number
    employee_count: number
    notes: string | null
    created_at: string
}

interface PayrollItem {
    id: string
    payroll_run_id: string
    employee_id: string
    basic_salary: number
    total_earnings: number
    total_deductions: number
    net_pay: number
    payment_status: string
    employees?: {
        employee_code: string
        position: string
        profiles: { full_name: string }
    }
}

interface SalaryComponent {
    id: string
    name: string
    code: string
    component_type: 'Earning' | 'Deduction'
    is_taxable: boolean
    is_fixed: boolean
    default_amount: number | null
    calculation_formula: string | null
}

interface Employee {
    id: string
    employee_code: string
    position: string
    salary: number
    profiles: { full_name: string }
    departments?: { name: string }
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    Draft: { color: 'bg-slate-100 text-slate-600', icon: FileText, label: 'Draft' },
    Processing: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Processing' },
    Approved: { color: 'bg-amber-100 text-amber-700', icon: CheckCircle2, label: 'Approved' },
    Paid: { color: 'bg-emerald-100 text-emerald-700', icon: Banknote, label: 'Paid' },
    Cancelled: { color: 'bg-rose-100 text-rose-700', icon: AlertCircle, label: 'Cancelled' },
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
    Pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    Paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
    OnHold: { color: 'bg-rose-100 text-rose-700', label: 'On Hold' },
}

export default function PayrollPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney } = useSettings()
    const isArabic = locale === 'ar'

    const [payrollRuns, setPayrollRuns] = React.useState<PayrollRun[]>([])
    const [payrollItems, setPayrollItems] = React.useState<PayrollItem[]>([])
    const [salaryComponents, setSalaryComponents] = React.useState<SalaryComponent[]>([])
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("runs")

    // View Payroll Items
    const [selectedPayroll, setSelectedPayroll] = React.useState<PayrollRun | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false)

    // Create Payroll Dialog
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newPayroll, setNewPayroll] = React.useState({
        period_start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        period_end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
        pay_date: '',
        notes: ''
    })

    // Salary Component Dialog
    const [isComponentDialogOpen, setIsComponentDialogOpen] = React.useState(false)
    const [newComponent, setNewComponent] = React.useState({
        name: '',
        code: '',
        component_type: 'Earning' as 'Earning' | 'Deduction',
        is_taxable: false,
        is_fixed: true,
        default_amount: 0
    })

    const supabase = createClient()

    const generatePayrollCode = () => {
        const year = new Date().getFullYear()
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `PAY-${year}${month}-${random}`
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [payrollRes, componentsRes, employeesRes] = await Promise.all([
            supabase.from('payroll_runs').select('*').order('created_at', { ascending: false }),
            supabase.from('salary_components').select('*').eq('is_active', true).order('name'),
            supabase.from('employees').select('*, profiles(full_name), departments(name)').eq('employment_status', 'Active')
        ])

        if (!payrollRes.error) setPayrollRuns(payrollRes.data || [])
        if (!componentsRes.error) setSalaryComponents(componentsRes.data || [])
        if (!employeesRes.error) setEmployees(employeesRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const fetchPayrollItems = async (payrollId: string) => {
        const { data, error } = await supabase
            .from('payroll_items')
            .select('*, employees(employee_code, position, profiles(full_name))')
            .eq('payroll_run_id', payrollId)
            .order('created_at')

        if (!error) setPayrollItems(data || [])
    }

    const handleCreatePayroll = async () => {
        if (!newPayroll.period_start || !newPayroll.period_end) {
            return alert(isArabic ? 'الفترة مطلوبة' : 'Period dates are required')
        }

        const payrollCode = generatePayrollCode()

        // Calculate totals from active employees
        let totalGross = 0
        let totalDeductions = 0

        // Get earnings and deductions from components
        const earnings = salaryComponents.filter(c => c.component_type === 'Earning')
        const deductions = salaryComponents.filter(c => c.component_type === 'Deduction')

        // Calculate per employee
        const payrollItems: {
            employee_id: string
            basic_salary: number
            total_earnings: number
            total_deductions: number
            net_pay: number
        }[] = []

        employees.forEach(emp => {
            const basicSalary = emp.salary || 0

            // Calculate earnings (basic + allowances)
            const empEarnings = basicSalary + earnings.reduce((sum, c) => sum + (c.default_amount || 0), 0)

            // Calculate deductions
            const empDeductions = deductions.reduce((sum, c) => sum + (c.default_amount || 0), 0)

            const netPay = empEarnings - empDeductions

            payrollItems.push({
                employee_id: emp.id,
                basic_salary: basicSalary,
                total_earnings: empEarnings,
                total_deductions: empDeductions,
                net_pay: netPay
            })

            totalGross += empEarnings
            totalDeductions += empDeductions
        })

        const totalNet = totalGross - totalDeductions

        // Create payroll run
        const { data: payrollData, error: payrollError } = await supabase.from('payroll_runs').insert([{
            payroll_code: payrollCode,
            ...newPayroll,
            pay_date: newPayroll.pay_date || null,
            status: 'Draft',
            total_gross: totalGross,
            total_deductions: totalDeductions,
            total_net: totalNet,
            employee_count: employees.length
        }]).select().single()

        if (payrollError) {
            console.error(payrollError)
            alert(payrollError.message)
            return
        }

        // Create payroll items for each employee
        const itemsToInsert = payrollItems.map(item => ({
            payroll_run_id: payrollData.id,
            ...item,
            payment_status: 'Pending'
        }))

        const { error: itemsError } = await supabase.from('payroll_items').insert(itemsToInsert)

        if (itemsError) {
            console.error(itemsError)
            // Rollback payroll run
            await supabase.from('payroll_runs').delete().eq('id', payrollData.id)
            alert(itemsError.message)
            return
        }

        setIsCreateDialogOpen(false)
        setNewPayroll({
            period_start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
            period_end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
            pay_date: '',
            notes: ''
        })
        fetchData()
    }

    const handleCreateComponent = async () => {
        if (!newComponent.name || !newComponent.code) {
            return alert(isArabic ? 'الاسم والرمز مطلوبان' : 'Name and code are required')
        }

        const { error } = await supabase.from('salary_components').insert([{
            ...newComponent,
            is_active: true
        }])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsComponentDialogOpen(false)
            setNewComponent({
                name: '',
                code: '',
                component_type: 'Earning',
                is_taxable: false,
                is_fixed: true,
                default_amount: 0
            })
            fetchData()
        }
    }

    const handleUpdatePayrollStatus = async (payroll: PayrollRun, newStatus: string) => {
        const updates: Record<string, unknown> = { status: newStatus }
        if (newStatus === 'Paid') {
            updates.pay_date = format(new Date(), 'yyyy-MM-dd')
            // Also update all items to Paid
            await supabase.from('payroll_items').update({ payment_status: 'Paid' }).eq('payroll_run_id', payroll.id)
        }

        const { error } = await supabase.from('payroll_runs').update(updates).eq('id', payroll.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeletePayroll = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الرواتب؟' : 'Are you sure you want to delete this payroll?')) return

        // Delete items first
        await supabase.from('payroll_items').delete().eq('payroll_run_id', id)
        const { error } = await supabase.from('payroll_runs').delete().eq('id', id)

        if (error) alert(error.message)
        else fetchData()
    }

    const handleViewPayroll = async (payroll: PayrollRun) => {
        setSelectedPayroll(payroll)
        await fetchPayrollItems(payroll.id)
        setIsViewDialogOpen(true)
    }

    const handleExport = () => {
        const headers = ["Payroll #", "Period", "Pay Date", "Status", "Employees", "Gross", "Deductions", "Net"]
        const data = payrollRuns.map(p => [
            p.payroll_code,
            `${p.period_start} - ${p.period_end}`,
            p.pay_date || '-',
            p.status,
            p.employee_count,
            p.total_gross,
            p.total_deductions,
            p.total_net
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payroll_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    // Stats
    const stats = {
        totalRuns: payrollRuns.length,
        pendingRuns: payrollRuns.filter(p => p.status === 'Draft' || p.status === 'Processing').length,
        totalPaid: payrollRuns.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.total_net, 0),
        lastPayroll: payrollRuns.find(p => p.status === 'Paid'),
        employeeCount: employees.length,
        totalSalaries: employees.reduce((sum, e) => sum + (e.salary || 0), 0)
    }

    const filteredPayrolls = payrollRuns.filter(p =>
        p.payroll_code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isArabic ? 'الرواتب والمكافآت' : 'Payroll Management'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة رواتب الموظفين والمستحقات' : 'Manage employee salaries and compensation'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
                                <Play className="mr-2 h-4 w-4" /> {isArabic ? 'تشغيل الرواتب' : 'Run Payroll'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'تشغيل مسير الرواتب' : 'Run New Payroll'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold">
                                        <Users className="h-5 w-5" />
                                        {employees.length} {isArabic ? 'موظف نشط' : 'Active Employees'}
                                    </div>
                                    <p className="text-sm text-blue-600 mt-1">
                                        {isArabic ? 'إجمالي الرواتب الأساسية:' : 'Total Basic Salaries:'} {formatMoney(stats.totalSalaries)}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'بداية الفترة' : 'Period Start'} *</Label>
                                        <Input
                                            type="date"
                                            value={newPayroll.period_start}
                                            onChange={(e) => setNewPayroll({ ...newPayroll, period_start: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'نهاية الفترة' : 'Period End'} *</Label>
                                        <Input
                                            type="date"
                                            value={newPayroll.period_end}
                                            onChange={(e) => setNewPayroll({ ...newPayroll, period_end: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>{isArabic ? 'تاريخ الصرف' : 'Pay Date'}</Label>
                                        <Input
                                            type="date"
                                            value={newPayroll.pay_date}
                                            onChange={(e) => setNewPayroll({ ...newPayroll, pay_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                        <Textarea
                                            value={newPayroll.notes}
                                            onChange={(e) => setNewPayroll({ ...newPayroll, notes: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleCreatePayroll} className="bg-gradient-to-r from-green-600 to-emerald-600">
                                    <Calculator className="mr-2 h-4 w-4" /> {isArabic ? 'حساب الرواتب' : 'Calculate Payroll'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {isArabic ? 'الموظفين النشطين' : 'Active Employees'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.employeeCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">
                            {isArabic ? 'إجمالي الرواتب' : 'Total Salaries'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-blue-700">{formatMoney(stats.totalSalaries)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-amber-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {isArabic ? 'قيد المعالجة' : 'Pending'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{stats.pendingRuns}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <Banknote className="h-3 w-3" /> {isArabic ? 'إجمالي المدفوعات' : 'Total Paid'}
                        </CardDescription>
                        <CardTitle className="text-xl font-bold text-emerald-700">{formatMoney(stats.totalPaid)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-purple-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-purple-600">
                            {isArabic ? 'مسيرات الرواتب' : 'Payroll Runs'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-purple-700">{stats.totalRuns}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                    <TabsTrigger value="runs" className="flex gap-2">
                        <Wallet className="h-4 w-4" />
                        {isArabic ? 'مسيرات الرواتب' : 'Payroll Runs'}
                    </TabsTrigger>
                    <TabsTrigger value="components" className="flex gap-2">
                        <Calculator className="h-4 w-4" />
                        {isArabic ? 'مكونات الراتب' : 'Components'}
                    </TabsTrigger>
                </TabsList>

                {/* Payroll Runs Tab */}
                <TabsContent value="runs">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={isArabic ? 'بحث في الرواتب...' : 'Search payroll runs...'}
                                        className="pl-9 bg-white"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/20">
                                            <TableHead className="pl-6">{isArabic ? 'رقم المسير' : 'Payroll #'}</TableHead>
                                            <TableHead>{isArabic ? 'الفترة' : 'Period'}</TableHead>
                                            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead>{isArabic ? 'الموظفين' : 'Employees'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'الإجمالي' : 'Gross'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'الخصومات' : 'Deductions'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'الصافي' : 'Net'}</TableHead>
                                            <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-20">{dict.common.loading}</TableCell>
                                            </TableRow>
                                        ) : filteredPayrolls.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                                    {isArabic ? 'لا توجد مسيرات رواتب' : 'No payroll runs found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredPayrolls.map(payroll => {
                                            const statusInfo = statusConfig[payroll.status] || statusConfig.Draft
                                            const StatusIcon = statusInfo.icon
                                            return (
                                                <TableRow key={payroll.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-indigo-600">{payroll.payroll_code}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(payroll.created_at), 'MMM dd, yyyy')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-4 w-4 text-slate-400" />
                                                            {format(new Date(payroll.period_start), 'MMM dd')} - {format(new Date(payroll.period_end), 'MMM dd, yyyy')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${statusInfo.color} border-none gap-1`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4 text-slate-400" />
                                                            {payroll.employee_count}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">{formatMoney(payroll.total_gross)}</TableCell>
                                                    <TableCell className="text-right font-mono text-rose-600">-{formatMoney(payroll.total_deductions)}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-emerald-600">{formatMoney(payroll.total_net)}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>{isArabic ? 'العمليات' : 'Actions'}</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleViewPayroll(payroll)}>
                                                                    <Eye className="h-4 w-4 mr-2" /> {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuLabel className="text-xs text-muted-foreground">{isArabic ? 'تحديث الحالة' : 'Update Status'}</DropdownMenuLabel>
                                                                {payroll.status === 'Draft' && (
                                                                    <DropdownMenuItem onClick={() => handleUpdatePayrollStatus(payroll, 'Processing')}>
                                                                        <Clock className="h-4 w-4 mr-2" /> {isArabic ? 'قيد المعالجة' : 'Start Processing'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {(payroll.status === 'Draft' || payroll.status === 'Processing') && (
                                                                    <DropdownMenuItem onClick={() => handleUpdatePayrollStatus(payroll, 'Approved')}>
                                                                        <CheckCircle2 className="h-4 w-4 mr-2" /> {isArabic ? 'اعتماد' : 'Approve'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {payroll.status === 'Approved' && (
                                                                    <DropdownMenuItem onClick={() => handleUpdatePayrollStatus(payroll, 'Paid')} className="text-emerald-600 font-bold">
                                                                        <Banknote className="h-4 w-4 mr-2" /> {isArabic ? 'تأكيد الصرف' : 'Mark as Paid'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {payroll.status !== 'Paid' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDeletePayroll(payroll.id)}>
                                                                            <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
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

                {/* Salary Components Tab */}
                <TabsContent value="components">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{isArabic ? 'مكونات الراتب' : 'Salary Components'}</CardTitle>
                                <CardDescription>{isArabic ? 'البدلات والخصومات' : 'Earnings and deductions configuration'}</CardDescription>
                            </div>
                            <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> {isArabic ? 'مكون جديد' : 'New Component'}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{isArabic ? 'إضافة مكون راتب' : 'Add Salary Component'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الاسم' : 'Name'} *</Label>
                                            <Input
                                                value={newComponent.name}
                                                onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الرمز' : 'Code'} *</Label>
                                            <Input
                                                value={newComponent.code}
                                                onChange={(e) => setNewComponent({ ...newComponent, code: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'النوع' : 'Type'}</Label>
                                            <Select
                                                value={newComponent.component_type}
                                                onValueChange={(v) => setNewComponent({ ...newComponent, component_type: v as 'Earning' | 'Deduction' })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Earning">{isArabic ? 'بدل / إضافة' : 'Earning'}</SelectItem>
                                                    <SelectItem value="Deduction">{isArabic ? 'خصم' : 'Deduction'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'المبلغ الافتراضي' : 'Default Amount'}</Label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={newComponent.default_amount}
                                                onChange={(e) => setNewComponent({ ...newComponent, default_amount: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsComponentDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateComponent}>{isArabic ? 'إضافة' : 'Add'}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-2 gap-6 p-6">
                                {/* Earnings */}
                                <div>
                                    <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        {isArabic ? 'البدلات والإضافات' : 'Earnings'}
                                    </h3>
                                    <div className="space-y-2">
                                        {salaryComponents.filter(c => c.component_type === 'Earning').map(comp => (
                                            <div key={comp.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <div>
                                                    <span className="font-bold">{comp.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2 font-mono">({comp.code})</span>
                                                </div>
                                                <span className="font-mono text-emerald-700 font-bold">
                                                    +{formatMoney(comp.default_amount || 0)}
                                                </span>
                                            </div>
                                        ))}
                                        {salaryComponents.filter(c => c.component_type === 'Earning').length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">{isArabic ? 'لا توجد بدلات' : 'No earnings configured'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                    <h3 className="font-bold text-rose-700 mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 rotate-180" />
                                        {isArabic ? 'الخصومات' : 'Deductions'}
                                    </h3>
                                    <div className="space-y-2">
                                        {salaryComponents.filter(c => c.component_type === 'Deduction').map(comp => (
                                            <div key={comp.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                                                <div>
                                                    <span className="font-bold">{comp.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2 font-mono">({comp.code})</span>
                                                </div>
                                                <span className="font-mono text-rose-700 font-bold">
                                                    -{formatMoney(comp.default_amount || 0)}
                                                </span>
                                            </div>
                                        ))}
                                        {salaryComponents.filter(c => c.component_type === 'Deduction').length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">{isArabic ? 'لا توجد خصومات' : 'No deductions configured'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* View Payroll Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل مسير الرواتب' : 'Payroll Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedPayroll && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'رقم المسير' : 'Payroll #'}</span>
                                    <p className="font-bold text-indigo-600">{selectedPayroll.payroll_code}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'الفترة' : 'Period'}</span>
                                    <p className="font-bold">{format(new Date(selectedPayroll.period_start), 'MMM dd')} - {format(new Date(selectedPayroll.period_end), 'MMM dd')}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</span>
                                    <Badge className={`${statusConfig[selectedPayroll.status]?.color || ''} border-none mt-1`}>
                                        {statusConfig[selectedPayroll.status]?.label || selectedPayroll.status}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">{isArabic ? 'صافي المبلغ' : 'Net Amount'}</span>
                                    <p className="font-bold text-emerald-600">{formatMoney(selectedPayroll.total_net)}</p>
                                </div>
                            </div>

                            {/* Employee Items */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{isArabic ? 'الموظف' : 'Employee'}</TableHead>
                                        <TableHead>{isArabic ? 'المنصب' : 'Position'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الراتب الأساسي' : 'Basic Salary'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الإجمالي' : 'Total Earnings'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الخصومات' : 'Deductions'}</TableHead>
                                        <TableHead className="text-right">{isArabic ? 'الصافي' : 'Net Pay'}</TableHead>
                                        <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payrollItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <span className="font-bold">{item.employees?.profiles.full_name}</span>
                                                    <span className="text-xs text-muted-foreground block">{item.employees?.employee_code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.employees?.position}</TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(item.basic_salary)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatMoney(item.total_earnings)}</TableCell>
                                            <TableCell className="text-right font-mono text-rose-600">-{formatMoney(item.total_deductions)}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-emerald-600">{formatMoney(item.net_pay)}</TableCell>
                                            <TableCell>
                                                <Badge className={`${paymentStatusConfig[item.payment_status]?.color || ''} border-none`}>
                                                    {paymentStatusConfig[item.payment_status]?.label || item.payment_status}
                                                </Badge>
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
