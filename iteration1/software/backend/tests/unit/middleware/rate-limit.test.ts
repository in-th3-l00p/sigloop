import { describe, it, expect } from "vitest"
import { Hono } from "hono"
import { createRateLimitMiddleware } from "../../../src/middleware/rate-limit.js"
import { createConfig } from "../../../src/config.js"

describe("createRateLimitMiddleware", () => {
  it("allows requests under limit", async () => {
    const config = createConfig({ rateLimitMaxTokens: 10, rateLimitRefillRate: 10 })
    const app = new Hono()
    app.use("/*", createRateLimitMiddleware(config))
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    expect(res.status).toBe(200)
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10")
  })

  it("returns 429 when rate limit exceeded", async () => {
    const config = createConfig({ rateLimitMaxTokens: 2, rateLimitRefillRate: 0 })
    const app = new Hono()
    app.use("/*", createRateLimitMiddleware(config))
    app.get("/test", (c) => c.json({ ok: true }))

    await app.request("/test", { headers: { "x-forwarded-for": "1.2.3.4" } })
    await app.request("/test", { headers: { "x-forwarded-for": "1.2.3.4" } })
    const res = await app.request("/test", { headers: { "x-forwarded-for": "1.2.3.4" } })
    expect(res.status).toBe(429)
  })

  it("includes rate limit headers", async () => {
    const config = createConfig({ rateLimitMaxTokens: 100, rateLimitRefillRate: 10 })
    const app = new Hono()
    app.use("/*", createRateLimitMiddleware(config))
    app.get("/test", (c) => c.json({ ok: true }))

    const res = await app.request("/test")
    expect(res.headers.has("X-RateLimit-Limit")).toBe(true)
    expect(res.headers.has("X-RateLimit-Remaining")).toBe(true)
  })
})
