import { describe, it, expect, beforeEach } from "vitest";
import { analyticsService } from "../../services/analytics.service.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { paymentsStore } from "../../store/payments.store.js";
import type { Wallet } from "../../types/wallet.js";
import type { Agent } from "../../types/agent.js";
import type { Payment } from "../../types/payment.js";
import { AgentStatus } from "../../types/agent.js";

function seedWallet(id: string = "wallet-1"): Wallet {
  const now = new Date().toISOString();
  const wallet: Wallet = { id, address: "0xabc", name: "W", chainId: 1, createdAt: now, updatedAt: now };
  return walletsStore.create(wallet);
}

function seedAgent(id: string, walletId: string = "wallet-1", name: string = "Agent"): Agent {
  const now = new Date().toISOString();
  const agent: Agent = {
    id,
    walletId,
    name,
    publicKey: "0xpub",
    policyId: null,
    status: AgentStatus.ACTIVE,
    permissions: [],
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  };
  return agentsStore.create(agent);
}

function seedPayment(overrides: Partial<Payment> & { id: string }): Payment {
  const payment: Payment = {
    agentId: "agent-1",
    walletId: "wallet-1",
    domain: "example.com",
    amount: "10",
    currency: "USDC",
    status: "completed",
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  return paymentsStore.append(payment);
}

describe("AnalyticsService", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    paymentsStore.clear();
  });

  describe("getSpending", () => {
    it("returns empty array when no payments", () => {
      expect(analyticsService.getSpending()).toEqual([]);
    });

    it("returns daily spending data", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", createdAt: "2025-01-15T10:00:00Z" });
      seedPayment({ id: "p2", amount: "20", createdAt: "2025-01-15T14:00:00Z" });
      seedPayment({ id: "p3", amount: "5", createdAt: "2025-01-16T10:00:00Z" });

      const result = analyticsService.getSpending({ period: "daily" });
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe("2025-01-15");
      expect(result[0].totalSpent).toBe("30.000000");
      expect(result[0].transactionCount).toBe(2);
      expect(result[1].period).toBe("2025-01-16");
      expect(result[1].totalSpent).toBe("5.000000");
    });

    it("returns hourly spending data", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", createdAt: "2025-01-15T10:30:00Z" });
      seedPayment({ id: "p2", amount: "5", createdAt: "2025-01-15T10:45:00Z" });

      const result = analyticsService.getSpending({ period: "hourly" });
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe("2025-01-15T10:00:00Z");
      expect(result[0].totalSpent).toBe("15.000000");
    });

    it("returns monthly spending data", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", createdAt: "2025-01-15T10:00:00Z" });
      seedPayment({ id: "p2", amount: "20", createdAt: "2025-02-15T10:00:00Z" });

      const result = analyticsService.getSpending({ period: "monthly" });
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe("2025-01");
      expect(result[1].period).toBe("2025-02");
    });

    it("filters by walletId", () => {
      seedWallet("w1");
      seedWallet("w2");
      seedAgent("a1", "w1");
      seedAgent("a2", "w2");
      seedPayment({ id: "p1", agentId: "a1", walletId: "w1", amount: "10" });
      seedPayment({ id: "p2", agentId: "a2", walletId: "w2", amount: "20" });

      const result = analyticsService.getSpending({ walletId: "w1" });
      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe("10.000000");
    });

    it("filters by agentId", () => {
      seedWallet();
      seedAgent("a1");
      seedAgent("a2");
      seedPayment({ id: "p1", agentId: "a1", amount: "10" });
      seedPayment({ id: "p2", agentId: "a2", amount: "20" });

      const result = analyticsService.getSpending({ agentId: "a1" });
      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe("10.000000");
    });

    it("filters by date range", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", createdAt: "2025-01-10T10:00:00Z" });
      seedPayment({ id: "p2", amount: "20", createdAt: "2025-01-15T10:00:00Z" });
      seedPayment({ id: "p3", amount: "30", createdAt: "2025-01-20T10:00:00Z" });

      const result = analyticsService.getSpending({
        startDate: "2025-01-12T00:00:00Z",
        endDate: "2025-01-18T00:00:00Z",
      });
      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe("20.000000");
    });

    it("excludes non-completed payments", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", status: "completed" });
      seedPayment({ id: "p2", amount: "20", status: "pending" });
      seedPayment({ id: "p3", amount: "30", status: "failed" });

      const result = analyticsService.getSpending();
      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe("10.000000");
    });

    it("defaults to daily period", () => {
      seedWallet();
      seedAgent("agent-1");
      seedPayment({ id: "p1", amount: "10", createdAt: "2025-01-15T10:00:00Z" });

      const result = analyticsService.getSpending();
      expect(result[0].period).toBe("2025-01-15");
    });
  });

  describe("getAgentActivity", () => {
    it("returns empty array when no agents", () => {
      expect(analyticsService.getAgentActivity()).toEqual([]);
    });

    it("returns activity for agents", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "Alpha");
      seedAgent("a2", "wallet-1", "Beta");
      seedPayment({ id: "p1", agentId: "a1", amount: "100" });
      seedPayment({ id: "p2", agentId: "a1", amount: "50" });
      seedPayment({ id: "p3", agentId: "a2", amount: "200" });

      const result = analyticsService.getAgentActivity({ sortBy: "spent" });
      expect(result).toHaveLength(2);
      expect(result[0].agentId).toBe("a2");
      expect(result[0].totalSpent).toBe("200.000000");
      expect(result[1].agentId).toBe("a1");
      expect(result[1].totalSpent).toBe("150.000000");
    });

    it("sorts by transactions", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "Many");
      seedAgent("a2", "wallet-1", "Few");
      seedPayment({ id: "p1", agentId: "a1", amount: "1" });
      seedPayment({ id: "p2", agentId: "a1", amount: "1" });
      seedPayment({ id: "p3", agentId: "a1", amount: "1" });
      seedPayment({ id: "p4", agentId: "a2", amount: "100" });

      const result = analyticsService.getAgentActivity({ sortBy: "transactions" });
      expect(result[0].agentId).toBe("a1");
      expect(result[0].transactionCount).toBe(3);
    });

    it("sorts by recent activity", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "Old");
      seedAgent("a2", "wallet-1", "New");
      seedPayment({ id: "p1", agentId: "a1", amount: "10", createdAt: "2025-01-01T00:00:00Z" });
      seedPayment({ id: "p2", agentId: "a2", amount: "10", createdAt: "2025-06-01T00:00:00Z" });

      const result = analyticsService.getAgentActivity({ sortBy: "recent" });
      expect(result[0].agentId).toBe("a2");
    });

    it("handles agent with no payments in recent sort", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "NoPayments");
      seedAgent("a2", "wallet-1", "HasPayments");
      seedPayment({ id: "p1", agentId: "a2", amount: "10" });

      const result = analyticsService.getAgentActivity({ sortBy: "recent" });
      expect(result[0].agentId).toBe("a2");
      expect(result[1].lastActive).toBeNull();
    });

    it("filters by walletId", () => {
      seedWallet("w1");
      seedWallet("w2");
      seedAgent("a1", "w1");
      seedAgent("a2", "w2");

      const result = analyticsService.getAgentActivity({ walletId: "w1" });
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe("a1");
    });

    it("respects limit parameter", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "A1");
      seedAgent("a2", "wallet-1", "A2");
      seedAgent("a3", "wallet-1", "A3");

      const result = analyticsService.getAgentActivity({ limit: 2 });
      expect(result).toHaveLength(2);
    });

    it("defaults to limit 50", () => {
      seedWallet();
      for (let i = 0; i < 55; i++) {
        seedAgent(`a${i}`, "wallet-1", `Agent ${i}`);
      }
      const result = analyticsService.getAgentActivity();
      expect(result).toHaveLength(50);
    });

    it("includes domain information", () => {
      seedWallet();
      seedAgent("a1");
      seedPayment({ id: "p1", agentId: "a1", domain: "example.com", amount: "10" });
      seedPayment({ id: "p2", agentId: "a1", domain: "test.io", amount: "5" });

      const result = analyticsService.getAgentActivity();
      expect(result[0].domains).toContain("example.com");
      expect(result[0].domains).toContain("test.io");
    });
  });

  describe("getTopConsumers", () => {
    it("returns top consumers sorted by spend", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "Low");
      seedAgent("a2", "wallet-1", "High");
      seedPayment({ id: "p1", agentId: "a1", amount: "10" });
      seedPayment({ id: "p2", agentId: "a2", amount: "100" });

      const result = analyticsService.getTopConsumers(10);
      expect(result[0].agentId).toBe("a2");
      expect(result[0].name).toBe("High");
      expect(result[0].totalSpent).toBe("100.000000");
    });

    it("respects the limit", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "A1");
      seedAgent("a2", "wallet-1", "A2");
      seedAgent("a3", "wallet-1", "A3");

      const result = analyticsService.getTopConsumers(2);
      expect(result).toHaveLength(2);
    });

    it("returns correct shape without domains/walletId", () => {
      seedWallet();
      seedAgent("a1", "wallet-1", "Agent");
      seedPayment({ id: "p1", agentId: "a1", amount: "50" });

      const result = analyticsService.getTopConsumers();
      expect(result[0]).toHaveProperty("agentId");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("totalSpent");
      expect(result[0]).toHaveProperty("transactionCount");
      expect(result[0]).not.toHaveProperty("domains");
      expect(result[0]).not.toHaveProperty("walletId");
    });
  });
});
