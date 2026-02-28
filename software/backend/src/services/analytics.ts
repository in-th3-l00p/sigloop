import type { PaymentsStore } from "../stores/payments.js"
import type { AgentsStore } from "../stores/agents.js"
import type {
  SpendingDataPoint,
  AgentActivityEntry,
  SpendingFilters,
  AgentActivityFilters,
} from "../types.js"

export type AnalyticsService = {
  getSpending: (params?: SpendingFilters) => SpendingDataPoint[]
  getAgentActivity: (params?: AgentActivityFilters) => AgentActivityEntry[]
}

export type AnalyticsServiceDeps = {
  paymentsStore: PaymentsStore
  agentsStore: AgentsStore
}

function getBucketKey(date: Date, period: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const h = String(date.getHours()).padStart(2, "0")

  switch (period) {
    case "hourly":
      return `${y}-${m}-${d}T${h}`
    case "daily":
      return `${y}-${m}-${d}`
    case "weekly": {
      const dayOfWeek = date.getDay()
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - dayOfWeek)
      const wy = weekStart.getFullYear()
      const wm = String(weekStart.getMonth() + 1).padStart(2, "0")
      const wd = String(weekStart.getDate()).padStart(2, "0")
      return `${wy}-W${wm}-${wd}`
    }
    case "monthly":
      return `${y}-${m}`
    default:
      return `${y}-${m}-${d}`
  }
}

export function createAnalyticsService(deps: AnalyticsServiceDeps): AnalyticsService {
  const { paymentsStore, agentsStore } = deps

  return {
    getSpending(params) {
      const period = params?.period || "daily"
      let payments = paymentsStore.list().filter((p) => p.status === "completed")

      if (params?.walletId) {
        payments = payments.filter((p) => p.walletId === params.walletId)
      }
      if (params?.agentId) {
        payments = payments.filter((p) => p.agentId === params.agentId)
      }
      if (params?.startDate) {
        const start = new Date(params.startDate).getTime()
        payments = payments.filter((p) => new Date(p.createdAt).getTime() >= start)
      }
      if (params?.endDate) {
        const end = new Date(params.endDate).getTime()
        payments = payments.filter((p) => new Date(p.createdAt).getTime() <= end)
      }

      const buckets: Record<string, { spent: number; count: number }> = {}
      for (const p of payments) {
        const key = getBucketKey(new Date(p.createdAt), period)
        if (!buckets[key]) buckets[key] = { spent: 0, count: 0 }
        buckets[key].spent += parseFloat(p.amount)
        buckets[key].count++
      }

      return Object.entries(buckets)
        .map(([period, data]) => ({
          period,
          totalSpent: data.spent.toFixed(6),
          transactionCount: data.count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period))
    },

    getAgentActivity(params) {
      const limit = params?.limit || 50
      const sortBy = params?.sortBy || "spent"

      let agents = agentsStore.list()
      if (params?.walletId) {
        agents = agents.filter((a) => a.walletId === params.walletId)
      }

      const entries: AgentActivityEntry[] = agents.map((agent) => {
        const payments = paymentsStore
          .listByAgent(agent.id)
          .filter((p) => p.status === "completed")

        const totalSpent = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
        const domains = [...new Set(payments.map((p) => p.domain))]
        const lastPayment = payments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]

        return {
          agentId: agent.id,
          name: agent.name,
          walletId: agent.walletId,
          totalSpent: totalSpent.toFixed(6),
          transactionCount: payments.length,
          lastActive: lastPayment?.createdAt || null,
          domains,
        }
      })

      entries.sort((a, b) => {
        if (sortBy === "spent") return parseFloat(b.totalSpent) - parseFloat(a.totalSpent)
        if (sortBy === "transactions") return b.transactionCount - a.transactionCount
        if (sortBy === "recent") {
          if (!a.lastActive) return 1
          if (!b.lastActive) return -1
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        }
        return 0
      })

      return entries.slice(0, limit)
    },
  }
}
