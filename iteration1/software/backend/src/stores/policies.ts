import type { Database } from "../db/database.js"
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

type PolicyRow = {
  id: string
  name: string
  type: string
  config: string
  created_at: string
  updated_at: string
}

function rowToRecord(row: PolicyRow): PolicyRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type as PolicyType,
    config: JSON.parse(row.config),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createPoliciesStore(db?: Database): PoliciesStore {
  if (!db) {
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

  return {
    create(policy) {
      db.run(
        "INSERT INTO policies (id, name, type, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [policy.id, policy.name, policy.type, JSON.stringify(policy.config), policy.createdAt, policy.updatedAt],
      )
      return policy
    },
    get(id) {
      const row = db.get<PolicyRow>("SELECT * FROM policies WHERE id = ?", [id])
      return row ? rowToRecord(row) : undefined
    },
    list() {
      return db.all<PolicyRow>("SELECT * FROM policies ORDER BY created_at DESC").map(rowToRecord)
    },
    listByType(type) {
      return db.all<PolicyRow>("SELECT * FROM policies WHERE type = ? ORDER BY created_at DESC", [type]).map(rowToRecord)
    },
    update(id, data) {
      const existing = this.get(id)
      if (!existing) return undefined
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
      db.run(
        "UPDATE policies SET name = ?, type = ?, config = ?, updated_at = ? WHERE id = ?",
        [updated.name, updated.type, JSON.stringify(updated.config), updated.updatedAt, id],
      )
      return updated
    },
    delete(id) {
      const result = db.run("DELETE FROM policies WHERE id = ?", [id])
      return result.changes > 0
    },
    clear() {
      db.run("DELETE FROM policies")
    },
  }
}
