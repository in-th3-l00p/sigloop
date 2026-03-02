import type { Address, Hex } from "viem"

export type X402PaymentRequirement = {
  scheme: string
  network: string
  maxAmountRequired: string
  resource: string
  description: string
  payTo: Address
  maxTimeoutSeconds: number
  asset: Address
  extra?: Record<string, unknown>
}

export type X402Config = {
  signer: any
  chainId: number
  maxPerRequest?: bigint
  dailyBudget?: bigint
  totalBudget?: bigint
  allowedDomains?: string[]
}

export type PaymentRecord = {
  url: string
  domain: string
  amount: bigint
  asset: Address
  timestamp: number
  txHash?: Hex
}

export type BudgetState = {
  totalSpent: bigint
  dailySpent: bigint
  lastDailyReset: number
  payments: PaymentRecord[]
}

export type BudgetTracker = {
  canSpend: (amount: bigint, domain?: string) => boolean
  recordPayment: (record: PaymentRecord) => void
  getDailySpend: () => bigint
  getTotalSpent: () => bigint
  getRemainingBudget: () => bigint
  getState: () => BudgetState
}

export type BudgetTrackerConfig = {
  maxPerRequest: bigint
  dailyBudget: bigint
  totalBudget: bigint
  allowedDomains?: string[]
}

export type EIP3009AuthorizationParams = {
  token: Address
  from: Address
  to: Address
  value: bigint
  validAfter: bigint
  validBefore: bigint
  nonce: Hex
}
