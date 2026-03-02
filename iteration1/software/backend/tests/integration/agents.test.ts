import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("Agent REST API", () => {
  let app: ReturnType<typeof createApp>["app"]
  let walletId: string
  let agentId: string

  beforeAll(async () => {
    app = createApp(config).app

    const walletRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Agent Wallet" }),
    })
    const walletBody = await walletRes.json()
    walletId = walletBody.wallet.id
  })

  it("POST /api/agents/wallets/:walletId/agents - creates agent", async () => {
    const res = await app.request(`/api/agents/wallets/${walletId}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Test Agent" }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.agent.name).toBe("Test Agent")
    expect(body.agent.status).toBe("active")
    expect(body.sessionKey).toMatch(/^0x/)
    agentId = body.agent.id
  })

  it("GET /api/agents - lists agents", async () => {
    const res = await app.request("/api/agents", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agents.length).toBeGreaterThanOrEqual(1)
  })

  it("GET /api/agents?walletId - filters by wallet", async () => {
    const res = await app.request(`/api/agents?walletId=${walletId}`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agents.every((a: any) => a.walletId === walletId)).toBe(true)
  })

  it("GET /api/agents/:id - gets agent", async () => {
    const res = await app.request(`/api/agents/${agentId}`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agent.id).toBe(agentId)
    expect(body.agent).not.toHaveProperty("sessionPrivateKey")
  })

  it("GET /api/agents/:id/session - gets session status", async () => {
    const res = await app.request(`/api/agents/${agentId}/session`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session.active).toBe(true)
    expect(body.session.remainingSeconds).toBeGreaterThan(0)
  })

  it("GET /api/agents/:id/policy - returns null when no policy", async () => {
    const res = await app.request(`/api/agents/${agentId}/policy`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.policy).toBeNull()
  })

  it("POST /api/agents/:id/revoke - revokes agent", async () => {
    const createRes = await app.request(`/api/agents/wallets/${walletId}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "To Revoke" }),
    })
    const { agent } = await createRes.json()

    const res = await app.request(`/api/agents/${agent.id}/revoke`, {
      method: "POST",
      headers,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.agent.status).toBe("revoked")
  })

  it("DELETE /api/agents/:id - deletes agent", async () => {
    const createRes = await app.request(`/api/agents/wallets/${walletId}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "To Delete" }),
    })
    const { agent } = await createRes.json()

    const res = await app.request(`/api/agents/${agent.id}`, { method: "DELETE", headers })
    expect(res.status).toBe(200)
  })
})
