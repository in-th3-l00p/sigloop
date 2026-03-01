import type { Database } from "../db/database.js"
import type { WalletRecord } from "../types.js"

export type WalletsStore = {
  create: (wallet: WalletRecord) => WalletRecord
  get: (id: string) => WalletRecord | undefined
  list: () => WalletRecord[]
  update: (id: string, data: Partial<WalletRecord>) => WalletRecord | undefined
  delete: (id: string) => boolean
  clear: () => void
}

type WalletRow = {
  id: string
  address: string
  name: string
  chain_id: number
  created_at: string
  updated_at: string
}

function rowToRecord(row: WalletRow): WalletRecord {
  return {
    id: row.id,
    address: row.address as WalletRecord["address"],
    name: row.name,
    chainId: row.chain_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createWalletsStore(db?: Database): WalletsStore {
  if (!db) {
    const store = new Map<string, WalletRecord>()
    return {
      create(wallet) {
        store.set(wallet.id, wallet)
        return wallet
      },
      get(id) {
        return store.get(id)
      },
      list() {
        return Array.from(store.values())
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
    create(wallet) {
      db.run(
        "INSERT INTO wallets (id, address, name, chain_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [wallet.id, wallet.address, wallet.name, wallet.chainId, wallet.createdAt, wallet.updatedAt],
      )
      return wallet
    },
    get(id) {
      const row = db.get<WalletRow>("SELECT * FROM wallets WHERE id = ?", [id])
      return row ? rowToRecord(row) : undefined
    },
    list() {
      return db.all<WalletRow>("SELECT * FROM wallets ORDER BY created_at DESC").map(rowToRecord)
    },
    update(id, data) {
      const existing = this.get(id)
      if (!existing) return undefined
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() }
      db.run(
        "UPDATE wallets SET address = ?, name = ?, chain_id = ?, updated_at = ? WHERE id = ?",
        [updated.address, updated.name, updated.chainId, updated.updatedAt, id],
      )
      return updated
    },
    delete(id) {
      const result = db.run("DELETE FROM wallets WHERE id = ?", [id])
      return result.changes > 0
    },
    clear() {
      db.run("DELETE FROM wallets")
    },
  }
}
