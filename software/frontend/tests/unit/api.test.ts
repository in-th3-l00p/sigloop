import { describe, it, expect, vi, beforeEach } from "vitest"
import { configureApi, getApiConfig, api } from "@/lib/api"

describe("api configuration", () => {
  it("configures base url and api key", () => {
    configureApi("http://localhost:3001", "test-key")
    const config = getApiConfig()
    expect(config.baseUrl).toBe("http://localhost:3001")
    expect(config.apiKey).toBe("test-key")
  })

  it("strips trailing slash from url", () => {
    configureApi("http://localhost:3001/", "key")
    expect(getApiConfig().baseUrl).toBe("http://localhost:3001")
  })
})

describe("api.health", () => {
  beforeEach(() => {
    configureApi("http://localhost:3001", "")
    vi.restoreAllMocks()
  })

  it("calls the health endpoint", async () => {
    const mockResponse = { status: "ok", timestamp: "2026-03-01T00:00:00Z", version: "1.0.0" }
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await api.health()
    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/health",
      expect.objectContaining({ headers: expect.any(Object) }),
    )
  })

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ error: "Server error" }),
    } as Response)

    await expect(api.health()).rejects.toThrow("Server error")
  })
})

describe("api.wallets", () => {
  beforeEach(() => {
    configureApi("http://localhost:3001", "test-key")
    vi.restoreAllMocks()
  })

  it("lists wallets with correct headers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ wallets: [], total: 0 }),
    } as Response)

    await api.wallets.list()
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/wallets",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-KEY": "test-key" }),
      }),
    )
  })

  it("creates a wallet", async () => {
    const wallet = { id: "w-1", name: "Test", address: "0x123", chainId: 8453, createdAt: "", updatedAt: "" }
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ wallet }),
    } as Response)

    const result = await api.wallets.create({ name: "Test", chainId: 8453 })
    expect(result.wallet.name).toBe("Test")
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/wallets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Test", chainId: 8453 }),
      }),
    )
  })
})
