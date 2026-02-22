"use client"

import * as React from "react"
import {
    Users,
    Plus,
    Search,
    MoreHorizontal,
    Download,
    Phone,
    Mail,
    Building2,
    DollarSign,
    Calendar,
    Target,
    TrendingUp,
    UserCheck,
    UserX,
    Eye,
    Edit,
    Trash2,
    ArrowRight,
    Star,
    Megaphone,
    Filter,
    BarChart3
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import Link from "next/link"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

export const runtime = 'edge';

interface Lead {
    id: string
    lead_number: string | null
    company_name: string | null
    contact_name: string
    email: string | null
    phone: string | null
    mobile: string | null
    source: string | null
    status: string
    priority: string
    estimated_value: number | null
    expected_close_date: string | null
    industry: string | null
    notes: string | null
    created_at: string
    profiles?: { full_name: string }
}

interface Opportunity {
    id: string
    opportunity_number: string | null
    name: string
    stage: string
    probability: number
    amount: number | null
    expected_close_date: string | null
    source: string | null
    notes: string | null
    created_at: string
    customers?: { name: string }
    profiles?: { full_name: string }
}

interface Campaign {
    id: string
    name: string
    campaign_code: string | null
    type: string | null
    status: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    actual_cost: number | null
    expected_revenue: number | null
    actual_revenue: number | null
    created_at: string
}



export default function CRMPage() {
    const { dict, locale } = useLanguage()
    const { formatMoney, currency } = useSettings()
    const isArabic = locale === 'ar'

    const getLeadStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            New: { color: 'bg-blue-100 text-blue-700', label: dict.common.new },
            Contacted: { color: 'bg-indigo-100 text-indigo-700', label: isArabic ? 'تم التواصل' : 'Contacted' },
            Qualified: { color: 'bg-purple-100 text-purple-700', label: isArabic ? 'مؤهل' : 'Qualified' },
            Proposal: { color: 'bg-amber-100 text-amber-700', label: dict.crm.proposal },
            Negotiation: { color: 'bg-orange-100 text-orange-700', label: dict.crm.negotiation },
            Won: { color: 'bg-emerald-100 text-emerald-700', label: dict.crm.closedWon },
            Lost: { color: 'bg-rose-100 text-rose-700', label: dict.crm.closedLost },
        }
        return configs[status] || { color: 'bg-slate-100 text-slate-700', label: status }
    }

    const getOpportunityStageConfig = (stage: string) => {
        const configs: Record<string, { color: string; label: string; probability: number }> = {
            Prospecting: { color: 'bg-slate-100 text-slate-700', label: dict.crm.prospecting, probability: 10 },
            Qualification: { color: 'bg-blue-100 text-blue-700', label: dict.crm.qualification, probability: 25 },
            Proposal: { color: 'bg-indigo-100 text-indigo-700', label: dict.crm.proposal, probability: 50 },
            Negotiation: { color: 'bg-amber-100 text-amber-700', label: dict.crm.negotiation, probability: 75 },
            ClosedWon: { color: 'bg-emerald-100 text-emerald-700', label: dict.crm.closedWon, probability: 100 },
            ClosedLost: { color: 'bg-rose-100 text-rose-700', label: dict.crm.closedLost, probability: 0 },
        }
        return configs[stage] || { color: 'bg-slate-100 text-slate-700', label: stage, probability: 0 }
    }

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            Low: { color: 'bg-slate-100 text-slate-600', label: dict.tasks.low },
            Medium: { color: 'bg-blue-100 text-blue-600', label: dict.tasks.medium },
            High: { color: 'bg-amber-100 text-amber-600', label: dict.tasks.high },
            Urgent: { color: 'bg-rose-100 text-rose-600', label: dict.tasks.urgent },
        }
        return configs[priority] || { color: 'bg-slate-100 text-slate-600', label: priority }
    }

    const [leads, setLeads] = React.useState<Lead[]>([])
    const [opportunities, setOpportunities] = React.useState<Opportunity[]>([])
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("leads")

    // Lead Dialog State
    const [isLeadDialogOpen, setIsLeadDialogOpen] = React.useState(false)
    const [newLead, setNewLead] = React.useState({
        contact_name: '',
        company_name: '',
        email: '',
        phone: '',
        mobile: '',
        source: 'Website',
        priority: 'Medium',
        estimated_value: 0,
        expected_close_date: '',
        industry: '',
        notes: ''
    })

    // Opportunity Dialog State
    const [isOpportunityDialogOpen, setIsOpportunityDialogOpen] = React.useState(false)
    const [newOpportunity, setNewOpportunity] = React.useState({
        name: '',
        stage: 'Prospecting',
        probability: 10,
        amount: 0,
        expected_close_date: '',
        source: '',
        notes: ''
    })

    // Campaign Dialog State
    const [isCampaignDialogOpen, setIsCampaignDialogOpen] = React.useState(false)
    const [newCampaign, setNewCampaign] = React.useState({
        name: '',
        type: 'Email',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        budget: 0,
        expected_revenue: 0,
        description: ''
    })

    const supabase = createClient()

    const generateNumber = (prefix: string) => {
        const timestamp = Date.now().toString().slice(-6)
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${prefix}-${timestamp}-${random}`
    }

    const fetchData = React.useCallback(async () => {
        setLoading(true)
        const [leadsRes, opportunitiesRes, campaignsRes] = await Promise.all([
            supabase.from('leads').select('*').order('created_at', { ascending: false }),
            supabase.from('opportunities').select('*, customers(name)').order('created_at', { ascending: false }),
            supabase.from('campaigns').select('*').order('created_at', { ascending: false })
        ])

        if (leadsRes.error) console.error("Leads fetch error:", leadsRes.error)
        if (opportunitiesRes.error) console.error("Opportunities fetch error:", opportunitiesRes.error)
        if (campaignsRes.error) console.error("Campaigns fetch error:", campaignsRes.error)

        if (!leadsRes.error) setLeads(leadsRes.data || [])
        if (!opportunitiesRes.error) setOpportunities(opportunitiesRes.data || [])
        if (!campaignsRes.error) setCampaigns(campaignsRes.data || [])
        setLoading(false)
    }, [supabase])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateLead = async () => {
        if (!newLead.contact_name) return alert(isArabic ? 'اسم جهة الاتصال مطلوب' : 'Contact name is required')

        const leadNumber = generateNumber('LEAD')
        const payload: any = {
            ...newLead,
            lead_number: leadNumber,
            status: 'New'
        }
        if (!payload.expected_close_date) delete payload.expected_close_date;
        if (!payload.estimated_value) payload.estimated_value = 0;

        const { error } = await supabase.from('leads').insert([payload])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsLeadDialogOpen(false)
            setNewLead({
                contact_name: '',
                company_name: '',
                email: '',
                phone: '',
                mobile: '',
                source: 'Website',
                priority: 'Medium',
                estimated_value: 0,
                expected_close_date: '',
                industry: '',
                notes: ''
            })
            fetchData()
        }
    }

    const handleCreateOpportunity = async () => {
        if (!newOpportunity.name) return alert(isArabic ? 'اسم الفرصة مطلوب' : 'Opportunity name is required')

        const opportunityNumber = generateNumber('OPP')
        const payload: any = {
            ...newOpportunity,
            opportunity_number: opportunityNumber
        }
        if (!payload.expected_close_date) delete payload.expected_close_date;
        if (!payload.amount) payload.amount = 0;

        const { error } = await supabase.from('opportunities').insert([payload])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsOpportunityDialogOpen(false)
            setNewOpportunity({
                name: '',
                stage: 'Prospecting',
                probability: 10,
                amount: 0,
                expected_close_date: '',
                source: '',
                notes: ''
            })
            fetchData()
        }
    }

    const handleCreateCampaign = async () => {
        if (!newCampaign.name) return alert(isArabic ? 'اسم الحملة مطلوب' : 'Campaign name is required')

        const campaignCode = generateNumber('CAMP')
        const payload: any = {
            ...newCampaign,
            campaign_code: campaignCode,
            status: 'Planning'
        }
        if (!payload.start_date) delete payload.start_date;
        if (!payload.end_date) delete payload.end_date;
        if (!payload.budget) payload.budget = 0;
        if (!payload.expected_revenue) payload.expected_revenue = 0;

        const { error } = await supabase.from('campaigns').insert([payload])

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setIsCampaignDialogOpen(false)
            setNewCampaign({
                name: '',
                type: 'Email',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: '',
                budget: 0,
                expected_revenue: 0,
                description: ''
            })
            fetchData()
        }
    }

    const handleUpdateLeadStatus = async (lead: Lead, newStatus: string) => {
        const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleUpdateOpportunityStage = async (opportunity: Opportunity, newStage: string) => {
        const probability = getOpportunityStageConfig(newStage)?.probability || 0
        const updates: Record<string, unknown> = { stage: newStage, probability }
        if (newStage === 'ClosedWon' || newStage === 'ClosedLost') {
            updates.actual_close_date = format(new Date(), 'yyyy-MM-dd')
        }

        const { error } = await supabase.from('opportunities').update(updates).eq('id', opportunity.id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeleteLead = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا العميل المحتمل؟' : 'Are you sure you want to delete this lead?')) return
        const { error } = await supabase.from('leads').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleDeleteOpportunity = async (id: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الفرصة؟' : 'Are you sure you want to delete this opportunity?')) return
        const { error } = await supabase.from('opportunities').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchData()
    }

    const handleConvertToCustomer = async (lead: Lead) => {
        // Create a customer from the lead
        const { data: customerData, error: customerError } = await supabase.from('customers').insert([{
            name: lead.company_name || lead.contact_name,
            contact_person: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            mobile: lead.mobile
        }]).select().single()

        if (customerError) {
            alert(customerError.message)
            return
        }

        // Update lead status to Won and link to customer
        await supabase.from('leads').update({
            status: 'Won',
            converted_to_customer_id: customerData.id
        }).eq('id', lead.id)

        fetchData()
        alert(isArabic ? 'تم تحويل العميل المحتمل بنجاح!' : 'Lead converted to customer successfully!')
    }

    // Drag and Drop Handlers for Kanban Board
    const [draggingOppId, setDraggingOppId] = React.useState<string | null>(null)

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingOppId(id)
        e.dataTransfer.setData('opp_id', id)
        // Add a slight transparency effect while dragging
        setTimeout(() => {
            const el = document.getElementById(`opp-card-${id}`)
            if (el) el.style.opacity = '0.5'
        }, 0)
    }

    const handleDragEnd = (e: React.DragEvent, id: string) => {
        setDraggingOppId(null)
        const el = document.getElementById(`opp-card-${id}`)
        if (el) el.style.opacity = '1'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault() // Necessary to allow dropping
    }

    const handleDrop = async (e: React.DragEvent, newStage: string) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('opp_id')
        if (!id) return

        const opp = opportunities.find(o => o.id === id)
        if (opp && opp.stage !== newStage) {
            // Optimistic Update for snappy UI
            setOpportunities(prev => prev.map(o => o.id === id ? { ...o, stage: newStage } : o))
            await handleUpdateOpportunityStage(opp, newStage)
        }
        setDraggingOppId(null)
    }

    const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost']

    const filteredLeads = leads.filter(l =>
        l.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredOpportunities = opportunities.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Stats calculations
    const leadStats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'New').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        won: leads.filter(l => l.status === 'Won').length,
        totalValue: leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
    }

    const opportunityStats = {
        total: opportunities.length,
        open: opportunities.filter(o => !['ClosedWon', 'ClosedLost'].includes(o.stage)).length,
        won: opportunities.filter(o => o.stage === 'ClosedWon').length,
        pipeline: opportunities.filter(o => !['ClosedWon', 'ClosedLost'].includes(o.stage)).reduce((sum, o) => sum + (o.amount || 0), 0),
        wonValue: opportunities.filter(o => o.stage === 'ClosedWon').reduce((sum, o) => sum + (o.amount || 0), 0)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {dict.crm.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic ? 'إدارة العملاء المحتملين والفرص والحملات التسويقية' : 'Manage leads, opportunities, and marketing campaigns'}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-blue-600">
                            {dict.crm.leads}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-blue-700">{leadStats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-emerald-600">
                            {dict.crm.wonLeads}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-700">{leadStats.won}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-violet-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-purple-600">
                            {dict.crm.openOpportunities}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-purple-700">{opportunityStats.open}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-amber-600">
                            {dict.crm.pipelineValue}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-amber-700">{formatMoney(opportunityStats.pipeline)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-rose-50 to-pink-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase text-rose-600">
                            {dict.crm.wonRevenue}
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-700">{formatMoney(opportunityStats.wonValue)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="leads" className="flex gap-2">
                            <Users className="h-4 w-4" />
                            {dict.crm.leads}
                        </TabsTrigger>
                        <TabsTrigger value="opportunities" className="flex gap-2">
                            <Target className="h-4 w-4" />
                            {dict.crm.opportunities}
                        </TabsTrigger>
                        <TabsTrigger value="campaigns" className="flex gap-2">
                            <Megaphone className="h-4 w-4" />
                            {dict.crm.campaigns}
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={dict.common.search + "..."}
                                className="pl-9"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {activeTab === 'leads' && (
                            <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                                        <Plus className="mr-2 h-4 w-4" /> {dict.crm.newLead}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>{dict.crm.newLead}</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>{dict.crm.contactName} *</Label>
                                            <Input
                                                value={newLead.contact_name}
                                                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.companyName}</Label>
                                            <Input
                                                value={newLead.company_name}
                                                onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.industry}</Label>
                                            <Input
                                                value={newLead.industry}
                                                onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.common.email}</Label>
                                            <Input
                                                type="email"
                                                value={newLead.email}
                                                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.common.phone}</Label>
                                            <Input
                                                value={newLead.phone}
                                                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.source}</Label>
                                            <Select
                                                value={newLead.source}
                                                onValueChange={(v) => setNewLead({ ...newLead, source: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Website">{dict.crm.leadSource.website}</SelectItem>
                                                    <SelectItem value="Referral">{dict.crm.leadSource.referral}</SelectItem>
                                                    <SelectItem value="SocialMedia">{dict.crm.leadSource.social}</SelectItem>
                                                    <SelectItem value="Exhibition">{dict.crm.exhibition}</SelectItem>
                                                    <SelectItem value="Advertising">{dict.crm.leadSource.advertising}</SelectItem>
                                                    <SelectItem value="ColdCall">{dict.crm.leadSource.coldCall}</SelectItem>
                                                    <SelectItem value="Other">{dict.crm.leadSource.other}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.common.status}</Label>
                                            <Select
                                                value={newLead.priority}
                                                onValueChange={(v) => setNewLead({ ...newLead, priority: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Low">{dict.tasks.low}</SelectItem>
                                                    <SelectItem value="Medium">{dict.tasks.medium}</SelectItem>
                                                    <SelectItem value="High">{dict.tasks.high}</SelectItem>
                                                    <SelectItem value="Urgent">{dict.tasks.urgent}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.estimatedValue}</Label>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={newLead.estimated_value}
                                                onChange={(e) => setNewLead({ ...newLead, estimated_value: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.expectedClose}</Label>
                                            <Input
                                                type="date"
                                                value={newLead.expected_close_date}
                                                onChange={(e) => setNewLead({ ...newLead, expected_close_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>{isArabic ? 'ملاحظات' : 'Notes'}</Label>
                                            <Textarea
                                                value={newLead.notes}
                                                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsLeadDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateLead}>{isArabic ? 'إضافة العميل المحتمل' : 'Add Lead'}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                        {activeTab === 'opportunities' && (
                            <Dialog open={isOpportunityDialogOpen} onOpenChange={setIsOpportunityDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                                        <Plus className="mr-2 h-4 w-4" /> {dict.crm.newOpp}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader><DialogTitle>{dict.crm.newOpp}</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>{isArabic ? 'عنوان الفرصة' : 'Opportunity Name'}</Label>
                                            <Input value={newOpportunity.name} onChange={e => setNewOpportunity({ ...newOpportunity, name: e.target.value })} placeholder={isArabic ? 'مثال: نظام الطاقة المتجددة' : 'e.g. Solar Power System'} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'المرحلة' : 'Stage'}</Label>
                                            <Select
                                                value={newOpportunity.stage}
                                                onValueChange={(v) => setNewOpportunity({
                                                    ...newOpportunity,
                                                    stage: v,
                                                    probability: getOpportunityStageConfig(v)?.probability || 0
                                                })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Prospecting">{dict.crm.prospecting}</SelectItem>
                                                    <SelectItem value="Qualification">{dict.crm.qualification}</SelectItem>
                                                    <SelectItem value="Proposal">{dict.crm.proposal}</SelectItem>
                                                    <SelectItem value="Negotiation">{dict.crm.negotiation}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الاحتمالية %' : 'Probability %'}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={newOpportunity.probability}
                                                onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.estimatedValue} ({currency})</Label>
                                            <Input type="number" value={newOpportunity.amount} onChange={e => setNewOpportunity({ ...newOpportunity, amount: Number(e.target.value) })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{dict.crm.expectedClose}</Label>
                                            <Input type="date" value={newOpportunity.expected_close_date} onChange={e => setNewOpportunity({ ...newOpportunity, expected_close_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsOpportunityDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateOpportunity} className="bg-slate-900 text-white font-bold">{dict.crm.newOpp}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                        {activeTab === 'campaigns' && (
                            <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg">
                                        <Plus className="mr-2 h-4 w-4" /> {dict.crm.newCamp}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl">
                                    <DialogHeader><DialogTitle>{dict.crm.newCamp}</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label>{isArabic ? 'اسم الحملة' : 'Campaign Name'}</Label>
                                            <Input value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder={isArabic ? 'مثال: عرض الصيف 2024' : 'e.g. Summer Sale 2024'} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'النوع' : 'Type'}</Label>
                                            <Select
                                                value={newCampaign.type}
                                                onValueChange={(v) => setNewCampaign({ ...newCampaign, type: v })}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Email">{isArabic ? 'بريد إلكتروني' : 'Email'}</SelectItem>
                                                    <SelectItem value="Social">{dict.crm.leadSource.social}</SelectItem>
                                                    <SelectItem value="Event">{isArabic ? 'فعالية' : 'Event'}</SelectItem>
                                                    <SelectItem value="Webinar">{isArabic ? 'ندوة عبر الويب' : 'Webinar'}</SelectItem>
                                                    <SelectItem value="Print">{isArabic ? 'مطبوعات' : 'Print'}</SelectItem>
                                                    <SelectItem value="Other">{dict.crm.leadSource.other}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الميزانية' : 'Budget'} ({currency})</Label>
                                            <Input type="number" value={newCampaign.budget} onChange={e => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>{dict.common.cancel}</Button>
                                        <Button onClick={handleCreateCampaign} className="bg-slate-900 text-white font-bold">{dict.crm.newCamp}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Leads Tab */}
                <TabsContent value="leads">
                    <Card className="border-none shadow-xl bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/20">
                                            <TableHead className="pl-6">{isArabic ? 'جهة الاتصال' : 'Contact'}</TableHead>
                                            <TableHead>{isArabic ? 'الشركة' : 'Company'}</TableHead>
                                            <TableHead>{isArabic ? 'المصدر' : 'Source'}</TableHead>
                                            <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                                            <TableHead>{isArabic ? 'الأولوية' : 'Priority'}</TableHead>
                                            <TableHead className="text-right">{isArabic ? 'القيمة' : 'Value'}</TableHead>
                                            <TableHead className="text-right pr-6">{dict.common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-20">{dict.common.loading}</TableCell>
                                            </TableRow>
                                        ) : filteredLeads.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                                                    {isArabic ? 'لا يوجد عملاء محتملين' : 'No leads found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredLeads.map(lead => (
                                            <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{lead.contact_name}</span>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {lead.company_name && (
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="h-4 w-4 text-slate-400" />
                                                            {lead.company_name}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{lead.source || '-'}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getLeadStatusConfig(lead.status)?.color || ''} border-none`}>
                                                        {getLeadStatusConfig(lead.status)?.label || lead.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${getPriorityConfig(lead.priority)?.color || ''} border-none`}>
                                                        {getPriorityConfig(lead.priority)?.label || lead.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    {lead.estimated_value ? formatMoney(lead.estimated_value) : '-'}
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
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel className="text-xs text-muted-foreground">{isArabic ? 'تحديث الحالة' : 'Update Status'}</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead, 'Contacted')}>
                                                                {isArabic ? 'تم التواصل' : 'Contacted'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead, 'Qualified')}>
                                                                {isArabic ? 'مؤهل' : 'Qualified'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead, 'Proposal')}>
                                                                {isArabic ? 'عرض سعر' : 'Proposal'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {lead.status !== 'Won' && (
                                                                <DropdownMenuItem onClick={() => handleConvertToCustomer(lead)} className="text-emerald-600 font-bold">
                                                                    <UserCheck className="h-4 w-4 mr-2" /> {isArabic ? 'تحويل لعميل' : 'Convert to Customer'}
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead, 'Lost')} className="text-rose-600">
                                                                <UserX className="h-4 w-4 mr-2" /> {isArabic ? 'خسارة' : 'Mark as Lost'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteLead(lead.id)}>
                                                                <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                            </DropdownMenuItem>
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
                </TabsContent>

                {/* Opportunities Tab - KANBAN BOARD */}
                <TabsContent value="opportunities">
                    {loading ? (
                        <Card className="border-none shadow-md">
                            <CardContent className="py-20 text-center text-muted-foreground">
                                {dict.common.loading}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 print-area" style={{ minHeight: '600px' }}>
                            {STAGES.map(stage => {
                                const stageOpps = filteredOpportunities.filter(o => o.stage === stage)
                                const stageConfig = getOpportunityStageConfig(stage)
                                const totalValue = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0)

                                return (
                                    <div
                                        key={stage}
                                        className="shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60 overflow-hidden"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, stage)}
                                    >
                                        {/* Column Header */}
                                        <div className={`p-3 border-b border-slate-200/60 flex items-center justify-between bg-white ${stageConfig.color.replace('text-', 'border-t-4 border-')}`}>
                                            <div>
                                                <h3 className="font-bold text-sm">{stageConfig.label}</h3>
                                                <p className="text-xs text-muted-foreground">{formatMoney(totalValue)} • {stageOpps.length} deals</p>
                                            </div>
                                            <Badge variant="outline" className="bg-slate-50">{stageConfig.probability}%</Badge>
                                        </div>

                                        {/* Column Body / Cards Container */}
                                        <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                                            {stageOpps.map(opp => (
                                                <div
                                                    key={opp.id}
                                                    id={`opp-card-${opp.id}`}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, opp.id)}
                                                    onDragEnd={(e) => handleDragEnd(e, opp.id)}
                                                    className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:-translate-y-1 relative group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-mono text-slate-400">{opp.opportunity_number}</span>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem className="text-rose-600" onClick={() => handleDeleteOpportunity(opp.id)}>
                                                                    <Trash2 className="h-4 w-4 mr-2" /> {dict.common.delete}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <h4 className="font-bold text-slate-800 leading-tight mb-1">{opp.name}</h4>

                                                    {opp.customers?.name && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                                                            <Building2 className="h-3 w-3" /> {opp.customers.name}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                                                        <span className="font-bold text-sm text-indigo-700">{opp.amount ? formatMoney(opp.amount) : '-'}</span>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400" title="Expected Close">
                                                            <Calendar className="h-3 w-3" />
                                                            {opp.expected_close_date ? format(new Date(opp.expected_close_date), 'MMM dd') : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {stageOpps.length === 0 && (
                                                <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                                                    {isArabic ? 'اسحب الفرص هنا' : 'Drop opportunities here'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Campaigns Tab */}
                <TabsContent value="campaigns">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            <Card className="col-span-full border-none shadow-md">
                                <CardContent className="py-20 text-center text-muted-foreground">
                                    {dict.common.loading}
                                </CardContent>
                            </Card>
                        ) : campaigns.length === 0 ? (
                            <Card className="col-span-full border-none shadow-md">
                                <CardContent className="py-20 text-center text-muted-foreground">
                                    {isArabic ? 'لا توجد حملات' : 'No campaigns found'}
                                </CardContent>
                            </Card>
                        ) : campaigns.map(campaign => (
                            <Card key={campaign.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono">{campaign.campaign_code}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className={
                                            campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                                campaign.status === 'Planning' ? 'bg-blue-50 text-blue-700' :
                                                    campaign.status === 'Completed' ? 'bg-slate-50 text-slate-700' :
                                                        'bg-amber-50 text-amber-700'
                                        }>
                                            {campaign.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Megaphone className="h-4 w-4" />
                                        <span>{campaign.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {campaign.start_date ? format(new Date(campaign.start_date), 'MMM dd') : '-'}
                                            {' → '}
                                            {campaign.end_date ? format(new Date(campaign.end_date), 'MMM dd, yyyy') : '-'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                        <div>
                                            <span className="text-xs text-muted-foreground">{isArabic ? 'الميزانية' : 'Budget'}</span>
                                            <p className="font-bold">{campaign.budget ? formatMoney(campaign.budget) : '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">{isArabic ? 'التكلفة الفعلية' : 'Actual Cost'}</span>
                                            <p className="font-bold">{campaign.actual_cost ? formatMoney(campaign.actual_cost) : '-'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
