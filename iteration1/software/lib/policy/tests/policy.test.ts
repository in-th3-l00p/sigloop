import { describe, it, expect } from "vitest"
import { createAgentPolicy, createX402Policy, createSpendingPolicy } from "../src/policy.js"

describe("createAgentPolicy", () => {
  it("returns defaults for minimal config", () => {
    const policy = createAgentPolicy({})
    expect(policy.allowedTargets).toEqual([])
    expect(policy.allowedSelectors).toEqual([])
    expect(policy.maxAmountPerTx).toBe(0n)
    expect(policy.dailyLimit).toBe(0n)
    expect(policy.weeklyLimit).toBe(0n)
    expect(policy.validAfter).toBe(0)
    expect(policy.validUntil).toBe(0)
    expect(policy.active).toBe(true)
  })

  it("populates all fields from config", () => {
    const policy = createAgentPolicy({
      allowedTargets: ["0x1234567890123456789012345678901234567890"],
      allowedSelectors: ["0xa9059cbb"],
      maxAmountPerTx: 100n,
      dailyLimit: 1000n,
      weeklyLimit: 5000n,
      validAfter: 1000,
      validUntil: 2000,
    })

    expect(policy.allowedTargets.length).toBe(1)
    expect(policy.allowedSelectors.length).toBe(1)
    expect(policy.maxAmountPerTx).toBe(100n)
    expect(policy.dailyLimit).toBe(1000n)
    expect(policy.weeklyLimit).toBe(5000n)
    expect(policy.validAfter).toBe(1000)
    expect(policy.validUntil).toBe(2000)
    expect(policy.active).toBe(true)
  })
})

describe("createX402Policy", () => {
  it("returns budget with zero spent values", () => {
    const budget = createX402Policy({
      maxPerRequest: 1000000n,
      dailyBudget: 10000000n,
      totalBudget: 100000000n,
    })

    expect(budget.maxPerRequest).toBe(1000000n)
    expect(budget.dailyBudget).toBe(10000000n)
    expect(budget.totalBudget).toBe(100000000n)
    expect(budget.spent).toBe(0n)
    expect(budget.dailySpent).toBe(0n)
    expect(budget.lastReset).toBe(0n)
    expect(budget.allowedDomains).toEqual([])
  })

  it("includes allowed domains", () => {
    const budget = createX402Policy({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
      allowedDomains: ["api.example.com"],
    })

    expect(budget.allowedDomains).toEqual(["api.example.com"])
  })
})

describe("createSpendingPolicy", () => {
  it("returns spending limit", () => {
    const limit = createSpendingPolicy({
      agent: "0x1111111111111111111111111111111111111111",
      token: "0x2222222222222222222222222222222222222222",
      dailyLimit: 5000000n,
      weeklyLimit: 20000000n,
    })

    expect(limit.agent).toBe("0x1111111111111111111111111111111111111111")
    expect(limit.token).toBe("0x2222222222222222222222222222222222222222")
    expect(limit.dailyLimit).toBe(5000000n)
    expect(limit.weeklyLimit).toBe(20000000n)
  })
})
