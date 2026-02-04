"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Briefcase,
    Wallet,
    Mail,
    Files,
    Search,
    Bell,
    Globe,
    CheckSquare,
    FileText,
    Users,
    ShoppingCart,
    Truck,
    Settings,
    Building2,
    ChevronDown
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function AppSidebar() {
    const pathname = usePathname()
    const { dict, locale } = useLanguage()

    // Main navigation items
    const mainItems = [
        { title: dict.sidebar.dashboard, icon: LayoutDashboard, href: "/dashboard" },
    ]

    // Operations group
    const operationsItems = [
        { title: dict.sidebar.projects, icon: Briefcase, href: "/projects" },
        { title: dict.sidebar.tasks, icon: CheckSquare, href: "/tasks" },
        { title: dict.sidebar.inventory, icon: Package, href: "/inventory" },
        { title: dict.sidebar.warehouses, icon: Building2, href: "/warehouses" },
    ]

    // Sales & CRM group
    const salesItems = [
        { title: dict.sidebar.customers, icon: Users, href: "/sales/customers" },
        { title: dict.sales?.salesOrders || "Sales Orders", icon: ShoppingCart, href: "/sales/orders" },
        { title: dict.sidebar.invoices, icon: FileText, href: "/sales/invoices" },
    ]

    // Purchasing group
    const purchasingItems = [
        { title: dict.sidebar.vendors, icon: Truck, href: "/purchasing/vendors" },
        { title: dict.purchasing?.purchaseOrders || "Purchase Orders", icon: ShoppingCart, href: "/purchasing/orders" },
        { title: dict.purchasing?.bills || "Bills", icon: FileText, href: "/purchasing/bills" },
    ]

    // Finance group
    const financeItems = [
        { title: dict.finance?.chartOfAccounts || "Chart of Accounts", icon: Wallet, href: "/finance/accounts" },
        { title: dict.finance?.journalEntries || "Journal Entries", icon: FileText, href: "/finance/journal" },
        { title: dict.finance?.transactions || "Transactions", icon: Wallet, href: "/finance" },
    ]

    // HR group
    const hrItems = [
        { title: dict.sidebar.employees, icon: Users, href: "/hr/employees" },
        { title: dict.sidebar.attendance, icon: CheckSquare, href: "/hr/attendance" },
        { title: dict.hr?.leaveRequests || "Leave Requests", icon: FileText, href: "/hr/leave" },
    ]

    // Other items
    const otherItems = [
        { title: dict.sidebar.documents, icon: Files, href: "/documents" },
        { title: dict.sidebar.email, icon: Mail, href: "/email" },
    ]

    // Admin items
    const adminItems = [
        { title: dict.sidebar.admin, icon: Settings, href: "/admin" },
    ]

    const NavGroup = ({ label, items }: { label: string, items: typeof mainItems }) => (
        <SidebarGroup>
            <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                        {label}
                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3">
                                            <item.icon className="size-4" />
                                            <span className="text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </Collapsible>
        </SidebarGroup>
    )

    return (
        <Sidebar variant="inset" side={locale === "ar" ? "right" : "left"} className="border-r">
            <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-4 border-b">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                    <LayoutDashboard className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Orbit ERP</span>
                    <span className="text-[10px] text-muted-foreground">Enterprise Edition</span>
                </div>
            </SidebarHeader>
            <SidebarContent className="overflow-y-auto">
                {/* Dashboard */}
                <SidebarGroup>
                    <SidebarMenu className="px-2 pt-2">
                        {mainItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.title}
                                    className="py-5"
                                >
                                    <Link href={item.href} className="flex items-center gap-3">
                                        <item.icon className="size-5" />
                                        <span className="font-medium">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Grouped Navigation */}
                <NavGroup label={dict.projects?.title || "Operations"} items={operationsItems} />
                <NavGroup label={dict.sales?.title || "Sales & CRM"} items={salesItems} />
                <NavGroup label={dict.purchasing?.title || "Purchasing"} items={purchasingItems} />
                <NavGroup label={dict.finance?.title || "Finance"} items={financeItems} />
                <NavGroup label={dict.hr?.title || "HR & Payroll"} items={hrItems} />

                {/* Other */}
                <SidebarGroup>
                    <SidebarGroupLabel>Other</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {otherItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3">
                                            <item.icon className="size-4" />
                                            <span className="text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Admin */}
                <SidebarGroup>
                    <SidebarGroupLabel>{dict.admin?.title || "Administration"}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3">
                                            <item.icon className="size-4" />
                                            <span className="text-sm">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="py-5 h-auto">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                                OA
                            </div>
                            <div className="flex flex-col items-start leading-none ms-2">
                                <span className="font-medium">Orbit Admin</span>
                                <span className="text-[10px] text-muted-foreground">admin@orbit.erp</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

import { NotificationCenter } from "@/components/notifications/NotificationCenter"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { locale, setLocale, dict } = useLanguage()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ms-1" />
                        <div className="h-4 w-px bg-muted mx-2" />
                        <h1 className="text-sm font-medium hidden md:block">Workspace / Orbit Foundation</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Language Switcher */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                            className="text-xs font-semibold flex items-center gap-2"
                        >
                            <Globe className="size-4" />
                            <span className="hidden sm:inline">{locale === "en" ? "العربية" : "English"}</span>
                        </Button>

                        <div className="relative hidden lg:block">
                            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder={dict.common.search + "..."}
                                className="ps-9 h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <NotificationCenter />

                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow cursor-pointer">
                            OA
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-zinc-950 dark:to-zinc-900 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
