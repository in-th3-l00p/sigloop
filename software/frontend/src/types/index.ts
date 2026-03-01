export type WalletRecord = {
  id: string
  address: string
  name: string
  chainId: number
  createdAt: string
  updatedAt: string
}

export type AgentStatus = "active" | "revoked" | "expired"

export type AgentResponse = {
  id: string
  walletId: string
  name: string
  address: string
  policyId: string | null
  status: AgentStatus
  expiresAt: number
  createdAt: string
  updatedAt: string
  revokedAt: string | null
}

export type AgentWithSessionKey = {
  agent: AgentResponse
  sessionKey: string
}

export type PolicyType = "agent" | "x402" | "spending"

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

export type PolicyConfig = AgentPolicyConfig | X402PolicyConfig | SpendingPolicyConfig

export type PolicyRecord = {
  id: string
  name: string
  type: PolicyType
  config: PolicyConfig
  createdAt: string
  updatedAt: string
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

export type PaymentStats = {
  totalSpent: string
  totalTransactions: number
  byAgent: Record<string, { spent: string; count: number }>
  byDomain: Record<string, { spent: string; count: number }>
  byPeriod: Array<{ period: string; spent: string; count: number }>
}

export type BudgetState = {
  walletId: string
  totalSpent: string
  dailySpent: string
  lastDailyReset: number
  remaining: string
}

export type SessionStatus = {
  active: boolean
  expiresAt: number
  remainingSeconds: number
}

export type EncodedCallResult = {
  to: string
  data: string
  value: string
}

export type SpendingDataPoint = {
  period: string
  totalSpent: string
  transactionCount: number
}

export type AgentActivity = {
  agentId: string
  name: string
  walletId: string
  totalSpent: string
  transactionCount: number
  lastActive: string | null
  domains: string[]
}

export type WsEventType =
  | "payment:recorded"
  | "agent:created"
  | "agent:revoked"
  | "budget:warning"
  | "budget:exceeded"

export type WsEvent = {
  type: WsEventType | "catchup" | "pong"
  timestamp: string
  data: Record<string, unknown>
  events?: WsEvent[]
}
