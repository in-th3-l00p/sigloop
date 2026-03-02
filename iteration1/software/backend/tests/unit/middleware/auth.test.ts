import { describe, it, expect } from "vitest"
import { Hono } from "hono"
import { createAuthMiddleware } from "../../../src/middleware/auth.js"
import { createConfig } from "../../../src/config.js"

describe("createAuthMiddleware", () => {
  const config = createConfig({ apiKey: "test-key" })
  const app = new Hono()
  app.use("/*", createAuthMiddleware(config))
  app.get("/test", (c) => c.json({ ok: true }))

  it("returns 401 when no API key provided", async () => {
    const res = await app.request("/test")
    expect(res.status).toBe(401)
  })

  it("returns 403 when wrong API key provided", async () => {
    const res = await app.request("/test", {
      headers: { "X-API-KEY": "wrong-key" },
    })
    expect(res.status).toBe(403)
  })

  it("allows request with valid API key", async () => {
    const res = await app.request("/test", {
      headers: { "X-API-KEY": "test-key" },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
