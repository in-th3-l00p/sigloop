import { describe, it, expect, beforeEach } from "vitest"
import { createPaymentService } from "../../../src/services/payment.js"
import { createPaymentsStore } from "../../../src/stores/payments.js"
import { createAgentsStore } from "../../../src/stores/agents.js"
import { createWalletsStore } from "../../../src/stores/wallets.js"
import { createEventsStore } from "../../../src/stores/events.js"
import { createWalletService } from "../../../src/services/wallet.js"
import { createAgentService } from "../../../src/services/agent.js"
import { createKeysService } from "../../../src/services/keys.js"
import { createPoliciesStore } from "../../../src/stores/policies.js"
import { createConfig } from "../../../src/config.js"

describe("createPaymentService", () => {
  let paymentService: ReturnType<typeof createPaymentService>
  let walletService: ReturnType<typeof createWalletService>
  let agentService: ReturnType<typeof createAgentService>
  let eventsStore: ReturnType<typeof createEventsStore>

  beforeEach(() => {
    const walletsStore = createWalletsStore()
    const agentsStore = createAgentsStore()
    const keysService = createKeysService()
    eventsStore = createEventsStore()
    const config = createConfig()

    walletService = createWalletService({ walletsStore, keysService, eventsStore, config })
    agentService = createAgentService({
      agentsStore,
      walletsStore,
      policiesStore: createPoliciesStore(),
      keysService,
      eventsStore,
    })
    paymentService = createPaymentService({
      paymentsStore: createPaymentsStore(),
      agentsStore,
      walletsStore,
      eventsStore,
    })
  })

  it("records a payment", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    const payment = paymentService.record({
      agentId: agent.id,
      walletId: wallet.id,
      domain: "api.example.com",
      amount: "1000000",
    })
    expect(payment.id).toBeTruthy()
    expect(payment.status).toBe("completed")
    expect(payment.currency).toBe("USDC")
  })

  it("throws when agent not found", () => {
    const wallet = walletService.create({ name: "W" })
    expect(() =>
      paymentService.record({ agentId: "nope", walletId: wallet.id, domain: "x", amount: "100" }),
    ).toThrow("not found")
  })

  it("throws when agent does not belong to wallet", () => {
    const w1 = walletService.create({ name: "W1" })
    const w2 = walletService.create({ name: "W2" })
    const { agent } = agentService.create(w1.id, { name: "A" })
    expect(() =>
      paymentService.record({ agentId: agent.id, walletId: w2.id, domain: "x", amount: "100" }),
    ).toThrow("does not belong")
  })

  it("lists payments with filters", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    paymentService.record({ agentId: agent.id, walletId: wallet.id, domain: "a.com", amount: "100" })
    paymentService.record({ agentId: agent.id, walletId: wallet.id, domain: "b.com", amount: "200" })

    expect(paymentService.list()).toHaveLength(2)
    expect(paymentService.list({ domain: "a.com" })).toHaveLength(1)
    expect(paymentService.list({ walletId: wallet.id })).toHaveLength(2)
  })

  it("gets payment stats", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    paymentService.record({ agentId: agent.id, walletId: wallet.id, domain: "a.com", amount: "100" })
    paymentService.record({ agentId: agent.id, walletId: wallet.id, domain: "b.com", amount: "200" })

    const stats = paymentService.getStats()
    expect(parseFloat(stats.totalSpent)).toBe(300)
    expect(stats.totalTransactions).toBe(2)
  })

  it("gets budget state", () => {
    const wallet = walletService.create({ name: "W" })
    const budget = paymentService.getBudget(wallet.id)
    expect(budget.walletId).toBe(wallet.id)
    expect(budget.totalSpent).toBe("0")
  })

  it("checks budget allowed", () => {
    const wallet = walletService.create({ name: "W" })
    const result = paymentService.checkBudget(wallet.id, { amount: "100" })
    expect(result.allowed).toBe(true)
  })

  it("broadcasts payment:recorded event", () => {
    const wallet = walletService.create({ name: "W" })
    const { agent } = agentService.create(wallet.id, { name: "A" })
    paymentService.record({ agentId: agent.id, walletId: wallet.id, domain: "a.com", amount: "100" })

    const events = eventsStore.getRecentEvents()
    expect(events.some((e) => e.type === "payment:recorded")).toBe(true)
  })
})
