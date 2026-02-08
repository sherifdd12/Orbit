"use client"

import * as React from "react"
import {
    FileSearch,
    Search,
    Download,
    Filter,
    Calendar,
    User,
    Database,
    Edit,
    Plus,
    Trash2,
    Eye,
    Shield,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Activity,
    LayoutGrid,
    List
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, subDays } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export const runtime = 'edge';

interface AuditLog {
    id: string
    table_name: string
    record_id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PRINT' | 'VIEW'
    old_values: Record<string, unknown> | null
    new_values: Record<string, unknown> | null
    changed_fields: string[] | null
    user_id: string | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
    profiles?: { full_name: string; email: string }
}

const actionConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    INSERT: { color: 'bg-emerald-100 text-emerald-700', icon: Plus, label: 'Create' },
    UPDATE: { color: 'bg-blue-100 text-blue-700', icon: Edit, label: 'Update' },
    DELETE: { color: 'bg-rose-100 text-rose-700', icon: Trash2, label: 'Delete' },
    LOGIN: { color: 'bg-indigo-100 text-indigo-700', icon: User, label: 'Login' },
    LOGOUT: { color: 'bg-slate-100 text-slate-600', icon: User, label: 'Logout' },
    EXPORT: { color: 'bg-amber-100 text-amber-700', icon: Download, label: 'Export' },
    PRINT: { color: 'bg-purple-100 text-purple-700', icon: Eye, label: 'Print' },
    VIEW: { color: 'bg-cyan-100 text-cyan-700', icon: Eye, label: 'View' },
}

const tableNameLabels: Record<string, string> = {
    profiles: 'Users',
    customers: 'Customers',
    vendors: 'Vendors',
    items: 'Items',
    sale_orders: 'Sales Orders',
    purchase_orders: 'Purchase Orders',
    invoices: 'Invoices',
    payments: 'Payments',
    journal_entries: 'Journal Entries',
    employees: 'Employees',
    projects: 'Projects',
    shipments: 'Shipments',
    leads: 'Leads',
    opportunities: 'Opportunities',
    fixed_assets: 'Fixed Assets',
    payroll_runs: 'Payroll',
    bank_reconciliations: 'Bank Reconciliation',
}

