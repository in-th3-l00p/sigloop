import { useState, useEffect } from "react"
import { relativeTime } from "@/lib/utils"

export function RelativeTime({ date }: { date: string | Date }) {
  const [text, setText] = useState(() => relativeTime(date))

  useEffect(() => {
    const interval = setInterval(() => setText(relativeTime(date)), 10000)
    return () => clearInterval(interval)
  }, [date])

  return <span className="text-muted-foreground text-sm">{text}</span>
}
