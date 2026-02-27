import { describe, it, expect } from "vitest"
import {
  createPolicyFromRules,
  mergeAllowlists,
  mergeFunctionAllowlists,
  extendPolicy,
} from "../src/compose.js"
import type { PolicyRule, AgentPolicy } from "../src/types.js"

describe("createPolicyFromRules", () => {
  it("creates policy with contract allowlist rule", () => {
    const rules: PolicyRule[] = [
      {
        type: "contractAllowlist",
        allowlist: {
          targets: ["0x1234567890123456789012345678901234567890"],
        },
      },
    ]

    const policy = createPolicyFromRules(rules)
    expect(policy.allowedTargets).toEqual([
      "0x1234567890123456789012345678901234567890",
    ])
    expect(policy.active).toBe(true)
  })

  it("creates policy with function allowlist rule", () => {
    const rules: PolicyRule[] = [
      {
        type: "functionAllowlist",
        allowlist: { selectors: ["0xa9059cbb", "0x095ea7b3"] },
      },
    ]

    const policy = createPolicyFromRules(rules)
    expect(policy.allowedSelectors).toEqual(["0xa9059cbb", "0x095ea7b3"])
  })

  it("creates policy with spending limit rule", () => {
    const rules: PolicyRule[] = [
      {
        type: "spendingLimit",
        maxPerTx: 100n,
        dailyLimit: 1000n,
        weeklyLimit: 5000n,
      },
    ]

    const policy = createPolicyFromRules(rules)
    expect(policy.maxAmountPerTx).toBe(100n)
    expect(policy.dailyLimit).toBe(1000n)
    expect(policy.weeklyLimit).toBe(5000n)
  })

  it("creates policy with time window rule", () => {
    const rules: PolicyRule[] = [
      {
        type: "timeWindow",
        window: { validAfter: 1000, validUntil: 2000 },
      },
    ]

    const policy = createPolicyFromRules(rules)
    expect(policy.validAfter).toBe(1000)
    expect(policy.validUntil).toBe(2000)
  })

  it("merges multiple rules", () => {
    const rules: PolicyRule[] = [
      {
        type: "contractAllowlist",
        allowlist: {
          targets: ["0x1234567890123456789012345678901234567890"],
        },
      },
      {
        type: "spendingLimit",
        maxPerTx: 100n,
        dailyLimit: 1000n,
        weeklyLimit: 5000n,
      },
      {
        type: "timeWindow",
        window: { validAfter: 1000, validUntil: 2000 },
      },
    ]

    const policy = createPolicyFromRules(rules)
    expect(policy.allowedTargets.length).toBe(1)
    expect(policy.maxAmountPerTx).toBe(100n)
    expect(policy.validAfter).toBe(1000)
  })

  it("returns empty policy for no rules", () => {
    const policy = createPolicyFromRules([])
    expect(policy.allowedTargets).toEqual([])
    expect(policy.allowedSelectors).toEqual([])
    expect(policy.maxAmountPerTx).toBe(0n)
    expect(policy.active).toBe(true)
  })
})

describe("mergeAllowlists", () => {
  it("unions two allowlists", () => {
    const result = mergeAllowlists(
      { targets: ["0x1234567890123456789012345678901234567890"] },
      { targets: ["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"] },
    )
    expect(result.targets.length).toBe(2)
  })

  it("deduplicates addresses", () => {
    const result = mergeAllowlists(
      { targets: ["0x1234567890123456789012345678901234567890"] },
      { targets: ["0x1234567890123456789012345678901234567890"] },
    )
    expect(result.targets.length).toBe(1)
  })
})

describe("mergeFunctionAllowlists", () => {
  it("unions two function allowlists", () => {
    const result = mergeFunctionAllowlists(
      { selectors: ["0xa9059cbb"] },
      { selectors: ["0x095ea7b3"] },
    )
    expect(result.selectors.length).toBe(2)
  })

  it("deduplicates selectors", () => {
    const result = mergeFunctionAllowlists(
      { selectors: ["0xa9059cbb"] },
      { selectors: ["0xa9059cbb"] },
    )
    expect(result.selectors.length).toBe(1)
  })
})

describe("extendPolicy", () => {
  it("overrides specified fields", () => {
    const base: AgentPolicy = {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: 100n,
      dailyLimit: 1000n,
      weeklyLimit: 5000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    }

    const extended = extendPolicy(base, { maxAmountPerTx: 200n })
    expect(extended.maxAmountPerTx).toBe(200n)
    expect(extended.dailyLimit).toBe(1000n)
  })

  it("preserves base fields when not overridden", () => {
    const base: AgentPolicy = {
      allowedTargets: ["0x1234567890123456789012345678901234567890"],
      allowedSelectors: [],
      maxAmountPerTx: 100n,
      dailyLimit: 1000n,
      weeklyLimit: 5000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    }

    const extended = extendPolicy(base, { active: false })
    expect(extended.allowedTargets).toEqual(base.allowedTargets)
    expect(extended.active).toBe(false)
  })
})
