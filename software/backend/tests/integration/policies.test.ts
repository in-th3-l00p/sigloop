import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("Policy REST API", () => {
  let app: ReturnType<typeof createApp>["app"]
  let agentPolicyId: string
  let x402PolicyId: string

  beforeAll(() => {
    app = createApp(config).app
  })

  it("POST /api/policies - creates agent policy", async () => {
    const res = await app.request("/api/policies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Agent Policy",
        type: "agent",
        config: {
          allowedTargets: ["0x1111111111111111111111111111111111111111"],
          allowedSelectors: ["0x12345678"],
          maxAmountPerTx: "1000000",
          dailyLimit: "10000000",
          weeklyLimit: "50000000",
          validAfter: 0,
          validUntil: 99999999999,
        },
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.policy.type).toBe("agent")
    agentPolicyId = body.policy.id
  })

  it("POST /api/policies - creates x402 policy", async () => {
    const res = await app.request("/api/policies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "X402 Policy",
        type: "x402",
        config: {
          maxPerRequest: "1000000",
          dailyBudget: "10000000",
          totalBudget: "100000000",
          allowedDomains: ["api.example.com"],
        },
      }),
    })
    expect(res.status).toBe(201)
    x402PolicyId = (await res.json()).policy.id
  })

  it("GET /api/policies - lists policies", async () => {
    const res = await app.request("/api/policies", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.policies.length).toBeGreaterThanOrEqual(2)
  })

  it("GET /api/policies/:id - gets policy", async () => {
    const res = await app.request(`/api/policies/${agentPolicyId}`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.policy.id).toBe(agentPolicyId)
  })

  it("PUT /api/policies/:id - updates policy", async () => {
    const res = await app.request(`/api/policies/${agentPolicyId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name: "Updated Agent Policy" }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.policy.name).toBe("Updated Agent Policy")
  })

  it("POST /api/policies/:id/encode - encodes agent policy", async () => {
    const res = await app.request(`/api/policies/${agentPolicyId}/encode`, {
      method: "POST",
      headers,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.encoded).toMatch(/^0x/)
  })

  it("POST /api/policies/:id/encode - encodes x402 policy", async () => {
    const res = await app.request(`/api/policies/${x402PolicyId}/encode`, {
      method: "POST",
      headers,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.encoded).toMatch(/^0x/)
  })

  it("POST /api/policies/compose - composes policies", async () => {
    const p1 = await app.request("/api/policies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "C1",
        type: "agent",
        config: { allowedTargets: ["0x1111111111111111111111111111111111111111"], allowedSelectors: [], maxAmountPerTx: "1000", dailyLimit: "10000", weeklyLimit: "50000", validAfter: 0, validUntil: 99999999999 },
      }),
    })
    const p2 = await app.request("/api/policies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "C2",
        type: "agent",
        config: { allowedTargets: ["0x2222222222222222222222222222222222222222"], allowedSelectors: [], maxAmountPerTx: "2000", dailyLimit: "20000", weeklyLimit: "100000", validAfter: 0, validUntil: 99999999999 },
      }),
    })

    const id1 = (await p1.json()).policy.id
    const id2 = (await p2.json()).policy.id

    const res = await app.request("/api/policies/compose", {
      method: "POST",
      headers,
      body: JSON.stringify({ policyIds: [id1, id2] }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.policy.name).toContain("Composed")
  })

  it("DELETE /api/policies/:id - deletes policy", async () => {
    const createRes = await app.request("/api/policies", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Delete Me",
        type: "agent",
        config: { allowedTargets: [], allowedSelectors: [], maxAmountPerTx: "0", dailyLimit: "0", weeklyLimit: "0", validAfter: 0, validUntil: 99999999999 },
      }),
    })
    const { policy } = await createRes.json()

    const res = await app.request(`/api/policies/${policy.id}`, { method: "DELETE", headers })
    expect(res.status).toBe(200)
  })
})
