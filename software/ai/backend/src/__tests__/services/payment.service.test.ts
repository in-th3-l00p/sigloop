import { describe, it, expect, beforeEach } from "vitest";
import { paymentService } from "../../services/payment.service.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { paymentsStore } from "../../store/payments.store.js";
import type { Wallet } from "../../types/wallet.js";
import type { Agent } from "../../types/agent.js";
import { AgentStatus } from "../../types/agent.js";

function seedWallet(id: string = "wallet-1"): Wallet {
  const now = new Date().toISOString();
  const wallet: Wallet = {
    id,
    address: "0xabc",
    name: "Test Wallet",
    chainId: 1,
    createdAt: now,
    updatedAt: now,
  };
  return walletsStore.create(wallet);
}

function seedAgent(id: string = "agent-1", walletId: string = "wallet-1"): Agent {
  const now = new Date().toISOString();
  const agent: Agent = {
    id,
    walletId,
    name: "Test Agent",
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

describe("PaymentService", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    paymentsStore.clear();
  });

  describe("record", () => {
    it("records a valid payment", () => {
      seedWallet();
      seedAgent();
      const payment = paymentService.record({
        agentId: "agent-1",
        walletId: "wallet-1",
        domain: "example.com",
        amount: "10.50",
      });
      expect(payment).toHaveProperty("id");
      expect(payment.agentId).toBe("agent-1");
      expect(payment.walletId).toBe("wallet-1");
      expect(payment.domain).toBe("example.com");
      expect(payment.amount).toBe("10.50");
      expect(payment.currency).toBe("USDC");
      expect(payment.status).toBe("completed");
      expect(payment.metadata).toEqual({});
    });

    it("records payment with custom currency and metadata", () => {
      seedWallet();
      seedAgent();
      const payment = paymentService.record({
        agentId: "agent-1",
        walletId: "wallet-1",
        domain: "test.io",
        amount: "5",
        currency: "ETH",
        metadata: { txHash: "0xabc" },
      });
      expect(payment.currency).toBe("ETH");
      expect(payment.metadata).toEqual({ txHash: "0xabc" });
    });

    it("trims domain", () => {
      seedWallet();
      seedAgent();
      const payment = paymentService.record({
        agentId: "agent-1",
        walletId: "wallet-1",
        domain: "  spaced.com  ",
        amount: "1",
      });
      expect(payment.domain).toBe("spaced.com");
    });

    it("throws when agentId is empty", () => {
      expect(() =>
        paymentService.record({ agentId: "", walletId: "w", domain: "d", amount: "1" })
      ).toThrow("agentId is required");
    });

    it("throws when walletId is empty", () => {
      expect(() =>
        paymentService.record({ agentId: "a", walletId: "", domain: "d", amount: "1" })
      ).toThrow("walletId is required");
    });

    it("throws when domain is empty", () => {
      expect(() =>
        paymentService.record({ agentId: "a", walletId: "w", domain: "", amount: "1" })
      ).toThrow("domain is required");
    });

    it("throws when amount is missing", () => {
      expect(() =>
        paymentService.record({ agentId: "a", walletId: "w", domain: "d", amount: "" })
      ).toThrow("amount is required");
    });

    it("throws when amount is not a positive number", () => {
      seedWallet();
      seedAgent();
      expect(() =>
        paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "d", amount: "-5" })
      ).toThrow("amount must be a positive number");
    });

    it("throws when amount is not a number", () => {
      seedWallet();
      seedAgent();
      expect(() =>
        paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "d", amount: "abc" })
      ).toThrow("amount must be a positive number");
    });

    it("throws when agent not found", () => {
      seedWallet();
      expect(() =>
        paymentService.record({ agentId: "missing", walletId: "wallet-1", domain: "d", amount: "1" })
      ).toThrow("Agent not found: missing");
    });

    it("throws when wallet not found", () => {
      seedWallet("other");
      seedAgent("agent-1", "other");
      expect(() =>
        paymentService.record({ agentId: "agent-1", walletId: "missing", domain: "d", amount: "1" })
      ).toThrow("Wallet not found: missing");
    });

    it("throws when agent does not belong to wallet", () => {
      seedWallet("wallet-1");
      seedWallet("wallet-2");
      seedAgent("agent-1", "wallet-1");
      expect(() =>
        paymentService.record({ agentId: "agent-1", walletId: "wallet-2", domain: "d", amount: "1" })
      ).toThrow("Agent does not belong to the specified wallet");
    });
  });

  describe("list", () => {
    it("returns all payments when no filters", () => {
      seedWallet();
      seedAgent();
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "a.com", amount: "1" });
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "b.com", amount: "2" });
      expect(paymentService.list()).toHaveLength(2);
    });

    it("filters by agentId", () => {
      seedWallet();
      seedAgent("agent-1");
      seedAgent("agent-2");
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "a.com", amount: "1" });
      paymentService.record({ agentId: "agent-2", walletId: "wallet-1", domain: "b.com", amount: "2" });
      const result = paymentService.list({ agentId: "agent-1" });
      expect(result).toHaveLength(1);
      expect(result[0].agentId).toBe("agent-1");
    });

    it("filters by walletId", () => {
      seedWallet("w1");
      seedWallet("w2");
      seedAgent("a1", "w1");
      seedAgent("a2", "w2");
      paymentService.record({ agentId: "a1", walletId: "w1", domain: "a.com", amount: "1" });
      paymentService.record({ agentId: "a2", walletId: "w2", domain: "b.com", amount: "2" });
      const result = paymentService.list({ walletId: "w1" });
      expect(result).toHaveLength(1);
      expect(result[0].walletId).toBe("w1");
    });

    it("filters by domain", () => {
      seedWallet();
      seedAgent();
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "a.com", amount: "1" });
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "b.com", amount: "2" });
      const result = paymentService.list({ domain: "a.com" });
      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe("a.com");
    });

    it("returns empty array when no payments", () => {
      expect(paymentService.list()).toEqual([]);
    });
  });

  describe("getStats", () => {
    it("returns zeroed stats when no payments", () => {
      const stats = paymentService.getStats();
      expect(stats.totalSpent).toBe("0.000000");
      expect(stats.totalTransactions).toBe(0);
      expect(stats.byAgent).toEqual({});
      expect(stats.byDomain).toEqual({});
      expect(stats.byPeriod).toEqual([]);
    });

    it("aggregates stats correctly", () => {
      seedWallet();
      seedAgent("agent-1");
      seedAgent("agent-2");
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "a.com", amount: "10" });
      paymentService.record({ agentId: "agent-1", walletId: "wallet-1", domain: "b.com", amount: "20" });
      paymentService.record({ agentId: "agent-2", walletId: "wallet-1", domain: "a.com", amount: "5" });

      const stats = paymentService.getStats();
      expect(stats.totalSpent).toBe("35.000000");
      expect(stats.totalTransactions).toBe(3);
      expect(stats.byAgent["agent-1"].count).toBe(2);
      expect(stats.byAgent["agent-2"].count).toBe(1);
      expect(stats.byDomain["a.com"].count).toBe(2);
      expect(stats.byDomain["b.com"].count).toBe(1);
      expect(stats.byPeriod.length).toBeGreaterThan(0);
    });
  });
});
