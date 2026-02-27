import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  validateAgentPolicy,
  isPolicyActive,
  isTargetAllowed,
  isSelectorAllowed,
  validateX402Budget,
} from "../src/validation.js"
import type { AgentPolicy, X402Budget } from "../src/types.js"

function basePolicy(overrides: Partial<AgentPolicy> = {}): AgentPolicy {
  return {
    allowedTargets: [],
    allowedSelectors: [],
    maxAmountPerTx: 100n,
    dailyLimit: 1000n,
    weeklyLimit: 5000n,
    validAfter: 0,
    validUntil: 0,
    active: true,
    ...overrides,
  }
}

describe("validateAgentPolicy", () => {
  it("returns true for a valid policy", () => {
    expect(validateAgentPolicy(basePolicy())).toBe(true)
  })

  it("returns true when limits are zero", () => {
    expect(
      validateAgentPolicy(basePolicy({ maxAmountPerTx: 0n, dailyLimit: 0n, weeklyLimit: 0n })),
    ).toBe(true)
  })

  it("returns false when maxAmountPerTx exceeds dailyLimit", () => {
    expect(
      validateAgentPolicy(basePolicy({ maxAmountPerTx: 2000n, dailyLimit: 1000n })),
    ).toBe(false)
  })

  it("returns false when dailyLimit exceeds weeklyLimit", () => {
    expect(
      validateAgentPolicy(basePolicy({ dailyLimit: 6000n, weeklyLimit: 5000n })),
    ).toBe(false)
  })

  it("returns false when validUntil is before validAfter", () => {
    expect(
      validateAgentPolicy(basePolicy({ validAfter: 1000, validUntil: 500 })),
    ).toBe(false)
  })

  it("returns true when validUntil is zero", () => {
    expect(
      validateAgentPolicy(basePolicy({ validAfter: 1000, validUntil: 0 })),
    ).toBe(true)
  })
})

describe("isPolicyActive", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns true for active policy with no time constraints", () => {
    expect(isPolicyActive(basePolicy())).toBe(true)
  })

  it("returns false for inactive policy", () => {
    expect(isPolicyActive(basePolicy({ active: false }))).toBe(false)
  })

  it("returns false for not-yet-valid policy", () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 86400
    expect(isPolicyActive(basePolicy({ validAfter: futureTimestamp }))).toBe(false)
  })

  it("returns false for expired policy", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 86400
    expect(isPolicyActive(basePolicy({ validUntil: pastTimestamp }))).toBe(false)
  })

  it("returns true when current time is within window", () => {
    const now = Math.floor(Date.now() / 1000)
    expect(
      isPolicyActive(basePolicy({ validAfter: now - 100, validUntil: now + 100 })),
    ).toBe(true)
  })
})

describe("isTargetAllowed", () => {
  it("allows any target when allowedTargets is empty", () => {
    const policy = basePolicy()
    expect(
      isTargetAllowed(policy, "0x1234567890123456789012345678901234567890"),
    ).toBe(true)
  })

  it("allows a listed target", () => {
    const policy = basePolicy({
      allowedTargets: ["0x1234567890123456789012345678901234567890"],
    })
    expect(
      isTargetAllowed(policy, "0x1234567890123456789012345678901234567890"),
    ).toBe(true)
  })

  it("rejects an unlisted target", () => {
    const policy = basePolicy({
      allowedTargets: ["0x1234567890123456789012345678901234567890"],
    })
    expect(
      isTargetAllowed(policy, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
    ).toBe(false)
  })

  it("compares case-insensitively", () => {
    const policy = basePolicy({
      allowedTargets: ["0xABCDEFabcdefabcdefabcdefabcdefabcdefABCD"],
    })
    expect(
      isTargetAllowed(policy, "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
    ).toBe(true)
  })
})

describe("isSelectorAllowed", () => {
  it("allows any selector when allowedSelectors is empty", () => {
    const policy = basePolicy()
    expect(isSelectorAllowed(policy, "0xa9059cbb")).toBe(true)
  })

  it("allows a listed selector", () => {
    const policy = basePolicy({ allowedSelectors: ["0xa9059cbb"] })
    expect(isSelectorAllowed(policy, "0xa9059cbb")).toBe(true)
  })

  it("rejects an unlisted selector", () => {
    const policy = basePolicy({ allowedSelectors: ["0xa9059cbb"] })
    expect(isSelectorAllowed(policy, "0x095ea7b3")).toBe(false)
  })
})

describe("validateX402Budget", () => {
  it("returns true for valid budget", () => {
    const budget: X402Budget = {
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    }
    expect(validateX402Budget(budget)).toBe(true)
  })

  it("returns false when maxPerRequest exceeds dailyBudget", () => {
    const budget: X402Budget = {
      maxPerRequest: 2000n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    }
    expect(validateX402Budget(budget)).toBe(false)
  })

  it("returns false when dailyBudget exceeds totalBudget", () => {
    const budget: X402Budget = {
      maxPerRequest: 100n,
      dailyBudget: 20000n,
      totalBudget: 10000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    }
    expect(validateX402Budget(budget)).toBe(false)
  })
})
