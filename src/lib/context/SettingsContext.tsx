"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface SettingsContextType {
    currency: string
    setCurrency: (currency: string) => Promise<void>
    loading: boolean
    formatMoney: (amount: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<string>("SAR")
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .eq('key', 'base_currency')
                .single()

            if (data && !error) {
                setCurrencyState(data.value)
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
        setCurrencyState(newCurrency)
        try {
            await supabase
                .from('system_settings')
                .upsert({ key: 'base_currency', value: newCurrency })
        } catch (err) {
            console.error("Error saving currency:", err)
        }
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, loading, formatMoney }}>
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
