import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createAgentsStore } from "../../../src/stores/agents.js"
import { createMemoryDatabase } from "../../../src/db/memory.js"
import { initSchema } from "../../../src/db/database.js"
import type { AgentRecord } from "../../../src/types.js"
import type { Database } from "../../../src/db/database.js"

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

function setupWallet(db: Database | undefined) {
  if (db) {
    db.run(
      "INSERT INTO wallets (id, address, name, chain_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["w-1", "0x1111111111111111111111111111111111111111", "W1", 8453, new Date().toISOString(), new Date().toISOString()],
    )
    db.run(
      "INSERT INTO wallets (id, address, name, chain_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ["w-2", "0x3333333333333333333333333333333333333333", "W2", 8453, new Date().toISOString(), new Date().toISOString()],
    )
  }
}

describe.each([
  { name: "memory", getDb: () => undefined as Database | undefined },
  {
    name: "sqlite",
    getDb: () => {
      const db = createMemoryDatabase()
      initSchema(db)
      return db
    },
  },
])("createAgentsStore ($name)", ({ getDb }) => {
  let store: ReturnType<typeof createAgentsStore>
  let db: Database | undefined

  beforeEach(() => {
    db = getDb()
    setupWallet(db)
    store = createAgentsStore(db)
  })

  afterEach(() => {
    db?.close()
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
