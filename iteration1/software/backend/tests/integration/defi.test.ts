import { describe, it, expect, beforeAll } from "vitest"
import { createApp } from "../../src/app.js"
import { createConfig } from "../../src/config.js"

const config = createConfig({ apiKey: "test-key" })
const headers = { "X-API-KEY": "test-key", "Content-Type": "application/json" }

describe("DeFi REST API", () => {
  let app: ReturnType<typeof createApp>["app"]

  beforeAll(() => {
    app = createApp(config).app
  })

  it("POST /api/defi/swap/encode - encodes swap", async () => {
    const res = await app.request("/api/defi/swap/encode", {
      method: "POST",
      headers,
      body: JSON.stringify({
        chainId: 8453,
        tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        tokenOut: "0x4200000000000000000000000000000000000006",
        amountIn: "1000000",
        minAmountOut: "0",
        recipient: "0x1111111111111111111111111111111111111111",
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.to).toMatch(/^0x/)
    expect(body.result.data).toMatch(/^0x/)
  })

  it("POST /api/defi/supply/encode - encodes supply", async () => {
    const res = await app.request("/api/defi/supply/encode", {
      method: "POST",
      headers,
      body: JSON.stringify({
        chainId: 8453,
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "1000000",
        onBehalfOf: "0x1111111111111111111111111111111111111111",
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.to).toMatch(/^0x/)
  })

  it("POST /api/defi/borrow/encode - encodes borrow", async () => {
    const res = await app.request("/api/defi/borrow/encode", {
      method: "POST",
      headers,
      body: JSON.stringify({
        chainId: 8453,
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "500000",
        onBehalfOf: "0x1111111111111111111111111111111111111111",
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.to).toMatch(/^0x/)
  })

  it("POST /api/defi/repay/encode - encodes repay", async () => {
    const res = await app.request("/api/defi/repay/encode", {
      method: "POST",
      headers,
      body: JSON.stringify({
        chainId: 8453,
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        amount: "500000",
        onBehalfOf: "0x1111111111111111111111111111111111111111",
      }),
    })
    expect(res.status).toBe(200)
  })

  it("POST /api/defi/approve/encode - encodes approve", async () => {
    const res = await app.request("/api/defi/approve/encode", {
      method: "POST",
      headers,
      body: JSON.stringify({
        token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        spender: "0x1111111111111111111111111111111111111111",
        amount: "1000000",
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.to).toMatch(/^0x/)
    expect(body.result.data).toMatch(/^0x/)
  })
})
