"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { dictionaries, Locale, Dictionary } from "./dictionaries"

interface LanguageContextType {
    locale: Locale
    dict: Dictionary
    setLocale: (locale: Locale) => void
    isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({
    children,
    initialLocale
}: {
    children: React.ReactNode
    initialLocale: Locale
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale)

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        Cookies.set("NEXT_LOCALE", newLocale, { expires: 365 })
        // Refresh the page to apply layout changes (like RTL)
        window.location.reload()
    }

    const dict = dictionaries[locale]
    const isRTL = locale === "ar"

    useEffect(() => {
        const savedLocale = Cookies.get("NEXT_LOCALE") as Locale
        if (savedLocale && savedLocale !== locale) {
            // If cookie mismatch, we trust the cookie on client side if needed
            // But typically server layout handles initialLocale
        }
    }, [locale])

    return (
        <LanguageContext.Provider value={{ locale, dict, setLocale, isRTL }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
