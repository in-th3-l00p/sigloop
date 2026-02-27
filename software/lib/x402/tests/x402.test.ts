import { describe, it, expect, vi } from "vitest"
import { createX402Client } from "../src/x402.js"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

const MOCK_SIGNER = {
  address: "0x1111111111111111111111111111111111111111",
  signTypedData: vi.fn().mockResolvedValue("0xmocksig"),
}

describe("createX402Client", () => {
  it("returns fetch and getBudget", () => {
    const client = createX402Client({
      signer: MOCK_SIGNER,
      chainId: 8453,
    })

    expect(client.fetch).toBeTypeOf("function")
    expect(client.getBudget).toBeTypeOf("function")
  })

  it("getBudget returns initial state", () => {
    const client = createX402Client({
      signer: MOCK_SIGNER,
      chainId: 8453,
      totalBudget: 5000n,
    })

    const budget = client.getBudget()
    expect(budget.totalSpent).toBe(0n)
    expect(budget.dailySpent).toBe(0n)
    expect(budget.payments).toEqual([])
  })
})
