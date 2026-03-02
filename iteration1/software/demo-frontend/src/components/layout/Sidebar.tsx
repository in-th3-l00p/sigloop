import { Link, useRouterState } from "@tanstack/react-router"
import {
    LayoutDashboard,
    Wallet,
    Bot,
    ShieldCheck,
    Receipt,
    ArrowRightLeft,
    BarChart3,
    Settings
} from "lucide-react"

const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/wallets", icon: Wallet, label: "Wallets" },
    { to: "/agents", icon: Bot, label: "Agents" },
    { to: "/policies", icon: ShieldCheck, label: "Policies" },
    { to: "/payments", icon: Receipt, label: "Payments" },
    { to: "/defi", icon: ArrowRightLeft, label: "DeFi" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar() {
    const routerState = useRouterState()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-zinc-900 text-zinc-300">
            <div className="flex h-16 items-center px-6 text-lg font-semibold text-white">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-purple">
                    <span className="font-bold text-white">S</span>
                </div>
                sigloop
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
                {navItems.map((item) => {
                    const isActive = routerState.location.pathname === item.to ||
                        (item.to !== "/" && routerState.location.pathname.startsWith(item.to))

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? "bg-brand-purple/10 text-brand-purple"
                                : "hover:bg-zinc-800 hover:text-white"
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-brand-purple" : "text-zinc-500"}`} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
                <div className="flex items-center space-x-2 pb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>WebSocket connected</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>API online</span>
                </div>
            </div>
        </div>
    )
}
