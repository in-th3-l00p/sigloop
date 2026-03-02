import type { Database } from "../db/database.js"
import type { AgentRecord } from "../types.js"

export type AgentsStore = {
  create: (agent: AgentRecord) => AgentRecord
  get: (id: string) => AgentRecord | undefined
  list: () => AgentRecord[]
  listByWallet: (walletId: string) => AgentRecord[]
  update: (id: string, data: Partial<AgentRecord>) => AgentRecord | undefined
  delete: (id: string) => boolean
  deleteByWallet: (walletId: string) => number
  clear: () => void
}

type AgentRow = {
  id: string
  wallet_id: string
  name: string
  address: string
  session_private_key: string
  policy_id: string | null
  status: string
  expires_at: number
  created_at: string
  updated_at: string
  revoked_at: string | null
}

function rowToRecord(row: AgentRow): AgentRecord {
  return {
    id: row.id,
    walletId: row.wallet_id,
    name: row.name,
    address: row.address as AgentRecord["address"],
    sessionPrivateKey: row.session_private_key as AgentRecord["sessionPrivateKey"],
    policyId: row.policy_id,
    status: row.status as AgentRecord["status"],
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
  }
}

export function createAgentsStore(db?: Database): AgentsStore {
  if (!db) {
    const store = new Map<string, AgentRecord>()
    return {
      create(agent) {
        store.set(agent.id, agent)
        return agent
      },
      get(id) {
        return store.get(id)
      },
      list() {
        return Array.from(store.values())
      },
      listByWallet(walletId) {
        return Array.from(store.values()).filter((a) => a.walletId === walletId)
      },
      update(id, data) {
        const existing = store.get(id)
        if (!existing) return undefined
        const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
        store.set(id, updated)
        return updated
      },
      delete(id) {
        return store.delete(id)
      },
      deleteByWallet(walletId) {
        let count = 0
        for (const [id, agent] of store) {
          if (agent.walletId === walletId) {
            store.delete(id)
            count++
          }
        }
        return count
      },
      clear() {
        store.clear()
      },
    }
  }

  return {
    create(agent) {
      db.run(
        "INSERT INTO agents (id, wallet_id, name, address, session_private_key, policy_id, status, expires_at, created_at, updated_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [agent.id, agent.walletId, agent.name, agent.address, agent.sessionPrivateKey, agent.policyId, agent.status, agent.expiresAt, agent.createdAt, agent.updatedAt, agent.revokedAt],
      )
      return agent
    },
    get(id) {
      const row = db.get<AgentRow>("SELECT * FROM agents WHERE id = ?", [id])
      return row ? rowToRecord(row) : undefined
    },
    list() {
      return db.all<AgentRow>("SELECT * FROM agents ORDER BY created_at DESC").map(rowToRecord)
    },
    listByWallet(walletId) {
      return db.all<AgentRow>("SELECT * FROM agents WHERE wallet_id = ? ORDER BY created_at DESC", [walletId]).map(rowToRecord)
    },
    update(id, data) {
      const existing = this.get(id)
      if (!existing) return undefined
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
      db.run(
        "UPDATE agents SET wallet_id = ?, name = ?, address = ?, session_private_key = ?, policy_id = ?, status = ?, expires_at = ?, updated_at = ?, revoked_at = ? WHERE id = ?",
        [updated.walletId, updated.name, updated.address, updated.sessionPrivateKey, updated.policyId, updated.status, updated.expiresAt, updated.updatedAt, updated.revokedAt, id],
      )
      return updated
    },
    delete(id) {
      const result = db.run("DELETE FROM agents WHERE id = ?", [id])
      return result.changes > 0
    },
    deleteByWallet(walletId) {
      const result = db.run("DELETE FROM agents WHERE wallet_id = ?", [walletId])
      return result.changes
    },
    clear() {
      db.run("DELETE FROM agents")
    },
  }
}
