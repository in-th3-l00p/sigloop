import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function BudgetBar({
  spent,
  limit,
  label,
}: {
  spent: number
  limit: number
  label?: string
}) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0
  const color = pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-yellow-500" : "bg-green-500"

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono">
            ${spent.toFixed(2)} / ${limit.toFixed(2)}
          </span>
        </div>
      )}
      <Progress value={pct} indicatorClassName={cn(color)} />
      <p className="text-xs text-muted-foreground text-right">{pct.toFixed(0)}%</p>
    </div>
  )
}
