import { describe, it, expect, beforeEach } from "vitest"
import { createAnalyticsService } from "../../../src/services/analytics.js"
import { createPaymentsStore } from "../../../src/stores/payments.js"
import { createAgentsStore } from "../../../src/stores/agents.js"
import type { PaymentRecord, AgentRecord } from "../../../src/types.js"

function makePayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: "pay-1",
    agentId: "a-1",
    walletId: "w-1",
    domain: "api.example.com",
    amount: "100",
    currency: "USDC",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    status: "completed",
    txHash: null,
    metadata: {},
    createdAt: "2025-01-15T12:00:00.000Z",
    ...overrides,
  }
}

function makeAgent(overrides?: Partial<AgentRecord>): AgentRecord {
  return {
    id: "a-1",
    walletId: "w-1",
    name: "Agent 1",
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

describe("createAnalyticsService", () => {
  let service: ReturnType<typeof createAnalyticsService>
  let paymentsStore: ReturnType<typeof createPaymentsStore>
  let agentsStore: ReturnType<typeof createAgentsStore>

  beforeEach(() => {
    paymentsStore = createPaymentsStore()
    agentsStore = createAgentsStore()
    service = createAnalyticsService({ paymentsStore, agentsStore })
  })

  it("returns empty spending for no payments", () => {
    const result = service.getSpending()
    expect(result).toHaveLength(0)
  })

  it("aggregates spending by day", () => {
    paymentsStore.append(makePayment({ id: "p1", createdAt: "2025-01-15T10:00:00.000Z", amount: "100" }))
    paymentsStore.append(makePayment({ id: "p2", createdAt: "2025-01-15T14:00:00.000Z", amount: "200" }))
    paymentsStore.append(makePayment({ id: "p3", createdAt: "2025-01-16T10:00:00.000Z", amount: "50" }))

    const result = service.getSpending({ period: "daily" })
    expect(result).toHaveLength(2)
    expect(result[0].period).toBe("2025-01-15")
    expect(parseFloat(result[0].totalSpent)).toBe(300)
  })

  it("filters spending by walletId", () => {
    paymentsStore.append(makePayment({ id: "p1", walletId: "w-1", amount: "100" }))
    paymentsStore.append(makePayment({ id: "p2", walletId: "w-2", amount: "200" }))

    const result = service.getSpending({ walletId: "w-1" })
    expect(result).toHaveLength(1)
    expect(parseFloat(result[0].totalSpent)).toBe(100)
  })

  it("only counts completed payments", () => {
    paymentsStore.append(makePayment({ id: "p1", status: "completed", amount: "100" }))
    paymentsStore.append(makePayment({ id: "p2", status: "pending", amount: "200" }))

    const result = service.getSpending()
    expect(parseFloat(result[0].totalSpent)).toBe(100)
  })

  it("returns agent activity", () => {
    agentsStore.create(makeAgent({ id: "a-1", name: "Agent 1" }))
    agentsStore.create(makeAgent({ id: "a-2", name: "Agent 2" }))
    paymentsStore.append(makePayment({ id: "p1", agentId: "a-1", amount: "300" }))
    paymentsStore.append(makePayment({ id: "p2", agentId: "a-2", amount: "100" }))

    const result = service.getAgentActivity({ sortBy: "spent" })
    expect(result).toHaveLength(2)
    expect(result[0].agentId).toBe("a-1")
    expect(parseFloat(result[0].totalSpent)).toBe(300)
  })

  it("limits agent activity results", () => {
    agentsStore.create(makeAgent({ id: "a-1" }))
    agentsStore.create(makeAgent({ id: "a-2" }))
    agentsStore.create(makeAgent({ id: "a-3" }))

    const result = service.getAgentActivity({ limit: 2 })
    expect(result).toHaveLength(2)
  })

  it("filters agent activity by wallet", () => {
    agentsStore.create(makeAgent({ id: "a-1", walletId: "w-1" }))
    agentsStore.create(makeAgent({ id: "a-2", walletId: "w-2" }))

    const result = service.getAgentActivity({ walletId: "w-1" })
    expect(result).toHaveLength(1)
  })
})
