import type { WalletRecord } from "../types.js"

export type WalletsStore = {
  create: (wallet: WalletRecord) => WalletRecord
  get: (id: string) => WalletRecord | undefined
  list: () => WalletRecord[]
  update: (id: string, data: Partial<WalletRecord>) => WalletRecord | undefined
  delete: (id: string) => boolean
  clear: () => void
}

export function createWalletsStore(): WalletsStore {
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
