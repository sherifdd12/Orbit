"use client"

import * as React from "react"

export function Clock() {
    const [time, setTime] = React.useState<string>("")

    React.useEffect(() => {
        const update = () => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
        update()
        const timer = setInterval(update, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <span className="text-sm font-mono font-bold text-slate-600">
            {time || "--:-- --"}
        </span>
    )
}
