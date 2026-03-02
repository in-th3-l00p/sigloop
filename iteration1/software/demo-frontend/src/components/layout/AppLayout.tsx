import { Outlet } from "@tanstack/react-router"
import { Sidebar } from "./Sidebar"

export function AppLayout() {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-8 bg-card/50 backdrop-blur">
                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                        {/* Breadcrumbs can go here */}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-xs font-medium">OP</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
