import type { Database } from "../db/database.js"
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

type PaymentRow = {
  id: string
  agent_id: string
  wallet_id: string
  domain: string
  amount: string
  currency: string
  asset: string
  status: string
  tx_hash: string | null
  metadata: string
  created_at: string
}

function rowToRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    walletId: row.wallet_id,
    domain: row.domain,
    amount: row.amount,
    currency: row.currency,
    asset: row.asset,
    status: row.status as PaymentRecord["status"],
    txHash: row.tx_hash,
    metadata: JSON.parse(row.metadata),
    createdAt: row.created_at,
  }
}

export function createPaymentsStore(db?: Database): PaymentsStore {
  if (!db) {
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

  return {
    append(payment) {
      db.run(
        "INSERT INTO payments (id, agent_id, wallet_id, domain, amount, currency, asset, status, tx_hash, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [payment.id, payment.agentId, payment.walletId, payment.domain, payment.amount, payment.currency, payment.asset, payment.status, payment.txHash, JSON.stringify(payment.metadata), payment.createdAt],
      )
      return payment
    },
    get(id) {
      const row = db.get<PaymentRow>("SELECT * FROM payments WHERE id = ?", [id])
      return row ? rowToRecord(row) : undefined
    },
    list() {
      return db.all<PaymentRow>("SELECT * FROM payments ORDER BY created_at DESC").map(rowToRecord)
    },
    listByAgent(agentId) {
      return db.all<PaymentRow>("SELECT * FROM payments WHERE agent_id = ? ORDER BY created_at DESC", [agentId]).map(rowToRecord)
    },
    listByWallet(walletId) {
      return db.all<PaymentRow>("SELECT * FROM payments WHERE wallet_id = ? ORDER BY created_at DESC", [walletId]).map(rowToRecord)
    },
    listByDomain(domain) {
      return db.all<PaymentRow>("SELECT * FROM payments WHERE domain = ? ORDER BY created_at DESC", [domain]).map(rowToRecord)
    },
    listByDateRange(start, end) {
      return db.all<PaymentRow>("SELECT * FROM payments WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC", [start, end]).map(rowToRecord)
    },
    aggregate() {
      const rows = db.all<PaymentRow>("SELECT * FROM payments WHERE status = 'completed'")
      const byAgent: Record<string, { spent: number; count: number }> = {}
      const byDomain: Record<string, { spent: number; count: number }> = {}
      let totalSpent = 0
      let totalCount = 0
      for (const row of rows) {
        const amount = parseFloat(row.amount)
        totalSpent += amount
        totalCount++
        if (!byAgent[row.agent_id]) byAgent[row.agent_id] = { spent: 0, count: 0 }
        byAgent[row.agent_id].spent += amount
        byAgent[row.agent_id].count++
        if (!byDomain[row.domain]) byDomain[row.domain] = { spent: 0, count: 0 }
        byDomain[row.domain].spent += amount
        byDomain[row.domain].count++
      }
      return { totalSpent, totalCount, byAgent, byDomain }
    },
    clear() {
      db.run("DELETE FROM payments")
    },
  }
}
