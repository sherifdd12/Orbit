"use client"

import * as React from "react"
import {
    DocumentTemplate,
    DocumentSection,
    DocumentField,
    CompanyBranding,
    defaultBranding
} from "./documentTemplates"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSettings } from "@/lib/context/SettingsContext"

interface PrintDocumentProps {
    template: DocumentTemplate
    data: {
        documentNumber: string
        documentDate: string
        dueDate?: string
        customer?: {
            name: string
            nameAr?: string
            address?: string
            addressAr?: string
            taxNumber?: string
            phone?: string
            email?: string
        }
        vendor?: {
            name: string
            nameAr?: string
            address?: string
            addressAr?: string
            taxNumber?: string
            phone?: string
            email?: string
        }
        items: Array<{
            no: number
            description: string
            descriptionAr?: string
            quantity: number
            unit: string
            unitAr?: string
            unitPrice: number
            total: number
            discount?: number
        }>
        subtotal: number
        discount?: number
        discountPercent?: number
        taxRate?: number
        taxAmount?: number
        grandTotal: number
        amountInWords?: string
        amountInWordsAr?: string
        notes?: string
        notesAr?: string
        paymentInfo?: {
            bankName?: string
            accountName?: string
            iban?: string
            swift?: string
        }
        projectName?: string
        reference?: string
        salesperson?: string
    }
    companyBranding?: Partial<CompanyBranding>
}

// Number to Arabic words converter
function numberToArabicWords(num: number): string {
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
        'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']

    if (num === 0) return 'صفر'
    if (num < 20) return ones[num]
    if (num < 100) {
        const t = Math.floor(num / 10)
        const o = num % 10
        return o > 0 ? `${ones[o]} و${tens[t]}` : tens[t]
    }
    if (num < 1000) {
        const h = Math.floor(num / 100)
        const r = num % 100
        return r > 0 ? `${hundreds[h]} و${numberToArabicWords(r)}` : hundreds[h]
    }
    if (num < 1000000) {
        const th = Math.floor(num / 1000)
        const r = num % 1000
        const thWord = th === 1 ? 'ألف' : th === 2 ? 'ألفان' : th <= 10 ? `${ones[th]} آلاف` : `${numberToArabicWords(th)} ألف`
        return r > 0 ? `${thWord} و${numberToArabicWords(r)}` : thWord
    }
    return num.toString()
}

// Number to English words converter
function numberToEnglishWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    if (num === 0) return 'Zero'
    if (num < 20) return ones[num]
    if (num < 100) {
        const t = Math.floor(num / 10)
        const o = num % 10
        return o > 0 ? `${tens[t]}-${ones[o]}` : tens[t]
    }
    if (num < 1000) {
        const h = Math.floor(num / 100)
        const r = num % 100
        return r > 0 ? `${ones[h]} Hundred and ${numberToEnglishWords(r)}` : `${ones[h]} Hundred`
    }
    if (num < 1000000) {
        const th = Math.floor(num / 1000)
        const r = num % 1000
        return r > 0 ? `${numberToEnglishWords(th)} Thousand ${numberToEnglishWords(r)}` : `${numberToEnglishWords(th)} Thousand`
    }
    return num.toString()
}

