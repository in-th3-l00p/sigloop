import { describe, it, expect, beforeEach } from "vitest"
import { createPoliciesStore } from "../../../src/stores/policies.js"
import type { PolicyRecord } from "../../../src/types.js"

function makePolicy(overrides?: Partial<PolicyRecord>): PolicyRecord {
  return {
    id: "p-1",
    name: "Test Policy",
    type: "agent",
    config: {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: "1000000",
      dailyLimit: "10000000",
      weeklyLimit: "50000000",
      validAfter: 0,
      validUntil: Math.floor(Date.now() / 1000) + 86400,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("createPoliciesStore", () => {
  let store: ReturnType<typeof createPoliciesStore>

  beforeEach(() => {
    store = createPoliciesStore()
  })

  it("creates and retrieves a policy", () => {
    const policy = makePolicy()
    store.create(policy)
    expect(store.get("p-1")).toEqual(policy)
  })

  it("lists all policies", () => {
    store.create(makePolicy({ id: "p-1" }))
    store.create(makePolicy({ id: "p-2" }))
    expect(store.list()).toHaveLength(2)
  })

  it("lists policies by type", () => {
    store.create(makePolicy({ id: "p-1", type: "agent" }))
    store.create(makePolicy({ id: "p-2", type: "x402" }))
    store.create(makePolicy({ id: "p-3", type: "agent" }))
    expect(store.listByType("agent")).toHaveLength(2)
    expect(store.listByType("x402")).toHaveLength(1)
  })

  it("updates a policy", () => {
    store.create(makePolicy())
    const updated = store.update("p-1", { name: "Updated" })
    expect(updated?.name).toBe("Updated")
  })

  it("deletes a policy", () => {
    store.create(makePolicy())
    expect(store.delete("p-1")).toBe(true)
    expect(store.get("p-1")).toBeUndefined()
  })

  it("clears all policies", () => {
    store.create(makePolicy({ id: "p-1" }))
    store.create(makePolicy({ id: "p-2" }))
    store.clear()
    expect(store.list()).toHaveLength(0)
  })
})
