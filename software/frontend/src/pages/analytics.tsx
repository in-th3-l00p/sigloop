import { useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useSpendingAnalytics, useAgentAnalytics } from "@/hooks/use-analytics"
import { useWallets } from "@/hooks/use-wallets"
import { useAgents } from "@/hooks/use-agents"
import { formatUsd } from "@/lib/utils"

export function AnalyticsPage() {
  const [period, setPeriod] = useState("daily")
  const [walletFilter, setWalletFilter] = useState("")
  const [agentFilter, setAgentFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState("spent")

  const { data: spending } = useSpendingAnalytics({
    period,
    walletId: walletFilter || undefined,
    agentId: agentFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })
  const { data: agentActivity } = useAgentAnalytics({
    walletId: walletFilter || undefined,
    limit: 10,
    sortBy,
  })
  const { data: wallets } = useWallets()
  const { data: agents } = useAgents()

  const maxSpent = spending ? Math.max(...spending.map((d) => Number(d.totalSpent)), 1) : 1

  return (
    <div>
      <PageHeader title="Analytics" />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-32">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
            <Select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)} className="w-40">
              <option value="">All Wallets</option>
              {wallets?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-40">
              <option value="">All Agents</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Spending Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {spending && spending.length > 0 ? (
            <div className="flex items-end gap-1 h-48">
              {spending.map((d) => {
                const pct = (Number(d.totalSpent) / maxSpent) * 100
                return (
                  <div key={d.period} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatUsd(Number(d.totalSpent))}
                    </span>
                    <div
                      className="w-full bg-primary/80 rounded-t min-h-[2px]"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {d.period.length > 10 ? d.period.slice(-8) : d.period}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No spending data for this period</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Agent Activity</CardTitle>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40">
              <option value="spent">Sort by Spent</option>
              <option value="transactions">Sort by Transactions</option>
              <option value="recent">Sort by Recent</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Agent</th>
                  <th className="text-left py-2">Wallet</th>
                  <th className="text-right py-2">Txns</th>
                  <th className="text-right py-2">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {agentActivity && agentActivity.length > 0 ? (
                  agentActivity.map((a, i) => (
                    <tr key={a.agentId} className="border-b border-border/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2">{a.name}</td>
                      <td className="py-2 text-muted-foreground">
                        {wallets?.find((w) => w.id === a.walletId)?.name ?? a.walletId}
                      </td>
                      <td className="py-2 text-right">{a.transactionCount}</td>
                      <td className="py-2 text-right font-mono">{formatUsd(Number(a.totalSpent))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No agent activity</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
