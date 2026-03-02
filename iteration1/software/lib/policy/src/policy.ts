import type { AgentPolicy, X402Budget, SpendingLimit } from "./types.js"
import type { CreateAgentPolicyConfig, CreateX402PolicyConfig, CreateSpendingPolicyConfig } from "./types.js"

export function createAgentPolicy(config: CreateAgentPolicyConfig): AgentPolicy {
  return {
    allowedTargets: config.allowedTargets ?? [],
    allowedSelectors: config.allowedSelectors ?? [],
    maxAmountPerTx: config.maxAmountPerTx ?? 0n,
    dailyLimit: config.dailyLimit ?? 0n,
    weeklyLimit: config.weeklyLimit ?? 0n,
    validAfter: config.validAfter ?? 0,
    validUntil: config.validUntil ?? 0,
    active: true,
  }
}

export function createX402Policy(config: CreateX402PolicyConfig): X402Budget {
  return {
    maxPerRequest: config.maxPerRequest,
    dailyBudget: config.dailyBudget,
    totalBudget: config.totalBudget,
    spent: 0n,
    dailySpent: 0n,
    lastReset: 0n,
    allowedDomains: config.allowedDomains ?? [],
  }
}

export function createSpendingPolicy(config: CreateSpendingPolicyConfig): SpendingLimit {
  return {
    agent: config.agent,
    token: config.token,
    dailyLimit: config.dailyLimit,
    weeklyLimit: config.weeklyLimit,
  }
}
