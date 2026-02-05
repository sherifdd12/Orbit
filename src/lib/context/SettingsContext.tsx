"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface Settings {
    currency: string
    companyName: string
    companyAddress: string
    taxId: string
    notifications: {
        email: boolean
        lowStock: boolean
        payments: boolean
    }
}

interface SettingsContextType extends Settings {
    setCurrency: (currency: string) => Promise<void>
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>
    loading: boolean
    formatMoney: (amount: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const DEFAULT_SETTINGS: Settings = {
    currency: "KWD",
    companyName: "Orbit Foundation",
    companyAddress: "",
    taxId: "",
    notifications: {
        email: true,
        lowStock: true,
        payments: true
    }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')

            if (data && !error) {
                const loadedSettings = { ...DEFAULT_SETTINGS }
                data.forEach((item: any) => {
                    if (item.key === 'base_currency') loadedSettings.currency = item.value
                    if (item.key === 'company_name') loadedSettings.companyName = item.value
                    if (item.key === 'company_address') loadedSettings.companyAddress = item.value
                    if (item.key === 'tax_id') loadedSettings.taxId = item.value
                    if (item.key === 'notifications') loadedSettings.notifications = item.value
                })
                setSettingsState(loadedSettings)
            }
        } catch (err) {
            console.error("Error fetching settings:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const setCurrency = async (newCurrency: string) => {
        setSettingsState(prev => ({ ...prev, currency: newCurrency }))
        try {
            await supabase
                .from('system_settings')
                .upsert({ key: 'base_currency', value: newCurrency })
        } catch (err) {
            console.error("Error saving currency:", err)
        }
    }

    const updateSettings = async (newSettings: Partial<Settings>) => {
        setSettingsState(prev => ({ ...prev, ...newSettings }))

        const upserts = []
        if (newSettings.currency) upserts.push({ key: 'base_currency', value: newSettings.currency })
        if (newSettings.companyName) upserts.push({ key: 'company_name', value: newSettings.companyName })
        if (newSettings.companyAddress !== undefined) upserts.push({ key: 'company_address', value: newSettings.companyAddress })
        if (newSettings.taxId !== undefined) upserts.push({ key: 'tax_id', value: newSettings.taxId })
        if (newSettings.notifications) upserts.push({ key: 'notifications', value: newSettings.notifications })

        if (upserts.length > 0) {
            try {
                await supabase.from('system_settings').upsert(upserts)
            } catch (err) {
                console.error("Error updating settings:", err)
            }
        }
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: settings.currency,
            minimumFractionDigits: 3 // KWD usually has 3 decimals
        }).format(amount)
    }

    return (
        <SettingsContext.Provider value={{ ...settings, setCurrency, updateSettings, loading, formatMoney }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider")
    }
    return context
}
