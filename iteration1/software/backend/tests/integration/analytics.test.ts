import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("Analytics REST API", () => {
  let app: ReturnType<typeof createApp>["app"]

  beforeAll(async () => {
    app = createApp(config).app

    const walletRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Analytics Wallet" }),
    })
    const walletId = (await walletRes.json()).wallet.id

    const agentRes = await app.request(`/api/agents/wallets/${walletId}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Analytics Agent" }),
    })
    const agentId = (await agentRes.json()).agent.id

    await app.request("/api/payments", {
      method: "POST",
      headers,
      body: JSON.stringify({ agentId, walletId, domain: "a.com", amount: "100" }),
    })
    await app.request("/api/payments", {
      method: "POST",
      headers,
      body: JSON.stringify({ agentId, walletId, domain: "b.com", amount: "200" }),
    })
  })

  it("GET /api/analytics/spending - returns spending data", async () => {
    const res = await app.request("/api/analytics/spending?period=daily", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.spending.length).toBeGreaterThanOrEqual(1)
    expect(body.spending[0].period).toBeTruthy()
    expect(body.spending[0].transactionCount).toBeGreaterThanOrEqual(1)
  })

  it("GET /api/analytics/agents - returns agent activity", async () => {
    const res = await app.request("/api/analytics/agents?sortBy=spent", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agents.length).toBeGreaterThanOrEqual(1)
    expect(body.agents[0].agentId).toBeTruthy()
    expect(parseFloat(body.agents[0].totalSpent)).toBeGreaterThan(0)
  })
})
