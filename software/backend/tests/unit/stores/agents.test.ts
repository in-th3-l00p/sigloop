import { describe, it, expect, beforeEach } from "vitest"
import { createAgentsStore } from "../../../src/stores/agents.js"
import type { AgentRecord } from "../../../src/types.js"

function makeAgent(overrides?: Partial<AgentRecord>): AgentRecord {
  return {
    id: "a-1",
    walletId: "w-1",
    name: "Test Agent",
    address: "0x2222222222222222222222222222222222222222",
    sessionPrivateKey: "0xabcd",
    policyId: null,
    status: "active",
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revokedAt: null,
    ...overrides,
  }
}

describe("createAgentsStore", () => {
  let store: ReturnType<typeof createAgentsStore>

  beforeEach(() => {
    store = createAgentsStore()
  })

  it("creates and retrieves an agent", () => {
    const agent = makeAgent()
    store.create(agent)
    expect(store.get("a-1")).toEqual(agent)
  })

  it("lists all agents", () => {
    store.create(makeAgent({ id: "a-1" }))
    store.create(makeAgent({ id: "a-2" }))
    expect(store.list()).toHaveLength(2)
  })

  it("lists agents by wallet", () => {
    store.create(makeAgent({ id: "a-1", walletId: "w-1" }))
    store.create(makeAgent({ id: "a-2", walletId: "w-2" }))
    store.create(makeAgent({ id: "a-3", walletId: "w-1" }))
    expect(store.listByWallet("w-1")).toHaveLength(2)
    expect(store.listByWallet("w-2")).toHaveLength(1)
  })

  it("updates an agent", () => {
    store.create(makeAgent())
    const updated = store.update("a-1", { status: "revoked" })
    expect(updated?.status).toBe("revoked")
  })

  it("deletes an agent", () => {
    store.create(makeAgent())
    expect(store.delete("a-1")).toBe(true)
    expect(store.get("a-1")).toBeUndefined()
  })

  it("deletes agents by wallet", () => {
    store.create(makeAgent({ id: "a-1", walletId: "w-1" }))
    store.create(makeAgent({ id: "a-2", walletId: "w-1" }))
    store.create(makeAgent({ id: "a-3", walletId: "w-2" }))
    expect(store.deleteByWallet("w-1")).toBe(2)
    expect(store.list()).toHaveLength(1)
  })

  it("clears all agents", () => {
    store.create(makeAgent({ id: "a-1" }))
    store.create(makeAgent({ id: "a-2" }))
    store.clear()
    expect(store.list()).toHaveLength(0)
  })
})
