import type { PaymentRecord } from "../types.js"

export type PaymentsStore = {
  append: (payment: PaymentRecord) => PaymentRecord
  get: (id: string) => PaymentRecord | undefined
  list: () => PaymentRecord[]
  listByAgent: (agentId: string) => PaymentRecord[]
  listByWallet: (walletId: string) => PaymentRecord[]
  listByDomain: (domain: string) => PaymentRecord[]
  listByDateRange: (start: string, end: string) => PaymentRecord[]
  aggregate: () => {
    totalSpent: number
    totalCount: number
    byAgent: Record<string, { spent: number; count: number }>
    byDomain: Record<string, { spent: number; count: number }>
  }
  clear: () => void
}

export function createPaymentsStore(): PaymentsStore {
  const store = new Map<string, PaymentRecord>()

  return {
    append(payment) {
      store.set(payment.id, payment)
      return payment
    },
    get(id) {
      return store.get(id)
    },
    list() {
      return Array.from(store.values())
    },
    listByAgent(agentId) {
      return Array.from(store.values()).filter((p) => p.agentId === agentId)
    },
    listByWallet(walletId) {
      return Array.from(store.values()).filter((p) => p.walletId === walletId)
    },
    listByDomain(domain) {
      return Array.from(store.values()).filter((p) => p.domain === domain)
    },
    listByDateRange(start, end) {
      const startTime = new Date(start).getTime()
      const endTime = new Date(end).getTime()
      return Array.from(store.values()).filter((p) => {
        const t = new Date(p.createdAt).getTime()
        return t >= startTime && t <= endTime
      })
    },
    aggregate() {
      const byAgent: Record<string, { spent: number; count: number }> = {}
      const byDomain: Record<string, { spent: number; count: number }> = {}
      let totalSpent = 0
      let totalCount = 0

      for (const payment of store.values()) {
        if (payment.status !== "completed") continue
        const amount = parseFloat(payment.amount)
        totalSpent += amount
        totalCount++

        if (!byAgent[payment.agentId]) byAgent[payment.agentId] = { spent: 0, count: 0 }
        byAgent[payment.agentId].spent += amount
        byAgent[payment.agentId].count++

        if (!byDomain[payment.domain]) byDomain[payment.domain] = { spent: 0, count: 0 }
        byDomain[payment.domain].spent += amount
        byDomain[payment.domain].count++
      }

      return { totalSpent, totalCount, byAgent, byDomain }
    },
    clear() {
      store.clear()
    },
  }
}
