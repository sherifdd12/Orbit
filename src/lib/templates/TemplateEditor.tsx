"use client"

import * as React from "react"
import {
    DocumentTemplate,
    CompanyBranding,
    defaultBranding,
    defaultInvoiceTemplate,
    defaultQuoteTemplate,
    defaultPurchaseOrderTemplate,
    defaultDeliveryNoteTemplate,
    templateTypeLabels
} from "./documentTemplates"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Save,
    Eye,
    Upload,
    Palette,
    FileText,
    Building2,
    Settings2,
    Languages,
    Printer
} from "lucide-react"
import { PrintableDocument } from "./PrintableDocument"

interface TemplateEditorProps {
    templateType: DocumentTemplate['type']
    onSave?: (template: DocumentTemplate, branding: CompanyBranding) => void
    initialTemplate?: DocumentTemplate
    initialBranding?: CompanyBranding
}

// Sample data for preview
const sampleInvoiceData = {
    documentNumber: 'INV-2024-0001',
    documentDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customer: {
        name: 'Al Mulla Group',
        nameAr: 'مجموعة الملا',
        address: '123 Commercial St, Kuwait City',
        addressAr: 'شارع التجارة 123، مدينة الكويت',
        taxNumber: '123456789',
        phone: '+965 1234 5678',
        email: 'accounts@almulla.com'
    },
    items: [
        { no: 1, description: 'Professional Services - January', descriptionAr: 'خدمات مهنية - يناير', quantity: 10, unit: 'Hours', unitAr: 'ساعة', unitPrice: 50, total: 500, discount: 0 },
        { no: 2, description: 'Software License - Annual', descriptionAr: 'ترخيص برمجيات - سنوي', quantity: 1, unit: 'License', unitAr: 'رخصة', unitPrice: 1200, total: 1200, discount: 0 },
        { no: 3, description: 'Technical Support Package', descriptionAr: 'حزمة الدعم الفني', quantity: 12, unit: 'Months', unitAr: 'شهر', unitPrice: 100, total: 1200, discount: 0 },
    ],
    subtotal: 2900,
    discount: 145,
    discountPercent: 5,
    taxRate: 0,
    taxAmount: 0,
    grandTotal: 2755,
    notes: 'Thank you for your business!',
    notesAr: 'شكراً لتعاملكم معنا!',
    paymentInfo: {
        bankName: 'Kuwait Finance House',
        accountName: 'Orbit Foundation',
        iban: 'KW91CBKU0000000000001234560101',
        swift: 'CBKUKWKW'
    },
    reference: 'PO-2024-001',
    salesperson: 'Ahmed Ali'
}

