"use client"

import * as React from "react"
import {
    CreditCard,
    DollarSign,
    Download,
    Plus,
    TrendingDown,
    TrendingUp,
    Receipt,
    ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const recentTransactions = [
    {
        id: "TX-101",
        date: "2024-01-24",
        description: "Material Purchase - Modern Office",
        category: "Materials",
        amount: -2450.00,
        status: "Cleared",
    },
    {
        id: "TX-102",
        date: "2024-01-23",
        description: "Client Payment - TechCorp",
        category: "Income",
        amount: 12500.00,
        status: "Processing",
    },
    {
        id: "TX-103",
        date: "2024-01-22",
        description: "Monthly Rent - Office A",
        category: "Rent",
        amount: -1200.00,
        status: "Cleared",
    },
    {
        id: "TX-104",
        date: "2024-01-21",
        description: "Service Fee - HVAC Mall",
        category: "Service",
        amount: 850.00,
        status: "Cleared",
    },
]

export const runtime = 'edge';

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
                    <p className="text-muted-foreground text-sm">
                        Monitor cash flow, manage invoices, and track business expenses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Report
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Transaction
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-slate-950 text-slate-50 border-none shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">$124,560.20</div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            +12% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,200.00</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            24 invoices paid
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,840.50</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            18 bills cleared
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Latest financial activity across all projects.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs">
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-sm text-muted-foreground">{tx.date}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.description}</div>
                                            <div className="text-xs text-muted-foreground">{tx.category}</div>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tx.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common accounting tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1">
                        <Button variant="outline" className="w-full justify-start py-6 text-sm group" asChild>
                            <a href="#">
                                <Receipt className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <div className="font-semibold">Create New Invoice</div>
                                    <div className="text-xs text-muted-foreground">Bill a client for services or stock</div>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                            </a>
                        </Button>
                        <Button variant="outline" className="w-full justify-start py-6 text-sm group" asChild>
                            <a href="#">
                                <CreditCard className="mr-3 h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <div className="font-semibold">Record Expense</div>
                                    <div className="text-xs text-muted-foreground">Log a business cost or material buy</div>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                            </a>
                        </Button>
                        <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Pending Invoices
                            </h4>
                            <p className="text-xs text-orange-700 mt-1">
                                You have 3 invoices overdue from last week totaling <strong>$4,200</strong>.
                            </p>
                            <Button size="sm" className="mt-3 bg-orange-600 hover:bg-orange-700 text-xs h-8">
                                Remind Clients
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
