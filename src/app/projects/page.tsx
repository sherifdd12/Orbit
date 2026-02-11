export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import * as React from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { getDictionary, Locale } from "@/lib/i18n/dictionaries"
import { ProjectsClient } from "./ProjectsClient"
import { redirect } from "next/navigation"

export default async function ProjectsPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const rawLocale = cookieStore.get("NEXT_LOCALE")?.value || "en"
    const locale: Locale = rawLocale === "ar" ? "ar" : "en"
    const dict = getDictionary(locale)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Parallel data fetching
    const [projectsRes, customersRes, settingsRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('system_settings').select('value').eq('key', 'base_currency').single()
    ])

    const projects = projectsRes.data || []
    const customers = customersRes.data || []
    const currency = settingsRes.data?.value || "KWD"

    return (
        <ProjectsClient
            initialProjects={projects}
            customers={customers}
            dict={dict}
            locale={locale}
            currency={currency}
        />
    )
}