export function PrintableDocument({ template, data, companyBranding }: PrintDocumentProps) {
    const { locale } = useLanguage()
    const { currency, formatMoney } = useSettings()
    const branding = { ...defaultBranding, ...template.branding, ...companyBranding }
    const isArabic = template.primaryLanguage === 'ar' || locale === 'ar'
    const isDualLang = template.showDualLanguage

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString(isArabic ? 'ar-KW' : 'en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const amountInWords = React.useMemo(() => {
        const intPart = Math.floor(data.grandTotal)
        const decPart = Math.round((data.grandTotal - intPart) * 1000)
        const currencyName = currency // e.g., "KWD"

        if (isArabic) {
            const intWords = numberToArabicWords(intPart)
            return decPart > 0
                ? `${intWords} ${currencyName} و${numberToArabicWords(decPart)} فلس فقط لا غير`
                : `${intWords} ${currencyName} فقط لا غير`
        } else {
            const intWords = numberToEnglishWords(intPart)
            return decPart > 0
                ? `${intWords} ${currencyName} and ${numberToEnglishWords(decPart)} Fils Only`
                : `${intWords} ${currencyName} Only`
        }
    }, [data.grandTotal, currency, isArabic])

    return (
        <div
            className="print-document bg-white"
            dir={isArabic ? 'rtl' : 'ltr'}
            style={{
                fontFamily: isArabic ? "'Noto Sans Arabic', 'Arial', sans-serif" : "'Inter', 'Arial', sans-serif",
                padding: `${template.margins.top}mm ${template.margins.right}mm ${template.margins.bottom}mm ${template.margins.left}mm`,
                width: template.paperSize === 'A4' ? (template.orientation === 'landscape' ? '297mm' : '210mm') : template.paperSize === 'Letter' ? (template.orientation === 'landscape' ? '11in' : '8.5in') : (template.orientation === 'landscape' ? '210mm' : '148mm'),
                minHeight: template.paperSize === 'A4' ? (template.orientation === 'landscape' ? '210mm' : '297mm') : template.paperSize === 'Letter' ? (template.orientation === 'landscape' ? '8.5in' : '11in') : (template.orientation === 'landscape' ? '148mm' : '210mm'),
                position: 'relative',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            <style jsx global>{`
                @media print {
                    @page {
                        size: ${template.paperSize} ${template.orientation};
                        margin: 0;
                    }
                    
                    /* Reset app shell for print */
                    .SidebarProvider, 
                    [data-sidebar-provider],
                    .SidebarInset,
                    main {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                        overflow: visible !important;
                        min-height: 0 !important;
                        height: auto !important;
                    }

                    /* Hide UI elements */
                    .no-print, 
                    header, 
                    .SidebarTrigger,
                    aside {
                        display: none !important;
                    }

                    /* Document Styling */
                    .print-document {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: ${template.margins.top}mm ${template.margins.right}mm ${template.margins.bottom}mm ${template.margins.left}mm !important;
                        width: ${template.paperSize === 'A4' ? (template.orientation === 'landscape' ? '297mm' : '210mm') : template.paperSize === 'Letter' ? (template.orientation === 'landscape' ? '11in' : '8.5in') : (template.orientation === 'landscape' ? '210mm' : '148mm')} !important;
                        min-height: ${template.paperSize === 'A4' ? (template.orientation === 'landscape' ? '210mm' : '297mm') : template.paperSize === 'Letter' ? (template.orientation === 'landscape' ? '8.5in' : '11in') : (template.orientation === 'landscape' ? '148mm' : '210mm')} !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        z-index: 100 !important;
                    }
                    
                    /* Global resets */
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        height: auto !important;
                    }
                }
            `}</style>
            {/* Watermark */}
            {template.showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
                    <span className="text-8xl font-black rotate-[-30deg] text-gray-500">{template.watermarkText}</span>
                </div>
            )}

            {/* Header Section */}
            <header className="relative z-10 flex justify-between items-start mb-8 pb-6 border-b-2" style={{ borderColor: branding.primaryColor }}>
                <div className="flex items-center gap-4">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                    ) : (
                        <div
                            className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                            style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                        >
                            {branding.companyName.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
                            {isArabic ? branding.companyNameAr : branding.companyName}
                        </h1>
                        {isDualLang && (
                            <p className="text-sm text-gray-500">
                                {isArabic ? branding.companyName : branding.companyNameAr}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            {isArabic ? branding.taglineAr : branding.tagline}
                        </p>
                    </div>
                </div>
                <div className={`text-${isArabic ? 'left' : 'right'}`}>
                    <h2 className="text-3xl font-black uppercase tracking-wider" style={{ color: branding.primaryColor }}>
                        {template.type === 'invoice' ? (isArabic ? 'فاتورة' : 'INVOICE') :
                            template.type === 'quote' ? (isArabic ? 'عرض سعر' : 'QUOTATION') :
                                template.type === 'purchase_order' ? (isArabic ? 'أمر شراء' : 'PURCHASE ORDER') :
                                    template.type === 'delivery_note' ? (isArabic ? 'إذن تسليم' : 'DELIVERY NOTE') :
                                        template.type.toUpperCase()}
                    </h2>
                    <div className="mt-2 space-y-1 text-sm">
                        <p><span className="font-semibold">{isArabic ? 'رقم:' : '#:'}</span> {data.documentNumber}</p>
                        <p><span className="font-semibold">{isArabic ? 'التاريخ:' : 'Date:'}</span> {formatDate(data.documentDate)}</p>
                        {data.dueDate && (
                            <p><span className="font-semibold">{isArabic ? 'الاستحقاق:' : 'Due:'}</span> {formatDate(data.dueDate)}</p>
                        )}
                    </div>
                </div>
            </header>

            {/* Customer/Vendor Info */}
            <section className="grid grid-cols-2 gap-8 mb-6">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">
                        {template.type === 'purchase_order'
                            ? (isArabic ? 'المورد' : 'VENDOR')
                            : (isArabic ? 'فاتورة إلى' : 'BILL TO')
                        }
                    </h3>
                    <p className="font-bold text-lg" style={{ color: branding.primaryColor }}>
                        {isArabic ? (data.customer?.nameAr || data.vendor?.nameAr || data.customer?.name || data.vendor?.name)
                            : (data.customer?.name || data.vendor?.name)}
                    </p>
                    {isDualLang && (
                        <p className="text-sm text-gray-500">
                            {isArabic ? (data.customer?.name || data.vendor?.name)
                                : (data.customer?.nameAr || data.vendor?.nameAr)}
                        </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                        {isArabic ? (data.customer?.addressAr || data.vendor?.addressAr || data.customer?.address || data.vendor?.address)
                            : (data.customer?.address || data.vendor?.address)}
                    </p>
                    {(data.customer?.taxNumber || data.vendor?.taxNumber) && (
                        <p className="text-sm text-gray-500 mt-1">
                            {isArabic ? 'الرقم الضريبي:' : 'Tax ID:'} {data.customer?.taxNumber || data.vendor?.taxNumber}
                        </p>
                    )}
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-2">
                        {isArabic ? 'من' : 'FROM'}
                    </h3>
                    <p className="font-bold text-lg" style={{ color: branding.primaryColor }}>
                        {isArabic ? branding.companyNameAr : branding.companyName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {isArabic ? branding.addressAr : branding.address}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{branding.phone}</p>
                    <p className="text-sm text-gray-500">{branding.email}</p>
                    {branding.taxNumber && (
                        <p className="text-sm text-gray-500 mt-1">
                            {isArabic ? 'الرقم الضريبي:' : 'Tax ID:'} {branding.taxNumber}
                        </p>
                    )}
                </div>
            </section>

            {/* Reference Info */}
            {(data.reference || data.projectName || data.salesperson) && (
                <section className="flex gap-8 mb-6 text-sm">
                    {data.reference && (
                        <p><span className="font-semibold">{isArabic ? 'المرجع:' : 'Ref:'}</span> {data.reference}</p>
                    )}
                    {data.projectName && (
                        <p><span className="font-semibold">{isArabic ? 'المشروع:' : 'Project:'}</span> {data.projectName}</p>
                    )}
                    {data.salesperson && (
                        <p><span className="font-semibold">{isArabic ? 'المندوب:' : 'Sales Rep:'}</span> {data.salesperson}</p>
                    )}
                </section>
            )}

            {/* Items Table */}
            <section className="mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr style={{ backgroundColor: branding.primaryColor }}>
                            <th className="text-white py-3 px-3 text-center font-bold text-sm border-r border-white/20 w-12">#</th>
                            <th className={`text-white py-3 px-3 ${isArabic ? 'text-right' : 'text-left'} font-bold text-sm border-r border-white/20`}>
                                {isArabic ? 'الوصف' : 'Description'}
                            </th>
                            <th className="text-white py-3 px-3 text-center font-bold text-sm border-r border-white/20 w-20">
                                {isArabic ? 'الكمية' : 'Qty'}
                            </th>
                            <th className="text-white py-3 px-3 text-center font-bold text-sm border-r border-white/20 w-20">
                                {isArabic ? 'الوحدة' : 'Unit'}
                            </th>
                            <th className={`text-white py-3 px-3 ${isArabic ? 'text-left' : 'text-right'} font-bold text-sm border-r border-white/20 w-28`}>
                                {isArabic ? 'السعر' : 'Price'}
                            </th>
                            <th className={`text-white py-3 px-3 ${isArabic ? 'text-left' : 'text-right'} font-bold text-sm w-32`}>
                                {isArabic ? 'الإجمالي' : 'Total'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="py-3 px-3 text-center text-sm border-b border-gray-200">{item.no}</td>
                                <td className={`py-3 px-3 ${isArabic ? 'text-right' : 'text-left'} text-sm border-b border-gray-200`}>
                                    <span className="font-medium">{isArabic ? (item.descriptionAr || item.description) : item.description}</span>
                                    {isDualLang && (
                                        <span className="block text-xs text-gray-400">
                                            {isArabic ? item.description : item.descriptionAr}
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-center text-sm border-b border-gray-200 font-mono">{item.quantity}</td>
                                <td className="py-3 px-3 text-center text-sm border-b border-gray-200">
                                    {isArabic ? (item.unitAr || item.unit) : item.unit}
                                </td>
                                <td className={`py-3 px-3 ${isArabic ? 'text-left' : 'text-right'} text-sm border-b border-gray-200 font-mono`}>
                                    {formatMoney(item.unitPrice)}
                                </td>
                                <td className={`py-3 px-3 ${isArabic ? 'text-left' : 'text-right'} text-sm border-b border-gray-200 font-mono font-bold`}>
                                    {formatMoney(item.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Totals Section */}
            {template.type !== 'delivery_note' && (
                <section className="flex justify-end mb-6">
                    <div className="w-80 border rounded-lg overflow-hidden">
                        <div className="flex justify-between py-2 px-4 bg-gray-50 border-b text-sm">
                            <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                            <span className="font-mono font-medium">{formatMoney(data.subtotal)}</span>
                        </div>
                        {data.discount && data.discount > 0 && (
                            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b text-sm text-red-600">
                                <span>{isArabic ? 'الخصم' : 'Discount'} {data.discountPercent ? `(${data.discountPercent}%)` : ''}</span>
                                <span className="font-mono">-{formatMoney(data.discount)}</span>
                            </div>
                        )}
                        {data.taxAmount && data.taxAmount > 0 && (
                            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b text-sm">
                                <span>{isArabic ? 'الضريبة' : 'Tax'} {data.taxRate ? `(${data.taxRate}%)` : ''}</span>
                                <span className="font-mono">{formatMoney(data.taxAmount)}</span>
                            </div>
                        )}
                        <div
                            className="flex justify-between py-3 px-4 text-lg font-bold text-white"
                            style={{ backgroundColor: branding.primaryColor }}
                        >
                            <span>{isArabic ? 'الإجمالي الكلي' : 'Grand Total'}</span>
                            <span className="font-mono">{formatMoney(data.grandTotal)}</span>
                        </div>
                        <div className="py-2 px-4 bg-gray-100 text-xs text-gray-600">
                            {amountInWords}
                        </div>
                    </div>
                </section>
            )}

            {/* Payment Info (for invoices) */}
            {template.type === 'invoice' && data.paymentInfo && (
                <section className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-yellow-700 mb-2">
                        {isArabic ? 'معلومات الدفع' : 'PAYMENT INFORMATION'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {data.paymentInfo.bankName && (
                            <p><span className="font-semibold">{isArabic ? 'البنك:' : 'Bank:'}</span> {data.paymentInfo.bankName}</p>
                        )}
                        {data.paymentInfo.accountName && (
                            <p><span className="font-semibold">{isArabic ? 'اسم الحساب:' : 'Account:'}</span> {data.paymentInfo.accountName}</p>
                        )}
                        {data.paymentInfo.iban && (
                            <p><span className="font-semibold">IBAN:</span> {data.paymentInfo.iban}</p>
                        )}
                        {data.paymentInfo.swift && (
                            <p><span className="font-semibold">SWIFT:</span> {data.paymentInfo.swift}</p>
                        )}
                    </div>
                </section>
            )}

            {/* Notes */}
            {(data.notes || data.notesAr) && (
                <section className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-blue-700 mb-2">
                        {isArabic ? 'ملاحظات' : 'NOTES'}
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                        {isArabic ? (data.notesAr || data.notes) : (data.notes || data.notesAr)}
                    </p>
                </section>
            )}

            {/* Terms & Conditions */}
            {template.termsAndConditions && (
                <section className="mb-6">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">
                        {isArabic ? 'الشروط والأحكام' : 'TERMS & CONDITIONS'}
                    </h3>
                    <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">
                        {isArabic ? template.termsAndConditionsAr : template.termsAndConditions}
                    </p>
                </section>
            )}

            {/* Signature Area */}
            {template.signature.showSignatureLine && (
                <section className="mt-12 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                            <div className="h-16 border-b border-gray-300 mb-2"></div>
                            <p className="text-sm text-gray-500">
                                {isArabic ? template.signature.signatureLabelAr : template.signature.signatureLabel}
                            </p>
                        </div>
                        {template.signature.showStampArea && (
                            <div className="text-center">
                                <div className="h-16 w-32 mx-auto border border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                                    <span className="text-xs text-gray-400">{isArabic ? 'الختم' : 'Stamp'}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {isArabic ? 'الختم الرسمي' : 'Official Stamp'}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50 text-center" style={{ marginLeft: template.margins.left + 'mm', marginRight: template.margins.right + 'mm' }}>
                <div className="text-xs text-gray-500 space-y-1">
                    <p>{branding.address} | {branding.phone} | {branding.email}</p>
                    {branding.website && <p>{branding.website}</p>}
                    {branding.crNumber && (
                        <p>{isArabic ? 'السجل التجاري:' : 'CR:'} {branding.crNumber} {branding.taxNumber && `| ${isArabic ? 'الرقم الضريبي:' : 'Tax ID:'} ${branding.taxNumber}`}</p>
                    )}
                </div>
            </footer>
        </div>
    )
}

// Print styles are now handled dynamically via the <style> tag in the component
export const printStyles = ''
