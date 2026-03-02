import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("Payment REST API", () => {
  let app: ReturnType<typeof createApp>["app"]
  let walletId: string
  let agentId: string

  beforeAll(async () => {
    app = createApp(config).app

    const walletRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Payment Wallet" }),
    })
    walletId = (await walletRes.json()).wallet.id

    const agentRes = await app.request(`/api/agents/wallets/${walletId}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Payment Agent" }),
    })
    agentId = (await agentRes.json()).agent.id
  })

  it("POST /api/payments - records a payment", async () => {
    const res = await app.request("/api/payments", {
      method: "POST",
      headers,
      body: JSON.stringify({
        agentId,
        walletId,
        domain: "api.example.com",
        amount: "1000000",
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.payment.status).toBe("completed")
    expect(body.payment.currency).toBe("USDC")
  })

  it("GET /api/payments - lists payments", async () => {
    const res = await app.request("/api/payments", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.payments.length).toBeGreaterThanOrEqual(1)
  })

  it("GET /api/payments?domain - filters by domain", async () => {
    const res = await app.request("/api/payments?domain=api.example.com", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.payments.every((p: any) => p.domain === "api.example.com")).toBe(true)
  })

  it("GET /api/payments/stats - gets stats", async () => {
    const res = await app.request("/api/payments/stats", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stats.totalTransactions).toBeGreaterThanOrEqual(1)
    expect(parseFloat(body.stats.totalSpent)).toBeGreaterThan(0)
  })

  it("GET /api/payments/budgets/:walletId - gets budget", async () => {
    const res = await app.request(`/api/payments/budgets/${walletId}`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.budget.walletId).toBe(walletId)
  })

  it("POST /api/payments/budgets/:walletId/check - checks budget", async () => {
    const res = await app.request(`/api/payments/budgets/${walletId}/check`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount: "100" }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.allowed).toBe(true)
  })
})
