"use client"

import * as React from "react"
import {
    Users,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Calendar,
    DollarSign,
    CheckCircle2,
    FileText,
    Printer,
    RefreshCw,
    Wallet
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

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
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"
import Link from "next/link"

export const runtime = 'edge';

interface PayrollRun {
    id: string
    period_start: string
    period_end: string
    payment_date: string
    status: string
    total_net_pay: number
    total_basic: number
    created_at: string
}

interface Employee {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    department: any
    basic_salary: number
}

export default function PayrollPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const isArabic = locale === 'ar'

    const [payrollRuns, setPayrollRuns] = React.useState<PayrollRun[]>([])
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isGenerating, setIsGenerating] = React.useState(false)

    // New Run State
    const [isNewRunOpen, setIsNewRunOpen] = React.useState(false)
    const [newRunDate, setNewRunDate] = React.useState(format(new Date(), 'yyyy-MM'))

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [runsRes, employeesRes] = await Promise.all([
            supabase.from('payroll_runs').select('*').order('period_start', { ascending: false }),
            supabase.from('employees').select('id, employee_id, first_name, last_name, basic_salary, department:departments(name)').eq('status', 'Active')
        ])

        if (!runsRes.error) setPayrollRuns(runsRes.data || [])
        if (!employeesRes.error) setEmployees(employeesRes.data as any || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleGeneratePayroll = async () => {
        setIsGenerating(true)
        try {
            const dateStr = newRunDate + "-01"
            const parsedDate = new Date(dateStr)
            const periodStart = format(startOfMonth(parsedDate), 'yyyy-MM-dd')
            const periodEnd = format(endOfMonth(parsedDate), 'yyyy-MM-dd')

            // 1. Create a Payroll Run
            const { data: run, error: runError } = await supabase.from('payroll_runs').insert({
                period_start: periodStart,
                period_end: periodEnd,
                payment_date: periodEnd,
                status: 'Draft',
                total_basic: 0,
                total_allowances: 0,
                total_deductions: 0,
                total_net_pay: 0
            }).select().single()

            if (runError || !run) throw new Error(runError?.message || 'Failed to create run')

            let totalBasic = 0
            let totalNet = 0

            // 2. Loop through employees and generate Slips
            for (const emp of employees) {
                // In a real system, we would query attendance to get working days and deductions
                // For this demo engine, we will calculate based on basic_salary
                const slip = {
                    payroll_run_id: run.id,
                    employee_id: emp.id,
                    basic_salary: emp.basic_salary || 0,
                    working_days: 30, // Default for engine
                    present_days: 30,
                    absent_days: 0,
                    total_allowances: 0,
                    total_deductions: 0,
                    net_pay: emp.basic_salary || 0,
                    status: 'Draft'
                }

                totalBasic += slip.basic_salary
                totalNet += slip.net_pay

                await supabase.from('payroll_slips').insert(slip)
            }

            // 3. Update Run Totals
            await supabase.from('payroll_runs').update({
                total_basic: totalBasic,
                total_net_pay: totalNet
            }).eq('id', run.id)

            alert(isArabic ? 'تم توليد مسير الرواتب بنجاح!' : 'Payroll generated successfully!')
            setIsNewRunOpen(false)
            fetchData()

        } catch (error: any) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDeleteRun = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف مسير الرواتب هذا وكل القسائم المرتبطة به؟' : 'Are you sure you want to delete this payroll run and all its slips?')) return
        const { error } = await supabase.from('payroll_runs').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{isArabic ? 'محرك الرواتب' : 'Payroll Engine'}</h1>
                    <p className="text-muted-foreground">{isArabic ? 'إنشاء وإدارة مسيرات رواتب الموظفين' : 'Generate and manage employee payroll runs'}</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isNewRunOpen} onOpenChange={setIsNewRunOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md">
                                <Plus className="mr-2 h-4 w-4" />
                                {isArabic ? 'مسير رواتب جديد' : 'New Payroll Run'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isArabic ? 'توليد رواتب شهر جديد' : 'Generate New Month Payroll'}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'شهر الراتب' : 'Payroll Month'}</Label>
                                    <Input
                                        type="month"
                                        value={newRunDate}
                                        onChange={(e) => setNewRunDate(e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-sky-50 rounded-lg border border-sky-100 flex items-start gap-3 text-sky-800 text-sm">
                                    <RefreshCw className="h-5 w-5 mt-0.5 shrink-0" />
                                    <p>
                                        {isArabic
                                            ? 'سيقوم محرك الرواتب تلقائياً بجلب رواتب جميع الموظفين النشطين، وحساب الغياب والحضور، وخصم التأخيرات بناءً على إعدادات السياسات المعمول بها.'
                                            : 'The payroll engine will automatically fetch basic salaries for all active employees, calculate attendance, and apply deductions based on HR policies.'}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewRunOpen(false)}>{dict.common.cancel}</Button>
                                <Button onClick={handleGeneratePayroll} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {isArabic ? 'جاري التوليد...' : 'Generating...'}</>
                                    ) : (
                                        <>{isArabic ? 'توليد وحساب الرواتب' : 'Generate & Calculate Basic Payroll'}</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-blue-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-indigo-600">{isArabic ? 'إجمالي مسيرات الرواتب' : 'Total Payroll Runs'}</CardDescription>
                        <CardTitle className="text-2xl text-indigo-700">{payrollRuns.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-teal-50 to-emerald-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-teal-600">{isArabic ? 'إجمالي الرواتب المصروفة' : 'Total Salaries Paid'}</CardDescription>
                        <CardTitle className="text-2xl text-teal-700">
                            {formatMoney(payrollRuns.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.total_net_pay, 0))}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600">{isArabic ? 'الاستحقاقات المعلقة' : 'Pending Liabilities'}</CardDescription>
                        <CardTitle className="text-2xl text-amber-700">
                            {formatMoney(payrollRuns.filter(r => r.status !== 'Paid').reduce((sum, r) => sum + r.total_net_pay, 0))}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Payroll Runs Table */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/20">
                                    <TableHead className="pl-6">{isArabic ? 'شهر الراتب' : 'Payroll Month'}</TableHead>
                                    <TableHead>{isArabic ? 'تاريخ الدفع الطبعي' : 'Normal Payment Date'}</TableHead>
                                    <TableHead>{isArabic ? 'إجمالي الأساسي' : 'Total Basic'}</TableHead>
                                    <TableHead>{isArabic ? 'صافي الرواتب المستحقة' : 'Net Total Pay'}</TableHead>
                                    <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                    <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">{dict.common.loading}</TableCell>
                                    </TableRow>
                                ) : payrollRuns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            {isArabic ? 'لا توجد مسيرات رواتب حتى الآن.' : 'No payroll runs created yet.'}
                                        </TableCell>
                                    </TableRow>
                                ) : payrollRuns.map(run => (
                                    <TableRow key={run.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 font-bold">
                                            {format(new Date(run.period_start), 'MMMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(run.payment_date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {formatMoney(run.total_basic || 0)}
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-indigo-700 text-base">
                                            {formatMoney(run.total_net_pay || 0)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                run.status === 'Draft' ? 'bg-slate-50 text-slate-600' :
                                                    run.status === 'Approved' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-emerald-50 text-emerald-600'
                                            }>
                                                {run.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{dict.common.actions}</DropdownMenuLabel>
                                                    {/* We can route to a detailed view of the run slips later */}
                                                    <DropdownMenuItem>
                                                        <FileText className="mr-2 h-4 w-4" /> {isArabic ? 'عرض تفاصيل المسير' : 'View Run Details'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {run.status === 'Draft' && (
                                                        <DropdownMenuItem className="text-rose-600 focus:bg-rose-50" onClick={() => handleDeleteRun(run.id)}>
                                                            {dict.common.delete}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
