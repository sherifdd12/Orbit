"use client"

import * as React from "react"
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle2, MoreHorizontal } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    is_read: boolean
    created_at: string
    link?: string
}

export function NotificationCenter() {
    const { dict } = useLanguage()
    const [notifications, setNotifications] = React.useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = React.useState(0)
    const supabase = createClient()

    const fetchNotifications = React.useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchNotifications()

        // Real-time subscription
        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications(prev => [newNotif, ...prev.slice(0, 19)])
                    setUnreadCount(prev => prev + 1)

                    // Optional: Native browser notification if integrated
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, fetchNotifications])

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        }
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
            case 'error': return <AlertCircle className="h-4 w-4 text-rose-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none">
                    <Bell className="size-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[350px] p-0 shadow-2xl overflow-hidden border-none transform origin-top-right">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-sm">{dict.notifications?.title || 'Notifications'}</h3>
                            <p className="text-[10px] text-slate-400">You have {unreadCount} unread alerts</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] p-2 hover:bg-white/10 text-white"
                                onClick={markAllAsRead}
                            >
                                <Check className="h-3 w-3 mr-1" /> Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                <p className="text-xs">{dict.notifications?.noNotifications || 'No new notifications'}</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-100' :
                                        notif.type === 'warning' ? 'bg-amber-100' :
                                            notif.type === 'error' ? 'bg-rose-100' : 'bg-blue-100'
                                        }`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs font-bold ${!notif.is_read ? 'text-slate-900' : 'text-slate-500'}`}>{notif.title}</p>
                                            <span className="text-[9px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                            {notif.message}
                                        </p>
                                        {!notif.is_read && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-2 bg-slate-50 border-t text-center">
                    <button className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                        View All Activity
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
