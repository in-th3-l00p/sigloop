import { randomUUID } from "node:crypto"
import { createBudgetTracker } from "@sigloop/x402"
import type { PaymentsStore } from "../stores/payments.js"
import type { AgentsStore } from "../stores/agents.js"
import type { WalletsStore } from "../stores/wallets.js"
import type { EventsStore } from "../stores/events.js"
import type {
  PaymentRecord,
  RecordPaymentRequest,
  PaymentFilters,
  PaymentStats,
  BudgetStateResponse,
  CheckBudgetRequest,
} from "../types.js"

export type PaymentService = {
  record: (request: RecordPaymentRequest) => PaymentRecord
  list: (filters?: PaymentFilters) => PaymentRecord[]
  getStats: () => PaymentStats
  getBudget: (walletId: string) => BudgetStateResponse
  checkBudget: (walletId: string, request: CheckBudgetRequest) => { allowed: boolean; reason?: string }
}

export type PaymentServiceDeps = {
  paymentsStore: PaymentsStore
  agentsStore: AgentsStore
  walletsStore: WalletsStore
  eventsStore: EventsStore
}

export function createPaymentService(deps: PaymentServiceDeps): PaymentService {
  const { paymentsStore, agentsStore, walletsStore, eventsStore } = deps
  const budgetTrackers = new Map<string, ReturnType<typeof createBudgetTracker>>()

  function getOrCreateTracker(walletId: string) {
    let tracker = budgetTrackers.get(walletId)
    if (!tracker) {
      tracker = createBudgetTracker({
        maxPerRequest: 10000000n,
        dailyBudget: 100000000n,
        totalBudget: 1000000000n,
      })
      budgetTrackers.set(walletId, tracker)
    }
    return tracker
  }

  return {
    record(request) {
      if (!request.agentId) throw new Error("agentId is required")
      if (!request.walletId) throw new Error("walletId is required")
      if (!request.domain) throw new Error("domain is required")
      if (!request.amount) throw new Error("amount is required")

      const agent = agentsStore.get(request.agentId)
      if (!agent) throw new Error("Agent not found")
      if (agent.walletId !== request.walletId) throw new Error("Agent does not belong to wallet")

      const wallet = walletsStore.get(request.walletId)
      if (!wallet) throw new Error("Wallet not found")

      const id = randomUUID()
      const now = new Date().toISOString()

      const payment: PaymentRecord = {
        id,
        agentId: request.agentId,
        walletId: request.walletId,
        domain: request.domain,
        amount: request.amount,
        currency: request.currency || "USDC",
        asset: request.asset || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        status: "completed",
        txHash: null,
        metadata: request.metadata || {},
        createdAt: now,
      }

      paymentsStore.append(payment)

      const tracker = getOrCreateTracker(request.walletId)
      tracker.recordPayment({
        url: `https://${request.domain}`,
        domain: request.domain,
        amount: BigInt(request.amount),
        asset: payment.asset as any,
        timestamp: Math.floor(Date.now() / 1000),
      })

      eventsStore.broadcast({
        type: "payment:recorded",
        timestamp: now,
        data: { paymentId: id, agentId: request.agentId, walletId: request.walletId, amount: request.amount, domain: request.domain },
      })

      const state = tracker.getState()
      const dailyBudget = 100000000n
      const totalBudget = 1000000000n
      if (state.dailySpent * 100n / dailyBudget >= 80n) {
        eventsStore.broadcast({
          type: "budget:warning",
          timestamp: now,
          data: { walletId: request.walletId, dailySpent: state.dailySpent.toString(), dailyBudget: dailyBudget.toString() },
        })
      }

      return payment
    },

    list(filters) {
      let payments = paymentsStore.list()

      if (filters?.agentId) {
        payments = payments.filter((p) => p.agentId === filters.agentId)
      }
      if (filters?.walletId) {
        payments = payments.filter((p) => p.walletId === filters.walletId)
      }
      if (filters?.domain) {
        payments = payments.filter((p) => p.domain === filters.domain)
      }
      if (filters?.startDate && filters?.endDate) {
        const start = new Date(filters.startDate).getTime()
        const end = new Date(filters.endDate).getTime()
        payments = payments.filter((p) => {
          const t = new Date(p.createdAt).getTime()
          return t >= start && t <= end
        })
      }

      return payments
    },

    getStats() {
      const agg = paymentsStore.aggregate()
      const payments = paymentsStore.list().filter((p) => p.status === "completed")

      const byPeriod: Record<string, { spent: number; count: number }> = {}
      for (const p of payments) {
        const day = p.createdAt.slice(0, 10)
        if (!byPeriod[day]) byPeriod[day] = { spent: 0, count: 0 }
        byPeriod[day].spent += parseFloat(p.amount)
        byPeriod[day].count++
      }

      const byAgent: Record<string, { spent: string; count: number }> = {}
      for (const [k, v] of Object.entries(agg.byAgent)) {
        byAgent[k] = { spent: v.spent.toFixed(6), count: v.count }
      }

      const byDomain: Record<string, { spent: string; count: number }> = {}
      for (const [k, v] of Object.entries(agg.byDomain)) {
        byDomain[k] = { spent: v.spent.toFixed(6), count: v.count }
      }

      return {
        totalSpent: agg.totalSpent.toFixed(6),
        totalTransactions: agg.totalCount,
        byAgent,
        byDomain,
        byPeriod: Object.entries(byPeriod)
          .map(([period, data]) => ({ period, spent: data.spent.toFixed(6), count: data.count }))
          .sort((a, b) => a.period.localeCompare(b.period)),
      }
    },

    getBudget(walletId) {
      const wallet = walletsStore.get(walletId)
      if (!wallet) throw new Error("Wallet not found")

      const tracker = getOrCreateTracker(walletId)
      const state = tracker.getState()

      return {
        walletId,
        totalSpent: state.totalSpent.toString(),
        dailySpent: state.dailySpent.toString(),
        lastDailyReset: state.lastDailyReset,
        remaining: tracker.getRemainingBudget().toString(),
      }
    },

    checkBudget(walletId, request) {
      const wallet = walletsStore.get(walletId)
      if (!wallet) throw new Error("Wallet not found")
      if (!request.amount) throw new Error("amount is required")

      const tracker = getOrCreateTracker(walletId)
      const allowed = tracker.canSpend(BigInt(request.amount), request.domain)

      if (!allowed) {
        eventsStore.broadcast({
          type: "budget:exceeded",
          timestamp: new Date().toISOString(),
          data: { walletId, amount: request.amount, domain: request.domain },
        })
        return { allowed: false, reason: "Budget exceeded" }
      }

      return { allowed: true }
    },
  }
}
