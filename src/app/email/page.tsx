export const runtime = 'edge';
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { getDictionary, Locale } from "@/lib/i18n/dictionaries"
import { redirect } from "next/navigation"
import { EmailClient } from "./EmailClient"

export default async function EmailPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en"
    const locale: Locale = rawLocale === "ar" ? "ar" : "en"
    const dict = getDictionary(locale)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch email settings
    const { data: settings } = await supabase
        .from('email_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Mock emails for now (In a real app, you'd fetch via IMAP or API)
    const mockEmails = [
        {
            id: "1",
            sender: "Ahmed Khalid",
            subject: "Quotation for Modern Office Lighting",
            snippet: "Greetings, please find attached the updated quotation for the lighting fixtures...",
            time: "10:24 AM",
            read: false,
            label: "Sales",
        },
        {
            id: "2",
            sender: "Microsoft Azure",
            subject: "Invoice for January 2024",
            snippet: "Your monthly invoice for Azure services is now available in the portal...",
            time: "Yesterday",
            read: true,
            label: "Bills",
        },
        {
            id: "3",
            sender: "Global Logistics",
            subject: "Delivery Confirmation: ST-RB-12",
            snippet: "The shipment of steel rebar has been delivered to Warehouse A...",
            time: "Jan 22",
            read: true,
            label: "Logistics",
        }
    ]

    return (
        <EmailClient
            initialSettings={settings}
            initialEmails={mockEmails}
            dict={dict}
            locale={locale}
        />
    )
}
