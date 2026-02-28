import { describe, it, expect, beforeEach } from "vitest"
import { createWalletsStore } from "../../../src/stores/wallets.js"
import type { WalletRecord } from "../../../src/types.js"

function makeWallet(overrides?: Partial<WalletRecord>): WalletRecord {
  return {
    id: "w-1",
    address: "0x1111111111111111111111111111111111111111",
    name: "Test Wallet",
    chainId: 8453,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("createWalletsStore", () => {
  let store: ReturnType<typeof createWalletsStore>

  beforeEach(() => {
    store = createWalletsStore()
  })

  it("creates and retrieves a wallet", () => {
    const wallet = makeWallet()
    store.create(wallet)
    expect(store.get("w-1")).toEqual(wallet)
  })

  it("returns undefined for missing wallet", () => {
    expect(store.get("nonexistent")).toBeUndefined()
  })

  it("lists all wallets", () => {
    store.create(makeWallet({ id: "w-1" }))
    store.create(makeWallet({ id: "w-2", name: "Second" }))
    expect(store.list()).toHaveLength(2)
  })

  it("updates a wallet", () => {
    store.create(makeWallet())
    const updated = store.update("w-1", { name: "Updated" })
    expect(updated?.name).toBe("Updated")
    expect(store.get("w-1")?.name).toBe("Updated")
  })

  it("returns undefined when updating nonexistent", () => {
    expect(store.update("nope", { name: "x" })).toBeUndefined()
  })

  it("deletes a wallet", () => {
    store.create(makeWallet())
    expect(store.delete("w-1")).toBe(true)
    expect(store.get("w-1")).toBeUndefined()
  })

  it("returns false when deleting nonexistent", () => {
    expect(store.delete("nope")).toBe(false)
  })

  it("clears all wallets", () => {
    store.create(makeWallet({ id: "w-1" }))
    store.create(makeWallet({ id: "w-2" }))
    store.clear()
    expect(store.list()).toHaveLength(0)
  })
})
