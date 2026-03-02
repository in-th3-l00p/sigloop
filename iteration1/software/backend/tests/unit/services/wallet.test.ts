import { describe, it, expect, beforeEach } from "vitest"
import { createWalletService } from "../../../src/services/wallet.js"
import { createWalletsStore } from "../../../src/stores/wallets.js"
import { createKeysService } from "../../../src/services/keys.js"
import { createEventsStore } from "../../../src/stores/events.js"
import { createConfig } from "../../../src/config.js"

describe("createWalletService", () => {
  let service: ReturnType<typeof createWalletService>

  beforeEach(() => {
    service = createWalletService({
      walletsStore: createWalletsStore(),
      keysService: createKeysService(),
      eventsStore: createEventsStore(),
      config: createConfig(),
    })
  })

  it("creates a wallet with generated address", () => {
    const wallet = service.create({ name: "My Wallet" })
    expect(wallet.id).toBeTruthy()
    expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(wallet.name).toBe("My Wallet")
    expect(wallet.chainId).toBe(8453)
  })

  it("creates wallet with custom chainId", () => {
    const wallet = service.create({ name: "ETH Wallet", chainId: 1 })
    expect(wallet.chainId).toBe(1)
  })

  it("throws when name is missing", () => {
    expect(() => service.create({ name: "" })).toThrow("required")
  })

  it("gets a wallet by id", () => {
    const created = service.create({ name: "Test" })
    const retrieved = service.get(created.id)
    expect(retrieved.id).toBe(created.id)
  })

  it("throws when wallet not found", () => {
    expect(() => service.get("nonexistent")).toThrow("not found")
  })

  it("lists all wallets", () => {
    service.create({ name: "W1" })
    service.create({ name: "W2" })
    expect(service.list()).toHaveLength(2)
  })

  it("deletes a wallet", () => {
    const wallet = service.create({ name: "To Delete" })
    service.delete(wallet.id)
    expect(() => service.get(wallet.id)).toThrow("not found")
  })

  it("throws when deleting nonexistent wallet", () => {
    expect(() => service.delete("nope")).toThrow("not found")
  })

  it("signs a message", async () => {
    const wallet = service.create({ name: "Signer" })
    const sig = await service.signMessage(wallet.id, { message: "hello" })
    expect(sig).toMatch(/^0x/)
  })

  it("throws when signing with missing message", async () => {
    const wallet = service.create({ name: "Signer" })
    await expect(service.signMessage(wallet.id, { message: "" })).rejects.toThrow("required")
  })
})
