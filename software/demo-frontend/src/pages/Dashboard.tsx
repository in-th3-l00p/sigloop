import { useDashboardStats } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, Bot, Receipt, TrendingUp, AlertCircle } from "lucide-react"

export function Dashboard() {
    const { data: stats, isLoading } = useDashboardStats()

    if (isLoading || !stats) {
        return <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
            </div>
        </div>
    }

    return (
        <div className="space-y-6 flex flex-col">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground mt-1 text-sm">Overview of your agents and x402 spending.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Wallets</CardTitle>
                        <Wallet className="h-4 w-4 text-brand-purple" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.wallets}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total provisioned</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
                        <Bot className="h-4 w-4 text-brand-purple-light" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.agentsActive}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-red-400">{stats.agentsRevoked}</span> revoked
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Payments</CardTitle>
                        <Receipt className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.paymentsToday.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Spent today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.budgetUsedPct}%</div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className={`h-1.5 rounded-full ${stats.budgetUsedPct > 80 ? 'bg-red-500' : 'bg-brand-purple'}`}
                                style={{ width: `${stats.budgetUsedPct}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Top Agents by Spend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Wallet</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.topAgents.map((agent) => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium text-brand-purple-light">{agent.name}</TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">{agent.walletName}</TableCell>
                                        <TableCell className="text-right">${agent.totalSpent.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3 text-sm">
                            <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-400" />
                            <div>
                                <p className="font-medium">payment:recorded</p>
                                <p className="text-xs text-muted-foreground">agent-gpt4 &rarr; api.example.com</p>
                                <p className="text-xs text-muted-foreground mt-1">2s ago</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 text-sm">
                            <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
                            <div>
                                <p className="font-medium">agent:created</p>
                                <p className="text-xs text-muted-foreground">researcher-bot provisioned</p>
                                <p className="text-xs text-muted-foreground mt-1">5m ago</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3 text-sm">
                            <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-400" />
                            <div>
                                <p className="font-medium text-orange-400">budget:warning</p>
                                <p className="text-xs text-muted-foreground">ops-wallet at 80% limit</p>
                                <p className="text-xs text-muted-foreground mt-1">12m ago</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
