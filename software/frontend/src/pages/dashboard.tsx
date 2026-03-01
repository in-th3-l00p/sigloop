import { Wallet, Bot, CreditCard, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { MetricCard } from "@/components/shared/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RelativeTime } from "@/components/shared/relative-time"
import { useWallets } from "@/hooks/use-wallets"
import { useAgents } from "@/hooks/use-agents"
import { usePaymentStats } from "@/hooks/use-payments"
import { useAgentAnalytics, useSpendingAnalytics } from "@/hooks/use-analytics"
import { useWebSocket } from "@/providers/websocket"
import { formatUsd } from "@/lib/utils"

function ActivityFeed() {
  const { events } = useWebSocket()

  const eventColor: Record<string, string> = {
    "payment:recorded": "text-blue-400",
    "agent:created": "text-green-400",
    "agent:revoked": "text-red-400",
    "budget:warning": "text-yellow-400",
    "budget:exceeded": "text-red-500",
  }

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No recent activity</p>
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto">
      {events.slice(0, 10).map((event, i) => (
        <div key={`${event.timestamp}-${i}`} className="flex items-start gap-2 text-sm">
          <span className={eventColor[event.type] ?? "text-muted-foreground"}>
            {event.type}
          </span>
          <RelativeTime date={event.timestamp} />
        </div>
      ))}
    </div>
  )
}

function SpendingChart() {
  const { data: spending } = useSpendingAnalytics({ period: "daily" })

  if (!spending || spending.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No spending data</p>
  }

  const maxSpent = Math.max(...spending.map((d) => Number(d.totalSpent)), 1)

  return (
    <div className="flex items-end gap-1 h-32">
      {spending.slice(-7).map((d) => {
        const pct = (Number(d.totalSpent) / maxSpent) * 100
        return (
          <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-primary/80 rounded-t"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span className="text-[10px] text-muted-foreground">
              {d.period.slice(-5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function DashboardPage() {
  const { data: wallets } = useWallets()
  const { data: agents } = useAgents()
  const { data: stats } = usePaymentStats()
  const { data: topAgents } = useAgentAnalytics({ limit: 5, sortBy: "spent" })

  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0
  const totalSpent = stats ? Number(stats.totalSpent) : 0

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Wallets"
          value={wallets?.length ?? 0}
          description="total"
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Agents"
          value={activeAgents}
          description={`${agents?.length ?? 0} total`}
          icon={<Bot className="h-4 w-4" />}
        />
        <MetricCard
          label="Total Spent"
          value={formatUsd(totalSpent)}
          description={`${stats?.totalTransactions ?? 0} transactions`}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <MetricCard
          label="Domains"
          value={stats ? Object.keys(stats.byDomain).length : 0}
          description="unique"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Spending (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart />
          </CardContent>
        </Card>
      </div>

      {topAgents && topAgents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Agents by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Agent</th>
                    <th className="text-left py-2">Wallet</th>
                    <th className="text-right py-2">Transactions</th>
                    <th className="text-right py-2">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((a) => (
                    <tr key={a.agentId} className="border-b border-border/50">
                      <td className="py-2">{a.name}</td>
                      <td className="py-2 text-muted-foreground">{a.walletId}</td>
                      <td className="py-2 text-right">{a.transactionCount}</td>
                      <td className="py-2 text-right font-mono">
                        {formatUsd(Number(a.totalSpent))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
