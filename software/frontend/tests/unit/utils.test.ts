import { describe, it, expect } from "vitest"
import { truncateAddress, formatUsd, relativeTime, remainingTime, chainName, cn } from "@/lib/utils"

describe("truncateAddress", () => {
  it("truncates long addresses", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678")
  })

  it("returns short strings unchanged", () => {
    expect(truncateAddress("0x1234")).toBe("0x1234")
  })

  it("accepts custom chars count", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678", 6)).toBe("0x123456...345678")
  })
})

describe("formatUsd", () => {
  it("formats large amounts with 2 decimals", () => {
    expect(formatUsd(100.5)).toBe("$100.50")
  })

  it("formats small amounts with 4 decimals", () => {
    expect(formatUsd(0.1234)).toBe("$0.1234")
  })

  it("formats very small amounts with 6 decimals", () => {
    expect(formatUsd(0.001234)).toBe("$0.001234")
  })
})

describe("relativeTime", () => {
  it("shows seconds ago for recent times", () => {
    const now = new Date()
    now.setSeconds(now.getSeconds() - 30)
    expect(relativeTime(now)).toBe("30s ago")
  })

  it("shows minutes ago", () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - 5)
    expect(relativeTime(now)).toMatch(/5m ago/)
  })

  it("shows hours ago", () => {
    const now = new Date()
    now.setHours(now.getHours() - 3)
    expect(relativeTime(now)).toMatch(/3h ago/)
  })

  it("shows days ago", () => {
    const now = new Date()
    now.setDate(now.getDate() - 2)
    expect(relativeTime(now)).toMatch(/2d ago/)
  })
})

describe("remainingTime", () => {
  it("shows expired for past timestamps", () => {
    expect(remainingTime(Math.floor(Date.now() / 1000) - 100)).toBe("expired")
  })

  it("shows hours and minutes for near future", () => {
    const future = Math.floor(Date.now() / 1000) + 3600 * 5 + 60 * 30
    const result = remainingTime(future)
    expect(result).toMatch(/5h 30m/)
  })

  it("shows days for far future", () => {
    const future = Math.floor(Date.now() / 1000) + 86400 * 3
    const result = remainingTime(future)
    expect(result).toMatch(/3d/)
  })
})

describe("chainName", () => {
  it("returns known chain names", () => {
    expect(chainName(8453)).toBe("Base")
    expect(chainName(1)).toBe("Ethereum")
    expect(chainName(42161)).toBe("Arbitrum")
    expect(chainName(31337)).toBe("Anvil")
  })

  it("returns fallback for unknown chains", () => {
    expect(chainName(99999)).toBe("Chain 99999")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra")
  })

  it("merges tailwind conflicts", () => {
    expect(cn("p-4", "p-8")).toBe("p-8")
  })
})
