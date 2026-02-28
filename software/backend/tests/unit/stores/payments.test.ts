import { describe, it, expect, beforeEach } from "vitest"
import { createPaymentsStore } from "../../../src/stores/payments.js"
import type { PaymentRecord } from "../../../src/types.js"

function makePayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: "pay-1",
    agentId: "a-1",
    walletId: "w-1",
    domain: "api.example.com",
    amount: "100.000000",
    currency: "USDC",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    status: "completed",
    txHash: null,
    metadata: {},
    createdAt: "2025-01-15T12:00:00.000Z",
    ...overrides,
  }
}

describe("createPaymentsStore", () => {
  let store: ReturnType<typeof createPaymentsStore>

  beforeEach(() => {
    store = createPaymentsStore()
  })

  it("appends and retrieves a payment", () => {
    const payment = makePayment()
    store.append(payment)
    expect(store.get("pay-1")).toEqual(payment)
  })

  it("lists all payments", () => {
    store.append(makePayment({ id: "pay-1" }))
    store.append(makePayment({ id: "pay-2" }))
    expect(store.list()).toHaveLength(2)
  })

  it("lists by agent", () => {
    store.append(makePayment({ id: "pay-1", agentId: "a-1" }))
    store.append(makePayment({ id: "pay-2", agentId: "a-2" }))
    expect(store.listByAgent("a-1")).toHaveLength(1)
  })

  it("lists by wallet", () => {
    store.append(makePayment({ id: "pay-1", walletId: "w-1" }))
    store.append(makePayment({ id: "pay-2", walletId: "w-2" }))
    expect(store.listByWallet("w-1")).toHaveLength(1)
  })

  it("lists by domain", () => {
    store.append(makePayment({ id: "pay-1", domain: "api.example.com" }))
    store.append(makePayment({ id: "pay-2", domain: "other.com" }))
    expect(store.listByDomain("api.example.com")).toHaveLength(1)
  })

  it("lists by date range", () => {
    store.append(makePayment({ id: "pay-1", createdAt: "2025-01-15T12:00:00.000Z" }))
    store.append(makePayment({ id: "pay-2", createdAt: "2025-01-20T12:00:00.000Z" }))
    store.append(makePayment({ id: "pay-3", createdAt: "2025-02-01T12:00:00.000Z" }))
    const results = store.listByDateRange("2025-01-14T00:00:00.000Z", "2025-01-21T00:00:00.000Z")
    expect(results).toHaveLength(2)
  })

  it("aggregates completed payments", () => {
    store.append(makePayment({ id: "pay-1", amount: "100.000000", status: "completed" }))
    store.append(makePayment({ id: "pay-2", amount: "200.000000", status: "completed", agentId: "a-2", domain: "other.com" }))
    store.append(makePayment({ id: "pay-3", amount: "50.000000", status: "pending" }))

    const agg = store.aggregate()
    expect(agg.totalSpent).toBe(300)
    expect(agg.totalCount).toBe(2)
    expect(Object.keys(agg.byAgent)).toHaveLength(2)
    expect(Object.keys(agg.byDomain)).toHaveLength(2)
  })

  it("clears all payments", () => {
    store.append(makePayment({ id: "pay-1" }))
    store.clear()
    expect(store.list()).toHaveLength(0)
  })
})
