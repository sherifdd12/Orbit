export const dictionaries = {
    en: {
        sidebar: {
            dashboard: "Dashboard",
            inventory: "Inventory",
            projects: "Projects",
            finance: "Finance",
            documents: "Documents",
            email: "Email",
            settings: "Settings",
            logout: "Logout",
        },
        dashboard: {
            title: "Dashboard Overview",
            welcome: "Welcome back",
            inventoryValue: "Total Inventory Value",
            activeProjects: "Active Projects",
            totalItems: "Total Items",
            stockAlerts: "Stock Alerts",
            recentActivity: "Recent Project Activity",
            latestUpdates: "Latest updates from your projects database.",
            noProjects: "No recent projects found.",
        },
        common: {
            language: "Language",
            english: "English",
            arabic: "العربية",
        }
    },
    ar: {
        sidebar: {
            dashboard: "لوحة القيادة",
            inventory: "المخزون",
            projects: "المشاريع",
            finance: "المالية",
            documents: "المستندات",
            email: "البريد الإلكتروني",
            settings: "الإعدادات",
            logout: "تسجيل الخروج",
        },
        dashboard: {
            title: "نظرة عامة على لوحة القيادة",
            welcome: "مرحباً بك مجدداً",
            inventoryValue: "إجمالي قيمة المخزون",
            activeProjects: "المشاريع النشطة",
            totalItems: "إجمالي المواد",
            stockAlerts: "تنبيهات المخزون",
            recentActivity: "نشاط المشروع الأخير",
            latestUpdates: "آخر التحديثات من قاعدة بيانات مشاريعك.",
            noProjects: "لم يتم العثور على مشاريع حديثة.",
        },
        common: {
            language: "اللغة",
            english: "English",
            arabic: "العربية",
        }
    }
}

export type Locale = "en" | "ar"
export type Dictionary = typeof dictionaries.en

export function getDictionary(locale: string): Dictionary {
    if (locale === "ar") return dictionaries.ar;
    return dictionaries.en;
}
