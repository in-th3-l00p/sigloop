import type { Address, Hex } from "viem"
import type { AgentPolicy, X402Budget } from "./types.js"

export function validateAgentPolicy(policy: AgentPolicy): boolean {
  if (policy.dailyLimit > 0n && policy.maxAmountPerTx > policy.dailyLimit) {
    return false
  }

  if (policy.weeklyLimit > 0n && policy.dailyLimit > policy.weeklyLimit) {
    return false
  }

  if (policy.validUntil > 0 && policy.validUntil <= policy.validAfter) {
    return false
  }

  return true
}

export function isPolicyActive(policy: AgentPolicy): boolean {
  if (!policy.active) return false

  const now = Math.floor(Date.now() / 1000)

  if (policy.validAfter > 0 && now < policy.validAfter) return false
  if (policy.validUntil > 0 && now >= policy.validUntil) return false

  return true
}

export function isTargetAllowed(policy: AgentPolicy, target: Address): boolean {
  if (policy.allowedTargets.length === 0) return true

  return policy.allowedTargets.some(
    (t) => t.toLowerCase() === target.toLowerCase(),
  )
}

export function isSelectorAllowed(policy: AgentPolicy, selector: Hex): boolean {
  if (policy.allowedSelectors.length === 0) return true

  const normalized = selector.slice(0, 10).toLowerCase()
  return policy.allowedSelectors.some(
    (s) => s.slice(0, 10).toLowerCase() === normalized,
  )
}

export function validateX402Budget(budget: X402Budget): boolean {
  if (budget.maxPerRequest > budget.dailyBudget) return false
  if (budget.dailyBudget > budget.totalBudget) return false

  return true
}
