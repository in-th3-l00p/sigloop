import { useState } from "react"
import { CreditCard, Globe, Hash, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { MetricCard } from "@/components/shared/metric-card"
import { BudgetBar } from "@/components/shared/budget-bar"
import { RelativeTime } from "@/components/shared/relative-time"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { usePayments, usePaymentStats } from "@/hooks/use-payments"
import { useWallets } from "@/hooks/use-wallets"
import { useAgents } from "@/hooks/use-agents"
import { formatUsd } from "@/lib/utils"

export function PaymentsPage() {
  const [agentFilter, setAgentFilter] = useState("")
  const [walletFilter, setWalletFilter] = useState("")
  const [domainFilter, setDomainFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = {
    agentId: agentFilter || undefined,
    walletId: walletFilter || undefined,
    domain: domainFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }

  const { data: payments } = usePayments(filters)
  const { data: stats } = usePaymentStats()
  const { data: wallets } = useWallets()
  const { data: agents } = useAgents()

  const totalSpent = stats ? Number(stats.totalSpent) : 0
  const todayPayments = payments?.filter((p) => {
    const today = new Date().toISOString().slice(0, 10)
    return p.createdAt.startsWith(today)
  })
  const todaySpent = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

  return (
    <div>
      <PageHeader title="Payments" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard label="Total" value={formatUsd(totalSpent)} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Today" value={formatUsd(todaySpent)} icon={<CreditCard className="h-4 w-4" />} />
        <MetricCard label="Transactions" value={stats?.totalTransactions ?? 0} icon={<Hash className="h-4 w-4" />} />
        <MetricCard label="Domains" value={stats ? Object.keys(stats.byDomain).length : 0} icon={<Globe className="h-4 w-4" />} />
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="w-40">
              <option value="">All Agents</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <Select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)} className="w-40">
              <option value="">All Wallets</option>
              {wallets?.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Input
              placeholder="Domain filter..."
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-48"
            />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left p-4">Time</th>
                  <th className="text-left p-4">Agent</th>
                  <th className="text-left p-4">Wallet</th>
                  <th className="text-left p-4">Domain</th>
                  <th className="text-right p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="p-4"><RelativeTime date={p.createdAt} /></td>
                      <td className="p-4">{agents?.find((a) => a.id === p.agentId)?.name ?? p.agentId}</td>
                      <td className="p-4 text-muted-foreground">{wallets?.find((w) => w.id === p.walletId)?.name ?? p.walletId}</td>
                      <td className="p-4">{p.domain}</td>
                      <td className="p-4 text-right font-mono">{formatUsd(Number(p.amount))} {p.currency}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {wallets && wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Budget Status by Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wallets.map((w) => (
              <BudgetBar key={w.id} spent={0} limit={100} label={w.name} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
