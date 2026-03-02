import { encodeAbiParameters, decodeAbiParameters } from "viem"
import type { Address, Hex } from "viem"
import type { AgentPolicy, X402Budget, SpendingLimit } from "./types.js"
import { AGENT_POLICY_ABI_PARAMS, X402_BUDGET_ABI_PARAMS } from "./constants.js"

export function encodeAgentPolicy(policy: AgentPolicy): Hex {
  return encodeAbiParameters(AGENT_POLICY_ABI_PARAMS, [
    {
      allowedTargets: policy.allowedTargets,
      allowedSelectors: policy.allowedSelectors.map((s) => s.slice(0, 10) as Hex),
      maxAmountPerTx: policy.maxAmountPerTx,
      dailyLimit: policy.dailyLimit,
      weeklyLimit: policy.weeklyLimit,
      validAfter: policy.validAfter,
      validUntil: policy.validUntil,
      active: policy.active,
    },
  ])
}

export function decodeAgentPolicy(data: Hex): AgentPolicy {
  const [decoded] = decodeAbiParameters(AGENT_POLICY_ABI_PARAMS, data)
  return {
    allowedTargets: [...decoded.allowedTargets] as Address[],
    allowedSelectors: [...decoded.allowedSelectors] as Hex[],
    maxAmountPerTx: decoded.maxAmountPerTx,
    dailyLimit: decoded.dailyLimit,
    weeklyLimit: decoded.weeklyLimit,
    validAfter: decoded.validAfter,
    validUntil: decoded.validUntil,
    active: decoded.active,
  }
}

export function encodeX402Budget(budget: X402Budget): Hex {
  return encodeAbiParameters(X402_BUDGET_ABI_PARAMS, [
    {
      maxPerRequest: budget.maxPerRequest,
      dailyBudget: budget.dailyBudget,
      totalBudget: budget.totalBudget,
      spent: budget.spent,
      dailySpent: budget.dailySpent,
      lastReset: budget.lastReset,
      allowedDomains: budget.allowedDomains,
    },
  ])
}

export function decodeX402Budget(data: Hex): X402Budget {
  const [decoded] = decodeAbiParameters(X402_BUDGET_ABI_PARAMS, data)
  return {
    maxPerRequest: decoded.maxPerRequest,
    dailyBudget: decoded.dailyBudget,
    totalBudget: decoded.totalBudget,
    spent: decoded.spent,
    dailySpent: decoded.dailySpent,
    lastReset: decoded.lastReset,
    allowedDomains: [...decoded.allowedDomains],
  }
}

export function encodeInstallAgentValidator(agent: Address, policy: AgentPolicy): Hex {
  return encodeAbiParameters(
    [{ type: "address" }, ...AGENT_POLICY_ABI_PARAMS],
    [
      agent,
      {
        allowedTargets: policy.allowedTargets,
        allowedSelectors: policy.allowedSelectors.map((s) => s.slice(0, 10) as Hex),
        maxAmountPerTx: policy.maxAmountPerTx,
        dailyLimit: policy.dailyLimit,
        weeklyLimit: policy.weeklyLimit,
        validAfter: policy.validAfter,
        validUntil: policy.validUntil,
        active: policy.active,
      },
    ],
  )
}

export function encodeInstallX402Policy(
  agent: Address,
  maxPerRequest: bigint,
  dailyBudget: bigint,
  totalBudget: bigint,
  domains: string[],
): Hex {
  return encodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "string[]" },
    ],
    [agent, maxPerRequest, dailyBudget, totalBudget, domains],
  )
}

export function encodeInstallSpendingLimitHook(limit: SpendingLimit): Hex {
  return encodeAbiParameters(
    [
      { type: "address" },
      { type: "address" },
      { type: "uint256" },
      { type: "uint256" },
    ],
    [limit.agent, limit.token, limit.dailyLimit, limit.weeklyLimit],
  )
}
