import { Card, CardContent } from "@/components/ui/card"
import { type ReactNode } from "react"

export function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string | number
  description?: string
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
