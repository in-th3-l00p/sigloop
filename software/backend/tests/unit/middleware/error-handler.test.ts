import { describe, it, expect } from "vitest"
import { Hono } from "hono"
import { errorHandler } from "../../../src/middleware/error-handler.js"

describe("errorHandler", () => {
  function createTestApp(errorMessage: string) {
    const app = new Hono()
    app.onError(errorHandler)
    app.get("/test", () => {
      throw new Error(errorMessage)
    })
    return app
  }

  it("returns 404 for not found errors", async () => {
    const res = await createTestApp("Wallet not found").request("/test")
    expect(res.status).toBe(404)
  })

  it("returns 400 for validation errors", async () => {
    const res = await createTestApp("Name is required").request("/test")
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid input errors", async () => {
    const res = await createTestApp("Invalid policy type").request("/test")
    expect(res.status).toBe(400)
  })

  it("returns 400 for must be errors", async () => {
    const res = await createTestApp("Amount must be positive").request("/test")
    expect(res.status).toBe(400)
  })

  it("returns 409 for conflict errors", async () => {
    const res = await createTestApp("Agent already revoked").request("/test")
    expect(res.status).toBe(409)
  })

  it("returns 500 for unknown errors", async () => {
    const res = await createTestApp("Something went wrong").request("/test")
    expect(res.status).toBe(500)
  })
})