export function TemplateEditor({
    templateType,
    onSave,
    initialTemplate,
    initialBranding
}: TemplateEditorProps) {
    const { dict, locale } = useLanguage()
    const isArabic = locale === 'ar'

    // Default template based on type
    const getDefaultTemplate = () => {
        switch (templateType) {
            case 'invoice': return defaultInvoiceTemplate
            case 'quote': return defaultQuoteTemplate
            case 'purchase_order': return defaultPurchaseOrderTemplate
            case 'delivery_note': return defaultDeliveryNoteTemplate
            default: return defaultInvoiceTemplate
        }
    }

    const [template, setTemplate] = React.useState<DocumentTemplate>(initialTemplate || getDefaultTemplate())
    const [branding, setBranding] = React.useState<CompanyBranding>(initialBranding || defaultBranding)
    const [showPreview, setShowPreview] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('branding')

    const handleBrandingChange = (field: keyof CompanyBranding, value: string) => {
        setBranding(prev => ({ ...prev, [field]: value }))
    }

    const handleTemplateChange = (field: keyof DocumentTemplate, value: any) => {
        setTemplate(prev => ({ ...prev, [field]: value }))
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleBrandingChange('logoUrl', reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = () => {
        if (onSave) {
            onSave(template, branding)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        {isArabic ? 'تخصيص قالب ' : 'Customize '}
                        {isArabic ? templateTypeLabels[templateType].ar : templateTypeLabels[templateType].en}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isArabic
                            ? 'تخصيص مظهر ومحتوى المستندات المطبوعة الخاصة بك'
                            : 'Customize the appearance and content of your printed documents'
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? (isArabic ? 'إخفاء المعاينة' : 'Hide Preview') : (isArabic ? 'معاينة' : 'Preview')}
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="no-print">
                        <Printer className="h-4 w-4 mr-2" />
                        {isArabic ? 'طباعة' : 'Print'}
                    </Button>
                    <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        <Save className="h-4 w-4 mr-2" />
                        {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Editor Panel */}
                <Card className="no-print">
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="w-full grid grid-cols-4 mb-6">
                                <TabsTrigger value="branding" className="gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">{isArabic ? 'الهوية' : 'Branding'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="colors" className="gap-2">
                                    <Palette className="h-4 w-4" />
                                    <span className="hidden sm:inline">{isArabic ? 'الألوان' : 'Colors'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="content" className="gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="hidden sm:inline">{isArabic ? 'المحتوى' : 'Content'}</span>
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="gap-2">
                                    <Settings2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">{isArabic ? 'الإعدادات' : 'Settings'}</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Branding Tab */}
                            <TabsContent value="branding" className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label>{isArabic ? 'شعار الشركة' : 'Company Logo'}</Label>
                                        <div className="flex items-center gap-4 mt-2">
                                            {branding.logoUrl ? (
                                                <img src={branding.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <Upload className="h-6 w-6" />
                                                </div>
                                            )}
                                            <div>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="w-auto"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {isArabic ? 'PNG أو JPG، حجم أقصى 2MB' : 'PNG or JPG, max 2MB'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}</Label>
                                            <Input
                                                value={branding.companyName}
                                                onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                                                placeholder="Orbit Foundation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}</Label>
                                            <Input
                                                value={branding.companyNameAr}
                                                onChange={(e) => handleBrandingChange('companyNameAr', e.target.value)}
                                                placeholder="مؤسسة أوربت"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الشعار النصي (إنجليزي)' : 'Tagline (English)'}</Label>
                                            <Input
                                                value={branding.tagline}
                                                onChange={(e) => handleBrandingChange('tagline', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الشعار النصي (عربي)' : 'Tagline (Arabic)'}</Label>
                                            <Input
                                                value={branding.taglineAr}
                                                onChange={(e) => handleBrandingChange('taglineAr', e.target.value)}
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'العنوان (إنجليزي)' : 'Address (English)'}</Label>
                                            <Textarea
                                                value={branding.address}
                                                onChange={(e) => handleBrandingChange('address', e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'العنوان (عربي)' : 'Address (Arabic)'}</Label>
                                            <Textarea
                                                value={branding.addressAr}
                                                onChange={(e) => handleBrandingChange('addressAr', e.target.value)}
                                                rows={2}
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الهاتف' : 'Phone'}</Label>
                                            <Input
                                                value={branding.phone}
                                                onChange={(e) => handleBrandingChange('phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                                            <Input
                                                value={branding.email}
                                                onChange={(e) => handleBrandingChange('email', e.target.value)}
                                                type="email"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الموقع الإلكتروني' : 'Website'}</Label>
                                            <Input
                                                value={branding.website}
                                                onChange={(e) => handleBrandingChange('website', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'الرقم الضريبي' : 'Tax Number'}</Label>
                                            <Input
                                                value={branding.taxNumber}
                                                onChange={(e) => handleBrandingChange('taxNumber', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'السجل التجاري' : 'CR Number'}</Label>
                                            <Input
                                                value={branding.crNumber}
                                                onChange={(e) => handleBrandingChange('crNumber', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Colors Tab */}
                            <TabsContent value="colors" className="space-y-4">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'اللون الرئيسي' : 'Primary Color'}</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={branding.primaryColor}
                                                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                                                className="h-10 w-20 rounded cursor-pointer"
                                            />
                                            <Input
                                                value={branding.primaryColor}
                                                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'اللون الثانوي' : 'Secondary Color'}</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={branding.secondaryColor}
                                                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                                                className="h-10 w-20 rounded cursor-pointer"
                                            />
                                            <Input
                                                value={branding.secondaryColor}
                                                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'لون التأكيد' : 'Accent Color'}</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={branding.accentColor}
                                                onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                                                className="h-10 w-20 rounded cursor-pointer"
                                            />
                                            <Input
                                                value={branding.accentColor}
                                                onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Color Preview */}
                                <Card className="mt-6">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">{isArabic ? 'معاينة الألوان' : 'Color Preview'}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4">
                                            <div
                                                className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: branding.primaryColor }}
                                            >
                                                {isArabic ? 'رئيسي' : 'Primary'}
                                            </div>
                                            <div
                                                className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: branding.secondaryColor }}
                                            >
                                                {isArabic ? 'ثانوي' : 'Secondary'}
                                            </div>
                                            <div
                                                className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: branding.accentColor }}
                                            >
                                                {isArabic ? 'تأكيد' : 'Accent'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Content Tab */}
                            <TabsContent value="content" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الشروط والأحكام (إنجليزي)' : 'Terms & Conditions (English)'}</Label>
                                        <Textarea
                                            value={template.termsAndConditions}
                                            onChange={(e) => handleTemplateChange('termsAndConditions', e.target.value)}
                                            rows={6}
                                            placeholder="1. Payment is due within 30 days..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الشروط والأحكام (عربي)' : 'Terms & Conditions (Arabic)'}</Label>
                                        <Textarea
                                            value={template.termsAndConditionsAr}
                                            onChange={(e) => handleTemplateChange('termsAndConditionsAr', e.target.value)}
                                            rows={6}
                                            dir="rtl"
                                            placeholder="1. الدفع مستحق خلال 30 يومًا..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold">{isArabic ? 'إعدادات التوقيع' : 'Signature Settings'}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <Label>{isArabic ? 'عرض خط التوقيع' : 'Show Signature Line'}</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic ? 'إظهار خط التوقيع في المستند' : 'Display signature line on document'}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={template.signature.showSignatureLine}
                                                onCheckedChange={(checked) => handleTemplateChange('signature', { ...template.signature, showSignatureLine: checked })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <Label>{isArabic ? 'عرض مكان الختم' : 'Show Stamp Area'}</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic ? 'إظهار مكان الختم الرسمي' : 'Display official stamp area'}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={template.signature.showStampArea}
                                                onCheckedChange={(checked) => handleTemplateChange('signature', { ...template.signature, showStampArea: checked })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'تسمية التوقيع (إنجليزي)' : 'Signature Label (English)'}</Label>
                                            <Input
                                                value={template.signature.signatureLabel}
                                                onChange={(e) => handleTemplateChange('signature', { ...template.signature, signatureLabel: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isArabic ? 'تسمية التوقيع (عربي)' : 'Signature Label (Arabic)'}</Label>
                                            <Input
                                                value={template.signature.signatureLabelAr}
                                                onChange={(e) => handleTemplateChange('signature', { ...template.signature, signatureLabelAr: e.target.value })}
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Settings Tab */}
                            <TabsContent value="settings" className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'حجم الورق' : 'Paper Size'}</Label>
                                        <Select
                                            value={template.paperSize}
                                            onValueChange={(val) => handleTemplateChange('paperSize', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                                                <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                                                <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'الاتجاه' : 'Orientation'}</Label>
                                        <Select
                                            value={template.orientation}
                                            onValueChange={(val) => handleTemplateChange('orientation', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="portrait">{isArabic ? 'عمودي' : 'Portrait'}</SelectItem>
                                                <SelectItem value="landscape">{isArabic ? 'أفقي' : 'Landscape'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'اللغة الرئيسية' : 'Primary Language'}</Label>
                                        <Select
                                            value={template.primaryLanguage}
                                            onValueChange={(val: 'en' | 'ar') => handleTemplateChange('primaryLanguage', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="ar">العربية</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <Label>{isArabic ? 'عرض اللغتين' : 'Show Dual Language'}</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {isArabic ? 'عرض المحتوى باللغتين' : 'Show content in both languages'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={template.showDualLanguage}
                                            onCheckedChange={(checked) => handleTemplateChange('showDualLanguage', checked)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'تنسيق التاريخ' : 'Date Format'}</Label>
                                        <Select
                                            value={template.dateFormat}
                                            onValueChange={(val) => handleTemplateChange('dateFormat', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                                                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isArabic ? 'موضع العملة' : 'Currency Position'}</Label>
                                        <Select
                                            value={template.currencyPosition}
                                            onValueChange={(val: 'before' | 'after') => handleTemplateChange('currencyPosition', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="before">{isArabic ? 'قبل المبلغ' : 'Before Amount'} (KWD 100)</SelectItem>
                                                <SelectItem value="after">{isArabic ? 'بعد المبلغ' : 'After Amount'} (100 KWD)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label>{isArabic ? 'العلامة المائية' : 'Watermark'}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'عرض علامة مائية على المستند' : 'Show watermark on document'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            value={template.watermarkText}
                                            onChange={(e) => handleTemplateChange('watermarkText', e.target.value)}
                                            placeholder="PAID / DRAFT"
                                            className="w-32"
                                            disabled={!template.showWatermark}
                                        />
                                        <Switch
                                            checked={template.showWatermark}
                                            onCheckedChange={(checked) => handleTemplateChange('showWatermark', checked)}
                                        />
                                    </div>
                                </div>

                                {/* Margins */}
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الهوامش (مم)' : 'Margins (mm)'}</Label>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">{isArabic ? 'أعلى' : 'Top'}</Label>
                                            <Input
                                                type="number"
                                                value={template.margins.top}
                                                onChange={(e) => handleTemplateChange('margins', { ...template.margins, top: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{isArabic ? 'يمين' : 'Right'}</Label>
                                            <Input
                                                type="number"
                                                value={template.margins.right}
                                                onChange={(e) => handleTemplateChange('margins', { ...template.margins, right: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{isArabic ? 'أسفل' : 'Bottom'}</Label>
                                            <Input
                                                type="number"
                                                value={template.margins.bottom}
                                                onChange={(e) => handleTemplateChange('margins', { ...template.margins, bottom: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{isArabic ? 'يسار' : 'Left'}</Label>
                                            <Input
                                                type="number"
                                                value={template.margins.left}
                                                onChange={(e) => handleTemplateChange('margins', { ...template.margins, left: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                {showPreview && (
                    <Card className="overflow-auto max-h-[800px] print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none">
                        <CardHeader className="no-print">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                {isArabic ? 'معاينة المستند' : 'Document Preview'}
                            </CardTitle>
                            <CardDescription>
                                {isArabic ? 'هذه معاينة حية للقالب الخاص بك' : 'This is a live preview of your template'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="border rounded-lg shadow-lg scale-[0.6] origin-top-left" style={{ width: '167%' }}>
                                <PrintableDocument
                                    template={{ ...template, branding }}
                                    data={sampleInvoiceData}
                                    companyBranding={branding}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
