export interface Wallet {
  id: string;
  address: string;
  name: string;
  chainId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletRequest {
  name: string;
  chainId?: number;
}

export enum AgentStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
  EXPIRED = "expired",
}

export interface Agent {
  id: string;
  walletId: string;
  name: string;
  publicKey: string;
  policyId: string | null;
  status: AgentStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface CreateAgentRequest {
  walletId: string;
  name: string;
  policyId?: string;
  permissions?: string[];
}

export interface AgentWithSessionKey extends Agent {
  sessionKey: string;
}

export interface SpendingLimit {
  maxAmount: string;
  period: "hourly" | "daily" | "weekly" | "monthly";
  currency: string;
}

export interface Allowlist {
  addresses: string[];
  domains: string[];
}

export interface TimeWindow {
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
  timezone: string;
}

export interface PolicyRule {
  type: "spending_limit" | "allowlist" | "time_window";
  spendingLimit?: SpendingLimit;
  allowlist?: Allowlist;
  timeWindow?: TimeWindow;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  description?: string;
  rules: PolicyRule[];
}

export interface Payment {
  id: string;
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed";
  metadata: Record<string, string>;
  createdAt: string;
}

export interface CreatePaymentRequest {
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentStats {
  totalSpent: string;
  totalTransactions: number;
  byAgent: Record<string, { spent: string; count: number }>;
  byDomain: Record<string, { spent: string; count: number }>;
  byPeriod: Array<{ period: string; spent: string; count: number }>;
}

export interface SpendingData {
  period: string;
  totalSpent: string;
  transactionCount: number;
}

export interface AgentActivity {
  agentId: string;
  name: string;
  walletId: string;
  totalSpent: string;
  transactionCount: number;
  lastActive: string | null;
  domains: string[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface FlowResult<T = unknown> {
  flowId: string;
  status: "completed" | "failed";
  steps: FlowStep[];
  result: T;
  duration: number;
}

export interface FlowStep {
  name: string;
  status: "completed" | "failed" | "skipped";
  data?: unknown;
  error?: string;
  duration: number;
}

export interface AgentOnboardingResult {
  wallet: Wallet;
  agent: AgentWithSessionKey;
  policy: Policy;
}

export interface PaymentFlowResult {
  wallet: Wallet;
  agent: AgentWithSessionKey;
  policy: Policy;
  payments: Payment[];
  stats: PaymentStats;
}

export interface MultiAgentResult {
  wallet: Wallet;
  agents: AgentWithSessionKey[];
  policies: Policy[];
}

export interface LifecycleResult {
  wallet: Wallet;
  agent: AgentWithSessionKey;
  policy: Policy;
  payments: Payment[];
  revokedAgent: Agent;
  postRevokeWallet: Wallet;
}
