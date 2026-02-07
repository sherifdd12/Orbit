// Orbit ERP: Customizable Document Templates System
// Supports bilingual (AR/EN), custom branding, and flexible layouts

export interface CompanyBranding {
    logoUrl: string | null
    companyName: string
    companyNameAr: string
    tagline: string
    taglineAr: string
    address: string
    addressAr: string
    phone: string
    email: string
    website: string
    taxNumber: string
    crNumber: string // Commercial Registration
    primaryColor: string
    secondaryColor: string
    accentColor: string
}

export interface DocumentField {
    id: string
    label: string
    labelAr: string
    type: 'text' | 'number' | 'date' | 'currency' | 'image' | 'qrcode' | 'barcode'
    value: string
    position: { x: number; y: number }
    fontSize: number
    fontWeight: 'normal' | 'bold'
    visible: boolean
    width?: number
}

export interface DocumentSection {
    id: string
    name: string
    nameAr: string
    type: 'header' | 'footer' | 'body' | 'items' | 'totals' | 'terms' | 'signature' | 'custom'
    visible: boolean
    fields: DocumentField[]
    style: {
        backgroundColor?: string
        borderColor?: string
        padding?: number
        marginTop?: number
        marginBottom?: number
    }
}

export interface DocumentTemplate {
    id: string
    name: string
    nameAr: string
    type: 'invoice' | 'quote' | 'sales_order' | 'purchase_order' | 'bill' | 'receipt' | 'delivery_note' | 'credit_note'
    paperSize: 'A4' | 'Letter' | 'A5'
    orientation: 'portrait' | 'landscape'
    margins: {
        top: number
        right: number
        bottom: number
        left: number
    }
    branding: CompanyBranding
    sections: DocumentSection[]
    showWatermark: boolean
    watermarkText: string
    showDualLanguage: boolean
    primaryLanguage: 'en' | 'ar'
    dateFormat: string
    numberFormat: string
    currencyPosition: 'before' | 'after'
    termsAndConditions: string
    termsAndConditionsAr: string
    notes: string
    notesAr: string
    signature: {
        showSignatureLine: boolean
        signatureLabel: string
        signatureLabelAr: string
        showStampArea: boolean
    }
    createdAt: string
    updatedAt: string
    isDefault: boolean
}

// Default branding template
export const defaultBranding: CompanyBranding = {
    logoUrl: null,
    companyName: 'Orbit Foundation',
    companyNameAr: 'مؤسسة أوربت',
    tagline: 'Enterprise Resource Planning',
    taglineAr: 'نظام تخطيط موارد المؤسسات',
    address: 'Kuwait City, Kuwait',
    addressAr: 'مدينة الكويت، الكويت',
    phone: '+965 XXXX XXXX',
    email: 'info@orbit.erp',
    website: 'www.orbit.erp',
    taxNumber: '',
    crNumber: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#10b981'
}

