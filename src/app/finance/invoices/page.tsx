"use client"

import * as React from "react"
import {
    Plus
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const runtime = 'edge';

interface Invoice {
    id: string
    invoice_number: string
    customer_name: string
    project_title: string
    amount: number
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
    due_date: string
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [newInvoice, setNewInvoice] = React.useState({
        customer_id: '',
        project_id: '',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0]
    })

    const [customers, setCustomers] = React.useState<{ id: string; name: string }[]>([])
    const [projects, setProjects] = React.useState<{ id: string; title: string }[]>([])

    const supabase = createClient()

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const { data: inv } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
        const { data: cust } = await supabase.from('customers').select('id, name')
        const { data: proj } = await supabase.from('projects').select('id, title')

        if (inv) setInvoices(inv)
        if (cust) setCustomers(cust)
        if (proj) setProjects(proj)
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreate = async () => {
        const { error } = await supabase.from('invoices').insert([{
            ...newInvoice,
            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
            status: 'Draft'
        }])
        if (error) alert(error.message)
        else { setIsCreateOpen(false); fetchData() }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Billing & Invoicing</h2>
                    <p className="text-muted-foreground">Manage client billing and revenue tracking.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <select className="w-full border rounded p-2" value={newInvoice.customer_id} onChange={e => setNewInvoice({ ...newInvoice, customer_id: e.target.value })}>
                                    <option value="">Select Customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <select className="w-full border rounded p-2" value={newInvoice.project_id} onChange={e => setNewInvoice({ ...newInvoice, project_id: e.target.value })}>
                                    <option value="">Select Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2"><Label>Amount</Label><Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })} /></div>
                            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={newInvoice.due_date} onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })} /></div>
                        </div>
                        <DialogFooter><Button onClick={handleCreate}>Create Draft</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow> : invoices.map(inv => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-mono font-bold">{inv.invoice_number}</TableCell>
                                    <TableCell>{inv.customer_name || 'Walk-in'}</TableCell>
                                    <TableCell><Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'}>{inv.status}</Badge></TableCell>
                                    <TableCell className="text-right font-bold">${inv.amount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
