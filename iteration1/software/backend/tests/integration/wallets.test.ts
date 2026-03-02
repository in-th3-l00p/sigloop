import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("Wallet REST API", () => {
  let app: ReturnType<typeof createApp>["app"]
  let walletId: string

  beforeAll(() => {
    app = createApp(config).app
  })

  it("POST /api/wallets - creates a wallet", async () => {
    const res = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Test Wallet", chainId: 8453 }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.wallet.name).toBe("Test Wallet")
    expect(body.wallet.chainId).toBe(8453)
    expect(body.wallet.address).toMatch(/^0x/)
    walletId = body.wallet.id
  })

  it("GET /api/wallets - lists wallets", async () => {
    const res = await app.request("/api/wallets", { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.wallets.length).toBeGreaterThanOrEqual(1)
    expect(body.total).toBeGreaterThanOrEqual(1)
  })

  it("GET /api/wallets/:id - gets wallet", async () => {
    const res = await app.request(`/api/wallets/${walletId}`, { headers })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.wallet.id).toBe(walletId)
  })

  it("GET /api/wallets/:id - returns 404 for missing", async () => {
    const res = await app.request("/api/wallets/nonexistent", { headers })
    expect(res.status).toBe(404)
  })

  it("POST /api/wallets/:id/sign-message - signs a message", async () => {
    const res = await app.request(`/api/wallets/${walletId}/sign-message`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "hello world" }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.signature).toMatch(/^0x/)
  })

  it("DELETE /api/wallets/:id - deletes wallet", async () => {
    const createRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "To Delete" }),
    })
    const { wallet } = await createRes.json()

    const res = await app.request(`/api/wallets/${wallet.id}`, { method: "DELETE", headers })
    expect(res.status).toBe(200)

    const getRes = await app.request(`/api/wallets/${wallet.id}`, { headers })
    expect(getRes.status).toBe(404)
  })

  it("returns 401 without API key", async () => {
    const res = await app.request("/api/wallets")
    expect(res.status).toBe(401)
  })

  it("returns 403 with wrong API key", async () => {
    const res = await app.request("/api/wallets", {
      headers: { "X-API-KEY": "wrong" },
    })
    expect(res.status).toBe(403)
  })
})
