import type {
  Wallet,
  Agent,
  AgentWithSessionKey,
  Policy,
  Payment,
  PaymentStats,
  SpendingData,
  AgentActivity,
  HealthResponse,
} from "../types/index.js";
import { AgentStatus } from "../types/index.js";

export function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wallet-1",
    address: "0xabc123",
    name: "Test Wallet",
    chainId: 31337,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-1",
    walletId: "wallet-1",
    name: "Test Agent",
    publicKey: "0xpub123",
    policyId: "policy-1",
    status: AgentStatus.ACTIVE,
    permissions: ["transfer", "swap"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    revokedAt: null,
    ...overrides,
  };
}

export function makeAgentWithSessionKey(
  overrides: Partial<AgentWithSessionKey> = {}
): AgentWithSessionKey {
  return {
    ...makeAgent(),
    sessionKey: "sk-test-123",
    ...overrides,
  };
}

export function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: "policy-1",
    name: "Test Policy",
    description: "A test policy",
    rules: [
      {
        type: "spending_limit",
        spendingLimit: {
          maxAmount: "100.000000",
          period: "daily",
          currency: "USDC",
        },
      },
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    agentId: "agent-1",
    walletId: "wallet-1",
    domain: "api.example.com",
    amount: "1.500000",
    currency: "USDC",
    status: "completed",
    metadata: {},
    createdAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makePaymentStats(
  overrides: Partial<PaymentStats> = {}
): PaymentStats {
  return {
    totalSpent: "10.000000",
    totalTransactions: 5,
    byAgent: {
      "agent-1": { spent: "10.000000", count: 5 },
    },
    byDomain: {
      "api.example.com": { spent: "10.000000", count: 5 },
    },
    byPeriod: [{ period: "2025-01", spent: "10.000000", count: 5 }],
    ...overrides,
  };
}

export function makeSpendingData(
  overrides: Partial<SpendingData> = {}
): SpendingData {
  return {
    period: "2025-01",
    totalSpent: "10.000000",
    transactionCount: 5,
    ...overrides,
  };
}

export function makeAgentActivity(
  overrides: Partial<AgentActivity> = {}
): AgentActivity {
  return {
    agentId: "agent-1",
    name: "Test Agent",
    walletId: "wallet-1",
    totalSpent: "10.000000",
    transactionCount: 5,
    lastActive: "2025-01-01T00:00:00Z",
    domains: ["api.example.com"],
    ...overrides,
  };
}

export function makeHealthResponse(
  overrides: Partial<HealthResponse> = {}
): HealthResponse {
  return {
    status: "ok",
    timestamp: "2025-01-01T00:00:00Z",
    version: "0.1.0",
    ...overrides,
  };
}