// Invoice Template
export const defaultInvoiceTemplate: DocumentTemplate = {
    id: 'invoice-default',
    name: 'Standard Invoice',
    nameAr: 'فاتورة قياسية',
    type: 'invoice',
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    branding: defaultBranding,
    showWatermark: false,
    watermarkText: 'PAID',
    showDualLanguage: true,
    primaryLanguage: 'en',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: '#,##0.000',
    currencyPosition: 'after',
    sections: [
        {
            id: 'header',
            name: 'Header',
            nameAr: 'الترويسة',
            type: 'header',
            visible: true,
            fields: [
                { id: 'logo', label: 'Company Logo', labelAr: 'شعار الشركة', type: 'image', value: '', position: { x: 0, y: 0 }, fontSize: 12, fontWeight: 'normal', visible: true },
                { id: 'company_name', label: 'Company Name', labelAr: 'اسم الشركة', type: 'text', value: '', position: { x: 0, y: 50 }, fontSize: 24, fontWeight: 'bold', visible: true },
                { id: 'invoice_title', label: 'Invoice', labelAr: 'فاتورة', type: 'text', value: 'INVOICE', position: { x: 400, y: 0 }, fontSize: 32, fontWeight: 'bold', visible: true },
                { id: 'invoice_number', label: 'Invoice #', labelAr: 'رقم الفاتورة', type: 'text', value: '', position: { x: 400, y: 40 }, fontSize: 14, fontWeight: 'bold', visible: true },
                { id: 'invoice_date', label: 'Date', labelAr: 'التاريخ', type: 'date', value: '', position: { x: 400, y: 60 }, fontSize: 12, fontWeight: 'normal', visible: true },
                { id: 'due_date', label: 'Due Date', labelAr: 'تاريخ الاستحقاق', type: 'date', value: '', position: { x: 400, y: 80 }, fontSize: 12, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', padding: 20, marginBottom: 20 }
        },
        {
            id: 'customer_info',
            name: 'Customer Information',
            nameAr: 'معلومات العميل',
            type: 'body',
            visible: true,
            fields: [
                { id: 'bill_to', label: 'Bill To', labelAr: 'فاتورة إلى', type: 'text', value: 'Bill To:', position: { x: 0, y: 0 }, fontSize: 12, fontWeight: 'bold', visible: true },
                { id: 'customer_name', label: 'Customer Name', labelAr: 'اسم العميل', type: 'text', value: '', position: { x: 0, y: 20 }, fontSize: 14, fontWeight: 'bold', visible: true },
                { id: 'customer_address', label: 'Address', labelAr: 'العنوان', type: 'text', value: '', position: { x: 0, y: 40 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'customer_tax', label: 'Tax ID', labelAr: 'الرقم الضريبي', type: 'text', value: '', position: { x: 0, y: 60 }, fontSize: 11, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', padding: 15, marginBottom: 20 }
        },
        {
            id: 'items',
            name: 'Line Items',
            nameAr: 'البنود',
            type: 'items',
            visible: true,
            fields: [
                { id: 'item_no', label: '#', labelAr: '#', type: 'text', value: '', position: { x: 0, y: 0 }, fontSize: 11, fontWeight: 'bold', visible: true, width: 30 },
                { id: 'item_description', label: 'Description', labelAr: 'الوصف', type: 'text', value: '', position: { x: 30, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true, width: 250 },
                { id: 'item_qty', label: 'Qty', labelAr: 'الكمية', type: 'number', value: '', position: { x: 280, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true, width: 60 },
                { id: 'item_unit', label: 'Unit', labelAr: 'الوحدة', type: 'text', value: '', position: { x: 340, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true, width: 50 },
                { id: 'item_price', label: 'Unit Price', labelAr: 'سعر الوحدة', type: 'currency', value: '', position: { x: 390, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true, width: 80 },
                { id: 'item_total', label: 'Total', labelAr: 'الإجمالي', type: 'currency', value: '', position: { x: 470, y: 0 }, fontSize: 11, fontWeight: 'bold', visible: true, width: 80 },
            ],
            style: { backgroundColor: '#ffffff', borderColor: '#d1d5db', padding: 10, marginBottom: 20 }
        },
        {
            id: 'totals',
            name: 'Totals',
            nameAr: 'الإجماليات',
            type: 'totals',
            visible: true,
            fields: [
                { id: 'subtotal', label: 'Subtotal', labelAr: 'المجموع الفرعي', type: 'currency', value: '', position: { x: 350, y: 0 }, fontSize: 12, fontWeight: 'normal', visible: true },
                { id: 'discount', label: 'Discount', labelAr: 'الخصم', type: 'currency', value: '', position: { x: 350, y: 20 }, fontSize: 12, fontWeight: 'normal', visible: true },
                { id: 'tax', label: 'Tax', labelAr: 'الضريبة', type: 'currency', value: '', position: { x: 350, y: 40 }, fontSize: 12, fontWeight: 'normal', visible: true },
                { id: 'grand_total', label: 'Grand Total', labelAr: 'الإجمالي الكلي', type: 'currency', value: '', position: { x: 350, y: 70 }, fontSize: 16, fontWeight: 'bold', visible: true },
                { id: 'amount_in_words', label: 'Amount in Words', labelAr: 'المبلغ بالحروف', type: 'text', value: '', position: { x: 0, y: 100 }, fontSize: 11, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', padding: 15, marginBottom: 20 }
        },
        {
            id: 'payment_info',
            name: 'Payment Information',
            nameAr: 'معلومات الدفع',
            type: 'custom',
            visible: true,
            fields: [
                { id: 'bank_name', label: 'Bank Name', labelAr: 'اسم البنك', type: 'text', value: '', position: { x: 0, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'account_name', label: 'Account Name', labelAr: 'اسم الحساب', type: 'text', value: '', position: { x: 0, y: 15 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'iban', label: 'IBAN', labelAr: 'رقم الآيبان', type: 'text', value: '', position: { x: 0, y: 30 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'swift', label: 'SWIFT', labelAr: 'رمز السويفت', type: 'text', value: '', position: { x: 0, y: 45 }, fontSize: 11, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#fefce8', borderColor: '#fde047', padding: 15, marginBottom: 20 }
        },
        {
            id: 'terms',
            name: 'Terms & Conditions',
            nameAr: 'الشروط والأحكام',
            type: 'terms',
            visible: true,
            fields: [
                { id: 'terms_title', label: 'Terms & Conditions', labelAr: 'الشروط والأحكام', type: 'text', value: 'Terms & Conditions:', position: { x: 0, y: 0 }, fontSize: 11, fontWeight: 'bold', visible: true },
                { id: 'terms_content', label: 'Terms Content', labelAr: 'محتوى الشروط', type: 'text', value: '', position: { x: 0, y: 15 }, fontSize: 9, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', padding: 10, marginBottom: 15 }
        },
        {
            id: 'signature',
            name: 'Signature',
            nameAr: 'التوقيع',
            type: 'signature',
            visible: true,
            fields: [
                { id: 'authorized_signature', label: 'Authorized Signature', labelAr: 'التوقيع المعتمد', type: 'text', value: '', position: { x: 0, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'stamp_area', label: 'Official Stamp', labelAr: 'الختم الرسمي', type: 'text', value: '', position: { x: 300, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#ffffff', borderColor: '#e5e7eb', padding: 20, marginTop: 30 }
        },
        {
            id: 'footer',
            name: 'Footer',
            nameAr: 'التذييل',
            type: 'footer',
            visible: true,
            fields: [
                { id: 'company_info', label: 'Company Info', labelAr: 'معلومات الشركة', type: 'text', value: '', position: { x: 0, y: 0 }, fontSize: 9, fontWeight: 'normal', visible: true },
                { id: 'page_number', label: 'Page', labelAr: 'صفحة', type: 'text', value: '', position: { x: 450, y: 0 }, fontSize: 9, fontWeight: 'normal', visible: true },
                { id: 'qr_code', label: 'QR Code', labelAr: 'رمز QR', type: 'qrcode', value: '', position: { x: 500, y: 0 }, fontSize: 12, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', padding: 10, marginTop: 20 }
        }
    ],
    termsAndConditions: '1. Payment is due within 30 days.\n2. Late payments may incur additional charges.\n3. Goods remain property of the seller until paid in full.',
    termsAndConditionsAr: '1. الدفع مستحق خلال 30 يومًا.\n2. قد تترتب رسوم إضافية على التأخر في الدفع.\n3. تظل البضائع ملكًا للبائع حتى الدفع الكامل.',
    notes: '',
    notesAr: '',
    signature: {
        showSignatureLine: true,
        signatureLabel: 'Authorized Signature',
        signatureLabelAr: 'التوقيع المعتمد',
        showStampArea: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true
}

// Quote Template (similar structure, different styling)
export const defaultQuoteTemplate: DocumentTemplate = {
    ...defaultInvoiceTemplate,
    id: 'quote-default',
    name: 'Standard Quotation',
    nameAr: 'عرض سعر قياسي',
    type: 'quote',
    sections: defaultInvoiceTemplate.sections.map(section => {
        if (section.id === 'header') {
            return {
                ...section,
                fields: section.fields.map(field => {
                    if (field.id === 'invoice_title') {
                        return { ...field, label: 'Quotation', labelAr: 'عرض سعر', value: 'QUOTATION' }
                    }
                    if (field.id === 'invoice_number') {
                        return { ...field, label: 'Quote #', labelAr: 'رقم العرض' }
                    }
                    if (field.id === 'due_date') {
                        return { ...field, label: 'Valid Until', labelAr: 'صالح حتى' }
                    }
                    return field
                })
            }
        }
        return section
    }),
    termsAndConditions: '1. This quotation is valid for 30 days.\n2. Prices are subject to change without notice.\n3. Delivery timeline will be confirmed upon order.',
    termsAndConditionsAr: '1. هذا العرض صالح لمدة 30 يومًا.\n2. الأسعار قابلة للتغيير دون إشعار مسبق.\n3. سيتم تأكيد موعد التسليم عند الطلب.'
}

// Purchase Order Template
export const defaultPurchaseOrderTemplate: DocumentTemplate = {
    ...defaultInvoiceTemplate,
    id: 'po-default',
    name: 'Standard Purchase Order',
    nameAr: 'أمر شراء قياسي',
    type: 'purchase_order',
    sections: defaultInvoiceTemplate.sections.map(section => {
        if (section.id === 'header') {
            return {
                ...section,
                fields: section.fields.map(field => {
                    if (field.id === 'invoice_title') {
                        return { ...field, label: 'Purchase Order', labelAr: 'أمر شراء', value: 'PURCHASE ORDER' }
                    }
                    if (field.id === 'invoice_number') {
                        return { ...field, label: 'PO #', labelAr: 'رقم أمر الشراء' }
                    }
                    if (field.id === 'due_date') {
                        return { ...field, label: 'Expected Delivery', labelAr: 'التسليم المتوقع' }
                    }
                    return field
                })
            }
        }
        if (section.id === 'customer_info') {
            return {
                ...section,
                name: 'Vendor Information',
                nameAr: 'معلومات المورد',
                fields: section.fields.map(field => {
                    if (field.id === 'bill_to') {
                        return { ...field, label: 'Vendor', labelAr: 'المورد', value: 'Vendor:' }
                    }
                    if (field.id === 'customer_name') {
                        return { ...field, label: 'Vendor Name', labelAr: 'اسم المورد' }
                    }
                    return field
                })
            }
        }
        return section
    }),
    termsAndConditions: '1. Delivery must be made as per the specified date.\n2. All goods must match specifications.\n3. Payment terms as per agreement.',
    termsAndConditionsAr: '1. يجب أن يتم التسليم في التاريخ المحدد.\n2. يجب أن تطابق جميع البضائع المواصفات.\n3. شروط الدفع حسب الاتفاق.'
}

// Delivery Note Template
export const defaultDeliveryNoteTemplate: DocumentTemplate = {
    ...defaultInvoiceTemplate,
    id: 'dn-default',
    name: 'Delivery Note',
    nameAr: 'إذن تسليم',
    type: 'delivery_note',
    sections: defaultInvoiceTemplate.sections.map(section => {
        if (section.id === 'header') {
            return {
                ...section,
                fields: section.fields.map(field => {
                    if (field.id === 'invoice_title') {
                        return { ...field, label: 'Delivery Note', labelAr: 'إذن تسليم', value: 'DELIVERY NOTE' }
                    }
                    if (field.id === 'invoice_number') {
                        return { ...field, label: 'DN #', labelAr: 'رقم الإذن' }
                    }
                    if (field.id === 'due_date') {
                        return { ...field, label: 'Delivery Date', labelAr: 'تاريخ التسليم' }
                    }
                    return field
                })
            }
        }
        if (section.id === 'totals') {
            return { ...section, visible: false } // Hide totals for delivery notes
        }
        if (section.id === 'payment_info') {
            return { ...section, visible: false }
        }
        return section
    }).concat([
        {
            id: 'received_by',
            name: 'Received By',
            nameAr: 'استلم بواسطة',
            type: 'custom',
            visible: true,
            fields: [
                { id: 'receiver_name', label: 'Received By', labelAr: 'استلم بواسطة', type: 'text', value: '', position: { x: 0, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'receiver_signature', label: 'Signature', labelAr: 'التوقيع', type: 'text', value: '', position: { x: 0, y: 30 }, fontSize: 11, fontWeight: 'normal', visible: true },
                { id: 'receive_date', label: 'Date & Time', labelAr: 'التاريخ والوقت', type: 'date', value: '', position: { x: 200, y: 0 }, fontSize: 11, fontWeight: 'normal', visible: true },
            ],
            style: { backgroundColor: '#ecfdf5', borderColor: '#10b981', padding: 15, marginTop: 20 }
        }
    ]),
    termsAndConditions: 'Please inspect all items upon receipt and report any discrepancies immediately.',
    termsAndConditionsAr: 'يرجى فحص جميع المواد عند الاستلام والإبلاغ عن أي اختلافات فورًا.'
}

// Get all default templates
export function getDefaultTemplates(): DocumentTemplate[] {
    return [
        defaultInvoiceTemplate,
        defaultQuoteTemplate,
        defaultPurchaseOrderTemplate,
        defaultDeliveryNoteTemplate
    ]
}

// Template type labels (bilingual)
export const templateTypeLabels: Record<DocumentTemplate['type'], { en: string; ar: string }> = {
    invoice: { en: 'Invoice', ar: 'فاتورة' },
    quote: { en: 'Quotation', ar: 'عرض سعر' },
    sales_order: { en: 'Sales Order', ar: 'أمر بيع' },
    purchase_order: { en: 'Purchase Order', ar: 'أمر شراء' },
    bill: { en: 'Bill', ar: 'فاتورة مورد' },
    receipt: { en: 'Receipt', ar: 'إيصال' },
    delivery_note: { en: 'Delivery Note', ar: 'إذن تسليم' },
    credit_note: { en: 'Credit Note', ar: 'إشعار دائن' }
}
