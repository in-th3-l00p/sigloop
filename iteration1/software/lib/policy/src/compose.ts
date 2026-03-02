import type { Address, Hex } from "viem"
import type { AgentPolicy, PolicyRule, ContractAllowlist, FunctionAllowlist } from "./types.js"

export function createPolicyFromRules(rules: PolicyRule[]): AgentPolicy {
  const policy: AgentPolicy = {
    allowedTargets: [],
    allowedSelectors: [],
    maxAmountPerTx: 0n,
    dailyLimit: 0n,
    weeklyLimit: 0n,
    validAfter: 0,
    validUntil: 0,
    active: true,
  }

  for (const rule of rules) {
    switch (rule.type) {
      case "contractAllowlist":
        policy.allowedTargets = deduplicateAddresses([
          ...policy.allowedTargets,
          ...rule.allowlist.targets,
        ])
        break
      case "functionAllowlist":
        policy.allowedSelectors = deduplicateSelectors([
          ...policy.allowedSelectors,
          ...rule.allowlist.selectors,
        ])
        break
      case "spendingLimit":
        policy.maxAmountPerTx = rule.maxPerTx
        policy.dailyLimit = rule.dailyLimit
        policy.weeklyLimit = rule.weeklyLimit
        break
      case "timeWindow":
        policy.validAfter = rule.window.validAfter
        policy.validUntil = rule.window.validUntil
        break
    }
  }

  return policy
}

export function mergeAllowlists(
  a: ContractAllowlist,
  b: ContractAllowlist,
): ContractAllowlist {
  return {
    targets: deduplicateAddresses([...a.targets, ...b.targets]),
  }
}

export function mergeFunctionAllowlists(
  a: FunctionAllowlist,
  b: FunctionAllowlist,
): FunctionAllowlist {
  return {
    selectors: deduplicateSelectors([...a.selectors, ...b.selectors]),
  }
}

export function extendPolicy(
  base: AgentPolicy,
  overrides: Partial<AgentPolicy>,
): AgentPolicy {
  return { ...base, ...overrides }
}

function deduplicateAddresses(addresses: Address[]): Address[] {
  const seen = new Set<string>()
  return addresses.filter((a) => {
    const lower = a.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
}

function deduplicateSelectors(selectors: Hex[]): Hex[] {
  const seen = new Set<string>()
  return selectors.filter((s) => {
    const normalized = s.slice(0, 10).toLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
