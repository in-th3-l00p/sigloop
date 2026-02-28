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

export function createAgentsStore(): AgentsStore {
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
