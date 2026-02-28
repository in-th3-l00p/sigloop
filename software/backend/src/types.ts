import type { Address, Hex } from "viem"

export type WalletRecord = {
  id: string
  address: Address
  name: string
  chainId: number
  createdAt: string
  updatedAt: string
}

export type CreateWalletRequest = {
  name: string
  chainId?: number
}

export type AgentStatus = "active" | "revoked" | "expired"

export type AgentRecord = {
  id: string
  walletId: string
  name: string
  address: Address
  sessionPrivateKey: Hex
  policyId: string | null
  status: AgentStatus
  expiresAt: number
  createdAt: string
  updatedAt: string
  revokedAt: string | null
}

export type AgentResponse = Omit<AgentRecord, "sessionPrivateKey">

export type CreateAgentRequest = {
  name: string
  policyId?: string
  sessionDuration?: number
  policy?: AgentPolicyConfig
}

export type PolicyType = "agent" | "x402" | "spending"

export type PolicyRecord = {
  id: string
  name: string
  type: PolicyType
  config: AgentPolicyConfig | X402PolicyConfig | SpendingPolicyConfig
  createdAt: string
  updatedAt: string
}

export type AgentPolicyConfig = {
  allowedTargets: string[]
  allowedSelectors: string[]
  maxAmountPerTx: string
  dailyLimit: string
  weeklyLimit: string
  validAfter: number
  validUntil: number
}

export type X402PolicyConfig = {
  maxPerRequest: string
  dailyBudget: string
  totalBudget: string
  allowedDomains: string[]
}

export type SpendingPolicyConfig = {
  agent: string
  token: string
  dailyLimit: string
  weeklyLimit: string
}

export type CreatePolicyRequest = {
  name: string
  type: PolicyType
  config: AgentPolicyConfig | X402PolicyConfig | SpendingPolicyConfig
}

export type PaymentStatus = "pending" | "completed" | "failed"

export type PaymentRecord = {
  id: string
  agentId: string
  walletId: string
  domain: string
  amount: string
  currency: string
  asset: string
  status: PaymentStatus
  txHash: string | null
  metadata: Record<string, string>
  createdAt: string
}

export type RecordPaymentRequest = {
  agentId: string
  walletId: string
  domain: string
  amount: string
  currency?: string
  asset?: string
  metadata?: Record<string, string>
}

export type PaymentFilters = {
  agentId?: string
  walletId?: string
  domain?: string
  startDate?: string
  endDate?: string
}

export type PaymentStats = {
  totalSpent: string
  totalTransactions: number
  byAgent: Record<string, { spent: string; count: number }>
  byDomain: Record<string, { spent: string; count: number }>
  byPeriod: Array<{ period: string; spent: string; count: number }>
}

export type SwapEncodeRequest = {
  chainId: number
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  recipient: string
  router?: string
  fee?: number
}

export type LendingEncodeRequest = {
  chainId: number
  asset: string
  amount: string
  onBehalfOf: string
  pool?: string
  interestRateMode?: number
}

export type ApproveEncodeRequest = {
  token: string
  spender: string
  amount: string
}

export type EncodedCallResult = {
  to: string
  data: string
  value: string
}

export type SignMessageRequest = {
  message: string
}

export type SendTransactionRequest = {
  to: string
  value?: string
  data?: string
}

export type BudgetStateResponse = {
  walletId: string
  totalSpent: string
  dailySpent: string
  lastDailyReset: number
  remaining: string
}

export type CheckBudgetRequest = {
  amount: string
  domain?: string
}

export type WsEventType =
  | "payment:recorded"
  | "agent:created"
  | "agent:revoked"
  | "budget:warning"
  | "budget:exceeded"

export type WsEvent = {
  type: WsEventType
  timestamp: string
  data: Record<string, unknown>
}

export type SpendingDataPoint = {
  period: string
  totalSpent: string
  transactionCount: number
}

export type AgentActivityEntry = {
  agentId: string
  name: string
  walletId: string
  totalSpent: string
  transactionCount: number
  lastActive: string | null
  domains: string[]
}

export type SpendingFilters = {
  period?: "hourly" | "daily" | "weekly" | "monthly"
  startDate?: string
  endDate?: string
  walletId?: string
  agentId?: string
}

export type AgentActivityFilters = {
  walletId?: string
  limit?: number
  sortBy?: "spent" | "transactions" | "recent"
}