export default function AuditLogsPage() {
    const { dict, locale } = useLanguage()
    const isArabic = locale === 'ar'

    const [logs, setLogs] = React.useState<AuditLog[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [filterAction, setFilterAction] = React.useState("all")
    const [filterTable, setFilterTable] = React.useState("all")
    const [filterDateRange, setFilterDateRange] = React.useState("7")
    const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false)
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = React.useState<'table' | 'timeline'>('table')

    const supabase = createClient()

    const fetchLogs = React.useCallback(async () => {
        setLoading(true)

        let query = supabase
            .from('audit_logs')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false })
            .limit(500)

        // Apply date filter
        const daysAgo = parseInt(filterDateRange)
        if (daysAgo > 0) {
            const startDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
            query = query.gte('created_at', startDate)
        }

        // Apply action filter
        if (filterAction !== 'all') {
            query = query.eq('action', filterAction)
        }

        // Apply table filter
        if (filterTable !== 'all') {
            query = query.eq('table_name', filterTable)
        }

        const { data, error } = await query

        if (!error) setLogs(data || [])
        setLoading(false)
    }, [supabase, filterAction, filterTable, filterDateRange])

    React.useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const handleExport = () => {
        const headers = ["Timestamp", "User", "Action", "Module", "Record ID", "Changed Fields", "IP Address"]
        const data = logs.map(log => [
            format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
            log.profiles?.full_name || 'System',
            log.action,
            tableNameLabels[log.table_name] || log.table_name,
            log.record_id,
            log.changed_fields?.join(', ') || '-',
            log.ip_address || '-'
        ])
        const csvContent = [headers.join(","), ...data.map(r => r.map(c => `"${c}"`).join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`
        a.click()
    }

    const toggleRowExpand = (id: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    const filteredLogs = logs.filter(log =>
        log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Get unique tables for filter
    const uniqueTables = [...new Set(logs.map(l => l.table_name))].sort()

    // Stats
    const stats = {
        total: logs.length,
        inserts: logs.filter(l => l.action === 'INSERT').length,
        updates: logs.filter(l => l.action === 'UPDATE').length,
        deletes: logs.filter(l => l.action === 'DELETE').length,
        logins: logs.filter(l => l.action === 'LOGIN').length,
    }

    // Group logs by date for timeline view
    const logsByDate = filteredLogs.reduce((acc, log) => {
        const date = format(new Date(log.created_at), 'yyyy-MM-dd')
        if (!acc[date]) acc[date] = []
        acc[date].push(log)
        return acc
    }, {} as Record<string, AuditLog[]>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="h-8 w-8 text-indigo-600" />
                        {isArabic ? 'سجل التدقيق' : 'Audit Logs'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'تتبع جميع الإجراءات والتغييرات في النظام' : 'Track all actions and changes in the system'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="rounded-none"
                            onClick={() => setViewMode('table')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="rounded-none"
                            onClick={() => setViewMode('timeline')}
                        >
                            <Activity className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> {dict.common.export}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> {isArabic ? 'إجمالي السجلات' : 'Total Logs'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                            <Plus className="h-3 w-3" /> {isArabic ? 'إنشاء' : 'Creates'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{stats.inserts}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
                            <Edit className="h-3 w-3" /> {isArabic ? 'تحديثات' : 'Updates'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-700">{stats.updates}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-rose-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600 flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> {isArabic ? 'حذف' : 'Deletes'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{stats.deletes}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-indigo-600 flex items-center gap-1">
                            <User className="h-3 w-3" /> {isArabic ? 'تسجيل دخول' : 'Logins'}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-indigo-700">{stats.logins}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={isArabic ? 'بحث في السجلات...' : 'Search logs...'}
                                className="pl-9 bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                                <SelectTrigger className="w-[140px] bg-white">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{isArabic ? 'آخر يوم' : 'Last 24h'}</SelectItem>
                                    <SelectItem value="7">{isArabic ? 'آخر أسبوع' : 'Last 7 days'}</SelectItem>
                                    <SelectItem value="30">{isArabic ? 'آخر شهر' : 'Last 30 days'}</SelectItem>
                                    <SelectItem value="90">{isArabic ? 'آخر 3 أشهر' : 'Last 90 days'}</SelectItem>
                                    <SelectItem value="0">{isArabic ? 'الكل' : 'All time'}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger className="w-[130px] bg-white">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الإجراءات' : 'All Actions'}</SelectItem>
                                    <SelectItem value="INSERT">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                    <SelectItem value="LOGIN">Login</SelectItem>
                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterTable} onValueChange={setFilterTable}>
                                <SelectTrigger className="w-[150px] bg-white">
                                    <Database className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{isArabic ? 'كل الجداول' : 'All Tables'}</SelectItem>
                                    {uniqueTables.map(table => (
                                        <SelectItem key={table} value={table}>
                                            {tableNameLabels[table] || table}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/20">
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead className="pl-6">{isArabic ? 'الوقت' : 'Timestamp'}</TableHead>
                                        <TableHead>{isArabic ? 'المستخدم' : 'User'}</TableHead>
                                        <TableHead>{isArabic ? 'الإجراء' : 'Action'}</TableHead>
                                        <TableHead>{isArabic ? 'الوحدة' : 'Module'}</TableHead>
                                        <TableHead>{isArabic ? 'معرف السجل' : 'Record ID'}</TableHead>
                                        <TableHead>{isArabic ? 'التغييرات' : 'Changes'}</TableHead>
                                        <TableHead>{isArabic ? 'العنوان IP' : 'IP Address'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-20">{dict.common.loading}</TableCell>
                                        </TableRow>
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                                {isArabic ? 'لا توجد سجلات' : 'No audit logs found'}
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLogs.map(log => {
                                        const actionInfo = actionConfig[log.action] || actionConfig.VIEW
                                        const ActionIcon = actionInfo.icon
                                        const isExpanded = expandedRows.has(log.id)

                                        return (
                                            <React.Fragment key={log.id}>
                                                <TableRow className="group hover:bg-slate-50/50 transition-colors">
                                                    <TableCell>
                                                        {(log.old_values || log.new_values) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={() => toggleRowExpand(log.id)}
                                                            >
                                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="pl-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-sm">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                                                            <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'MMM dd, yyyy')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <User className="h-4 w-4 text-indigo-600" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{log.profiles?.full_name || 'System'}</span>
                                                                {log.profiles?.email && (
                                                                    <span className="text-xs text-muted-foreground">{log.profiles.email}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${actionInfo.color} border-none gap-1`}>
                                                            <ActionIcon className="h-3 w-3" />
                                                            {actionInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono">
                                                            <Database className="h-3 w-3 mr-1" />
                                                            {tableNameLabels[log.table_name] || log.table_name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                            {log.record_id.slice(0, 8)}...
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.changed_fields && log.changed_fields.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {log.changed_fields.slice(0, 3).map(field => (
                                                                    <Badge key={field} variant="secondary" className="text-xs">
                                                                        {field}
                                                                    </Badge>
                                                                ))}
                                                                {log.changed_fields.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{log.changed_fields.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {log.ip_address || '-'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && (log.old_values || log.new_values) && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="bg-slate-50/50 p-4">
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                {log.old_values && (
                                                                    <div>
                                                                        <h4 className="font-bold text-sm mb-2 text-rose-600">{isArabic ? 'القيم السابقة' : 'Old Values'}</h4>
                                                                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                                                            {JSON.stringify(log.old_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {log.new_values && (
                                                                    <div>
                                                                        <h4 className="font-bold text-sm mb-2 text-emerald-600">{isArabic ? 'القيم الجديدة' : 'New Values'}</h4>
                                                                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                                                            {JSON.stringify(log.new_values, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        // Timeline View
                        <div className="p-6">
                            {Object.entries(logsByDate).map(([date, dayLogs]) => (
                                <div key={date} className="mb-8">
                                    <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                                        <Badge variant="outline" className="ml-2">{dayLogs.length}</Badge>
                                    </h3>
                                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-4">
                                        {dayLogs.map(log => {
                                            const actionInfo = actionConfig[log.action] || actionConfig.VIEW
                                            const ActionIcon = actionInfo.icon
                                            return (
                                                <div key={log.id} className="relative">
                                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full ${actionInfo.color} flex items-center justify-center`}>
                                                        <ActionIcon className="h-2.5 w-2.5" />
                                                    </div>
                                                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                        <User className="h-5 w-5 text-indigo-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold">{log.profiles?.full_name || 'System'}</p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            <Badge className={`${actionInfo.color} border-none mr-2`}>{actionInfo.label}</Badge>
                                                                            {tableNameLabels[log.table_name] || log.table_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                    {format(new Date(log.created_at), 'HH:mm:ss')}
                                                                </span>
                                                            </div>
                                                            {log.changed_fields && log.changed_fields.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t">
                                                                    <span className="text-xs text-muted-foreground">{isArabic ? 'الحقول المتغيرة:' : 'Changed fields:'}</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {log.changed_fields.map(field => (
                                                                            <Badge key={field} variant="secondary" className="text-xs">{field}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(logsByDate).length === 0 && !loading && (
                                <div className="text-center py-20 text-muted-foreground">
                                    {isArabic ? 'لا توجد سجلات' : 'No audit logs found'}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isArabic ? 'تفاصيل السجل' : 'Audit Log Details'}</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'الوقت' : 'Timestamp'}</Label>
                                    <p className="font-mono">{format(new Date(selectedLog.created_at), 'yyyy-MM-dd HH:mm:ss')}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'المستخدم' : 'User'}</Label>
                                    <p>{selectedLog.profiles?.full_name || 'System'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'الإجراء' : 'Action'}</Label>
                                    <Badge className={`${actionConfig[selectedLog.action]?.color || ''} border-none`}>
                                        {actionConfig[selectedLog.action]?.label || selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'الجدول' : 'Table'}</Label>
                                    <p>{tableNameLabels[selectedLog.table_name] || selectedLog.table_name}</p>
                                </div>
                            </div>
                            {selectedLog.old_values && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'القيم السابقة' : 'Old Values'}</Label>
                                    <ScrollArea className="h-48 border rounded p-3 mt-1">
                                        <pre className="text-xs">{JSON.stringify(selectedLog.old_values, null, 2)}</pre>
                                    </ScrollArea>
                                </div>
                            )}
                            {selectedLog.new_values && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">{isArabic ? 'القيم الجديدة' : 'New Values'}</Label>
                                    <ScrollArea className="h-48 border rounded p-3 mt-1">
                                        <pre className="text-xs">{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>{dict.common.close}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
