import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value?: number
  indicatorClassName?: string
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div ref={ref} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)} {...props}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  ),
)
Progress.displayName = "Progress"

export { Progress }
