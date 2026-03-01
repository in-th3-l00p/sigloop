import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Wallet,
  Bot,
  Shield,
  CreditCard,
  TrendingUp,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/providers/websocket"
import { StatusDot } from "@/components/shared/status-dot"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/wallets", icon: Wallet, label: "Wallets" },
  { to: "/agents", icon: Bot, label: "Agents" },
  { to: "/policies", icon: Shield, label: "Policies" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/defi", icon: TrendingUp, label: "DeFi" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { status } = useWebSocket()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-violet-500 to-violet-400 bg-clip-text text-transparent">
            sigloop
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center px-2",
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <StatusDot status={status} className={cn(collapsed && "[&>span:last-child]:hidden")} />
        </div>
      </div>
    </aside>
  )
}
