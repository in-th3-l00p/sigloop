import { describe, it, expect } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const { app } = createApp(config)

describe("GET /api/health", () => {
  it("returns 200 without auth", async () => {
    const res = await app.request("/api/health")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("ok")
    expect(body.version).toBe("0.1.0")
    expect(body.timestamp).toBeTruthy()
  })
})
