import { describe, it, expect } from "vitest"
import {
  encodeAgentPolicy,
  decodeAgentPolicy,
  encodeX402Budget,
  decodeX402Budget,
  encodeInstallAgentValidator,
  encodeInstallX402Policy,
  encodeInstallSpendingLimitHook,
} from "../src/encoding.js"
import type { AgentPolicy, X402Budget } from "../src/types.js"

const SAMPLE_POLICY: AgentPolicy = {
  allowedTargets: [
    "0x1234567890123456789012345678901234567890",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  ],
  allowedSelectors: ["0xa9059cbb", "0x095ea7b3"],
  maxAmountPerTx: 1000000n,
  dailyLimit: 5000000n,
  weeklyLimit: 20000000n,
  validAfter: 1700000000,
  validUntil: 1800000000,
  active: true,
}

const SAMPLE_BUDGET: X402Budget = {
  maxPerRequest: 1000000n,
  dailyBudget: 10000000n,
  totalBudget: 100000000n,
  spent: 0n,
  dailySpent: 0n,
  lastReset: 0n,
  allowedDomains: ["api.example.com", "data.example.com"],
}

describe("encodeAgentPolicy / decodeAgentPolicy", () => {
  it("roundtrips a full policy", () => {
    const encoded = encodeAgentPolicy(SAMPLE_POLICY)
    expect(encoded).toMatch(/^0x/)

    const decoded = decodeAgentPolicy(encoded)
    expect(decoded.allowedTargets.length).toBe(2)
    expect(decoded.allowedSelectors.length).toBe(2)
    expect(decoded.maxAmountPerTx).toBe(1000000n)
    expect(decoded.dailyLimit).toBe(5000000n)
    expect(decoded.weeklyLimit).toBe(20000000n)
    expect(decoded.validAfter).toBe(1700000000)
    expect(decoded.validUntil).toBe(1800000000)
    expect(decoded.active).toBe(true)
  })

  it("roundtrips a policy with empty arrays", () => {
    const policy: AgentPolicy = {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: 0n,
      dailyLimit: 0n,
      weeklyLimit: 0n,
      validAfter: 0,
      validUntil: 0,
      active: false,
    }

    const decoded = decodeAgentPolicy(encodeAgentPolicy(policy))
    expect(decoded.allowedTargets).toEqual([])
    expect(decoded.allowedSelectors).toEqual([])
    expect(decoded.maxAmountPerTx).toBe(0n)
    expect(decoded.active).toBe(false)
  })
})

describe("encodeX402Budget / decodeX402Budget", () => {
  it("roundtrips a full budget", () => {
    const encoded = encodeX402Budget(SAMPLE_BUDGET)
    expect(encoded).toMatch(/^0x/)

    const decoded = decodeX402Budget(encoded)
    expect(decoded.maxPerRequest).toBe(1000000n)
    expect(decoded.dailyBudget).toBe(10000000n)
    expect(decoded.totalBudget).toBe(100000000n)
    expect(decoded.spent).toBe(0n)
    expect(decoded.dailySpent).toBe(0n)
    expect(decoded.lastReset).toBe(0n)
    expect(decoded.allowedDomains).toEqual(["api.example.com", "data.example.com"])
  })

  it("roundtrips a budget with no domains", () => {
    const budget: X402Budget = { ...SAMPLE_BUDGET, allowedDomains: [] }
    const decoded = decodeX402Budget(encodeX402Budget(budget))
    expect(decoded.allowedDomains).toEqual([])
  })
})

describe("encodeInstallAgentValidator", () => {
  it("encodes agent address and policy", () => {
    const encoded = encodeInstallAgentValidator(
      "0x1111111111111111111111111111111111111111",
      SAMPLE_POLICY,
    )
    expect(encoded).toMatch(/^0x/)
    expect(encoded.length).toBeGreaterThan(66)
  })
})

describe("encodeInstallX402Policy", () => {
  it("encodes agent and budget parameters", () => {
    const encoded = encodeInstallX402Policy(
      "0x1111111111111111111111111111111111111111",
      1000000n,
      10000000n,
      100000000n,
      ["api.example.com"],
    )
    expect(encoded).toMatch(/^0x/)
  })
})

describe("encodeInstallSpendingLimitHook", () => {
  it("encodes spending limit parameters", () => {
    const encoded = encodeInstallSpendingLimitHook({
      agent: "0x1111111111111111111111111111111111111111",
      token: "0x2222222222222222222222222222222222222222",
      dailyLimit: 5000000n,
      weeklyLimit: 20000000n,
    })
    expect(encoded).toMatch(/^0x/)
  })
})
