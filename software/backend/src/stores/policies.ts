import type { PolicyRecord, PolicyType } from "../types.js"

export type PoliciesStore = {
  create: (policy: PolicyRecord) => PolicyRecord
  get: (id: string) => PolicyRecord | undefined
  list: () => PolicyRecord[]
  listByType: (type: PolicyType) => PolicyRecord[]
  update: (id: string, data: Partial<PolicyRecord>) => PolicyRecord | undefined
  delete: (id: string) => boolean
  clear: () => void
}

export function createPoliciesStore(): PoliciesStore {
  const store = new Map<string, PolicyRecord>()

  return {
    create(policy) {
      store.set(policy.id, policy)
      return policy
    },
    get(id) {
      return store.get(id)
    },
    list() {
      return Array.from(store.values())
    },
    listByType(type) {
      return Array.from(store.values()).filter((p) => p.type === type)
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
    clear() {
      store.clear()
    },
  }
}
