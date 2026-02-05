"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export type UserRole = 'Admin' | 'Manager' | 'Employee'

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function getRole() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (!error && data) {
                    setRole(data.role as UserRole)
                } else {
                    setRole('Employee') // Fallback
                }
            }
            setLoading(false)
        }

        getRole()
    }, [supabase])

    const isAdmin = role === 'Admin'
    const isManager = role === 'Manager' || role === 'Admin'

    return { role, isAdmin, isManager, loading }
}
