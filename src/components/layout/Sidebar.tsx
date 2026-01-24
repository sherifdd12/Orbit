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
    Settings,
    Menu,
    ChevronLeft,
    Search,
    Bell,
    User
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
} from "@/components/ui/sidebar"

const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Inventory", icon: Package, href: "/inventory" },
    { title: "Projects", icon: Briefcase, href: "/projects" },
    { title: "Finance", icon: Wallet, href: "/finance" },
    { title: "Documents", icon: Files, href: "/documents" },
    { title: "Email", icon: Mail, href: "/email" },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-4">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LayoutDashboard className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-lg">Orbit ERP</span>
                    <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu className="px-2">
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={item.title}
                                className="py-6"
                            >
                                <Link href={item.href} className="flex items-center gap-3">
                                    <item.icon className="size-5" />
                                    <span className="font-medium">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="py-6">
                            <User className="size-5" />
                            <div className="flex flex-col items-start leading-none ml-2">
                                <span className="font-medium italic">Orbit Admin</span>
                                <span className="text-[10px] text-muted-foreground">admin@orbit.erp</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <div className="h-4 w-px bg-muted mx-2" />
                        <h1 className="text-sm font-medium">Workspace / Orbit Foundation</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search anything..."
                                className="pl-9 h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                            <Bell className="size-5 text-muted-foreground" />
                            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-destructive" />
                        </button>
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">OA</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-zinc-950">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
