"use client"

import * as React from "react"
import {
    FileText,
    Settings,
    Palette,
    Building2,
    Receipt,
    FileSpreadsheet,
    Package,
    CreditCard,
    ShoppingCart,
    Eye,
    Save,
    ChevronRight
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { TemplateEditor } from "@/lib/templates/TemplateEditor"
import {
    DocumentTemplate,
    CompanyBranding,
    templateTypeLabels,
    getDefaultTemplates
} from "@/lib/templates/documentTemplates"

export const runtime = 'edge';

interface TemplateType {
    type: DocumentTemplate['type']
    icon: React.ElementType
    description: string
    descriptionAr: string
}

const templateTypes: TemplateType[] = [
    {
        type: 'invoice',
        icon: Receipt,
        description: 'Customer invoices and tax invoices',
        descriptionAr: 'فواتير العملاء والفواتير الضريبية'
    },
    {
        type: 'quote',
        icon: FileSpreadsheet,
        description: 'Quotations and price offers',
        descriptionAr: 'عروض الأسعار'
    },
    {
        type: 'purchase_order',
        icon: ShoppingCart,
        description: 'Purchase orders for vendors',
        descriptionAr: 'أوامر الشراء للموردين'
    },
    {
        type: 'delivery_note',
        icon: Package,
        description: 'Delivery notes and packing slips',
        descriptionAr: 'إذن تسليم وقسائم التعبئة'
    },
    {
        type: 'credit_note',
        icon: CreditCard,
        description: 'Credit notes and refunds',
        descriptionAr: 'إشعارات الدائن والمرتجعات'
    }
]

export default function DocumentTemplatesPage() {
    const { dict, locale } = useLanguage()
    const isArabic = locale === 'ar'
    const supabase = createClient()

    const [selectedType, setSelectedType] = React.useState<DocumentTemplate['type'] | null>(null)
    const [savedTemplates, setSavedTemplates] = React.useState<Map<string, DocumentTemplate>>(new Map())
    const [savedBranding, setSavedBranding] = React.useState<CompanyBranding | null>(null)
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle')

    // Load saved templates and branding from local storage or database
    React.useEffect(() => {
        const loadSavedData = async () => {
            try {
                // Try to load from local storage first
                const storedTemplates = localStorage.getItem('orbit_document_templates')
                const storedBranding = localStorage.getItem('orbit_company_branding')

                if (storedTemplates) {
                    const parsed = JSON.parse(storedTemplates)
                    const map = new Map(Object.entries(parsed))
                    setSavedTemplates(map as Map<string, DocumentTemplate>)
                }

                if (storedBranding) {
                    setSavedBranding(JSON.parse(storedBranding))
                }
            } catch (error) {
                console.error('Error loading saved templates:', error)
            }
        }

        loadSavedData()
    }, [])

    // Save template
    const handleSaveTemplate = async (template: DocumentTemplate, branding: CompanyBranding) => {
        setSaveStatus('saving')

        try {
            // Save to state
            const updatedTemplates = new Map(savedTemplates)
            updatedTemplates.set(template.type, { ...template, updatedAt: new Date().toISOString() })
            setSavedTemplates(updatedTemplates)
            setSavedBranding(branding)

            // Save to local storage
            const templateObj = Object.fromEntries(updatedTemplates)
            localStorage.setItem('orbit_document_templates', JSON.stringify(templateObj))
            localStorage.setItem('orbit_company_branding', JSON.stringify(branding))

            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            console.error('Error saving template:', error)
            setSaveStatus('idle')
            alert(isArabic ? 'فشل في حفظ القالب' : 'Failed to save template')
        }
    }

    // Get saved template or default
    const getTemplateForType = (type: DocumentTemplate['type']): DocumentTemplate | undefined => {
        return savedTemplates.get(type) || getDefaultTemplates().find(t => t.type === type)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{dict.templates.title}</h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic
                            ? 'تخصيص مظهر ومحتوى المستندات المطبوعة لمؤسستك'
                            : 'Customize the appearance and content of your printed documents'
                        }
                    </p>
                </div>
                {saveStatus === 'saved' && (
                    <Badge className="bg-emerald-100 text-emerald-700 gap-1 animate-in slide-in-from-right">
                        <Save className="h-3 w-3" />
                        {isArabic ? 'تم الحفظ' : 'Saved'}
                    </Badge>
                )}
            </div>

            {/* Main Content */}
            {!selectedType ? (
                <div className="grid gap-6">
                    {/* Company Branding Card */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-50 to-blue-50/50 overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>{isArabic ? 'هوية الشركة' : 'Company Branding'}</CardTitle>
                                    <CardDescription>
                                        {isArabic
                                            ? 'الشعار، الألوان، ومعلومات الشركة المستخدمة في جميع المستندات'
                                            : 'Logo, colors, and company info used across all documents'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border">
                                <div className="flex items-center gap-4">
                                    {savedBranding?.logoUrl ? (
                                        <img src={savedBranding.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg border" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                            O
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold">{savedBranding?.companyName || 'Orbit Foundation'}</p>
                                        <p className="text-sm text-muted-foreground">{savedBranding?.email || 'info@orbit.erp'}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setSelectedType('invoice')}
                                >
                                    <Settings className="h-4 w-4" />
                                    {isArabic ? 'تعديل' : 'Edit'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Template Types Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templateTypes.map((template) => {
                            const Icon = template.icon
                            const saved = savedTemplates.has(template.type)
                            const label = templateTypeLabels[template.type]

                            return (
                                <Card
                                    key={template.type}
                                    className="border-none shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                                    onClick={() => setSelectedType(template.type)}
                                >
                                    <CardContent className="p-0">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                                                    <Icon className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                {saved && (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                                        {isArabic ? 'مخصص' : 'Customized'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                                {isArabic ? label.ar : label.en}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? template.descriptionAr : template.description}
                                            </p>
                                        </div>
                                        <div className="px-5 py-3 bg-slate-50 border-t flex items-center justify-between group-hover:bg-blue-50 transition-colors">
                                            <span className="text-sm font-medium text-muted-foreground group-hover:text-blue-600">
                                                {isArabic ? 'تخصيص القالب' : 'Customize Template'}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Preview Section */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600">
                                    <Eye className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{isArabic ? 'معاينة سريعة' : 'Quick Preview'}</CardTitle>
                                    <CardDescription>
                                        {isArabic
                                            ? 'انقر على أي قالب أعلاه لتخصيصه ومعاينته'
                                            : 'Click any template above to customize and preview it'
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['invoice', 'quote', 'purchase_order', 'delivery_note'].map((type) => (
                                    <div
                                        key={type}
                                        className="aspect-[3/4] rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:from-blue-50 hover:to-indigo-50 transition-all"
                                        onClick={() => setSelectedType(type as DocumentTemplate['type'])}
                                    >
                                        <div className="text-center text-sm text-muted-foreground">
                                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            {isArabic
                                                ? templateTypeLabels[type as DocumentTemplate['type']].ar
                                                : templateTypeLabels[type as DocumentTemplate['type']].en
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedType(null)}
                        className="gap-2 mb-4 no-print"
                    >
                        ← {isArabic ? 'العودة إلى القوالب' : 'Back to Templates'}
                    </Button>

                    {/* Template Editor */}
                    <TemplateEditor
                        templateType={selectedType}
                        initialTemplate={getTemplateForType(selectedType)}
                        initialBranding={savedBranding || undefined}
                        onSave={handleSaveTemplate}
                    />
                </div>
            )}
        </div>
    )
}
