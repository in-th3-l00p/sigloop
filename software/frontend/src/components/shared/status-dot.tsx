import { cn } from "@/lib/utils"

const colors: Record<string, string> = {
  active: "bg-green-500",
  connected: "bg-green-500",
  completed: "bg-green-500",
  revoked: "bg-red-500",
  failed: "bg-red-500",
  disconnected: "bg-red-500",
  expired: "bg-zinc-500",
  pending: "bg-yellow-500",
  connecting: "bg-yellow-500",
  warning: "bg-yellow-500",
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className={cn("h-2 w-2 rounded-full", colors[status] ?? "bg-zinc-500")} />
      <span>{status}</span>
    </span>
  )
}
