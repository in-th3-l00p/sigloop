import { describe, it, expect, vi, beforeEach } from "vitest"
import { createX402Fetch, parseX402Response } from "../src/middleware.js"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

const MOCK_SIGNER = {
  address: "0x1111111111111111111111111111111111111111",
  signTypedData: vi.fn().mockResolvedValue("0xmocksig" + "ab".repeat(64)),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createX402Fetch", () => {
  it("returns a function", () => {
    const x402fetch = createX402Fetch({
      signer: MOCK_SIGNER,
      chainId: 8453,
    })
    expect(x402fetch).toBeTypeOf("function")
  })

  it("passes through non-402 responses", async () => {
    const normalResponse = new Response("ok", { status: 200 })
    mockFetch.mockResolvedValueOnce(normalResponse)

    const x402fetch = createX402Fetch({
      signer: MOCK_SIGNER,
      chainId: 8453,
    })

    const result = await x402fetch("https://api.example.com/data")
    expect(result.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it("handles 402 with payment requirement", async () => {
    const paymentRequirement = JSON.stringify({
      scheme: "exact",
      network: "base",
      maxAmountRequired: "1000",
      payTo: "0x2222222222222222222222222222222222222222",
      maxTimeoutSeconds: 120,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    })

    const response402 = new Response("payment required", {
      status: 402,
      headers: { "X-PAYMENT-REQUIRED": paymentRequirement },
    })
    const responseOk = new Response("data", { status: 200 })

    mockFetch.mockResolvedValueOnce(response402)
    mockFetch.mockResolvedValueOnce(responseOk)

    const x402fetch = createX402Fetch({
      signer: MOCK_SIGNER,
      chainId: 8453,
      maxPerRequest: 10000n,
      dailyBudget: 100000n,
      totalBudget: 1000000n,
    })

    const result = await x402fetch("https://api.example.com/data")
    expect(result.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(MOCK_SIGNER.signTypedData).toHaveBeenCalledOnce()
  })

  it("throws when budget exceeded", async () => {
    const paymentRequirement = JSON.stringify({
      maxAmountRequired: "999999",
      payTo: "0x2222222222222222222222222222222222222222",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    })

    const response402 = new Response("payment required", {
      status: 402,
      headers: { "X-PAYMENT-REQUIRED": paymentRequirement },
    })

    mockFetch.mockResolvedValueOnce(response402)

    const x402fetch = createX402Fetch({
      signer: MOCK_SIGNER,
      chainId: 8453,
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    await expect(
      x402fetch("https://api.example.com/data"),
    ).rejects.toThrow("budget exceeded")
  })
})

describe("parseX402Response", () => {
  it("parses from X-PAYMENT-REQUIRED header", async () => {
    const requirement = { maxAmountRequired: "500", payTo: "0x2222222222222222222222222222222222222222" }
    const response = new Response("", {
      status: 402,
      headers: { "X-PAYMENT-REQUIRED": JSON.stringify(requirement) },
    })

    const result = await parseX402Response(response)
    expect(result).not.toBeNull()
    expect(result!.maxAmountRequired).toBe("500")
    expect(result!.payTo).toBe("0x2222222222222222222222222222222222222222")
  })

  it("parses from response body", async () => {
    const body = { maxAmountRequired: "500", payTo: "0x3333333333333333333333333333333333333333" }
    const response = new Response(JSON.stringify(body), {
      status: 402,
    })

    const result = await parseX402Response(response)
    expect(result).not.toBeNull()
    expect(result!.payTo).toBe("0x3333333333333333333333333333333333333333")
  })

  it("returns null when no payment info available", async () => {
    const response = new Response("not found", { status: 402 })
    const result = await parseX402Response(response)
    expect(result).toBeNull()
  })
})
