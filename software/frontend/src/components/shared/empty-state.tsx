import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}
