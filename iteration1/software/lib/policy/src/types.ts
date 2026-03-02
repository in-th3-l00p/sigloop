import type { Address, Hex } from "viem"

export type AgentPolicy = {
  allowedTargets: Address[]
  allowedSelectors: Hex[]
  maxAmountPerTx: bigint
  dailyLimit: bigint
  weeklyLimit: bigint
  validAfter: number
  validUntil: number
  active: boolean
}

export type X402Budget = {
  maxPerRequest: bigint
  dailyBudget: bigint
  totalBudget: bigint
  spent: bigint
  dailySpent: bigint
  lastReset: bigint
  allowedDomains: string[]
}

export type SpendingLimit = {
  agent: Address
  token: Address
  dailyLimit: bigint
  weeklyLimit: bigint
}

export type SpendingRecord = {
  dailySpent: bigint
  weeklySpent: bigint
  lastDailyReset: bigint
  lastWeeklyReset: bigint
}

export type ContractAllowlist = {
  targets: Address[]
}

export type FunctionAllowlist = {
  selectors: Hex[]
}

export type TimeWindow = {
  validAfter: number
  validUntil: number
}

export type PolicyRule =
  | { type: "contractAllowlist"; allowlist: ContractAllowlist }
  | { type: "functionAllowlist"; allowlist: FunctionAllowlist }
  | { type: "spendingLimit"; maxPerTx: bigint; dailyLimit: bigint; weeklyLimit: bigint }
  | { type: "timeWindow"; window: TimeWindow }

export type CreateAgentPolicyConfig = {
  allowedTargets?: Address[]
  allowedSelectors?: Hex[]
  maxAmountPerTx?: bigint
  dailyLimit?: bigint
  weeklyLimit?: bigint
  validAfter?: number
  validUntil?: number
}

export type CreateX402PolicyConfig = {
  maxPerRequest: bigint
  dailyBudget: bigint
  totalBudget: bigint
  allowedDomains?: string[]
}

export type CreateSpendingPolicyConfig = {
  agent: Address
  token: Address
  dailyLimit: bigint
  weeklyLimit: bigint
}
