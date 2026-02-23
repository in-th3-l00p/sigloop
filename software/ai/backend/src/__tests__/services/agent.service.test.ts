import { describe, it, expect, beforeEach } from "vitest";
import { agentService } from "../../services/agent.service.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { policiesStore } from "../../store/policies.store.js";
import { keyManagerService } from "../../services/keymanager.service.js";
import { AgentStatus } from "../../types/agent.js";
import type { Wallet } from "../../types/wallet.js";
import type { Policy } from "../../types/policy.js";

function createTestWallet(overrides?: Partial<Wallet>): Wallet {
  const now = new Date().toISOString();
  const wallet: Wallet = {
    id: crypto.randomUUID(),
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Test Wallet",
    chainId: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  return walletsStore.create(wallet);
}

function createTestPolicy(overrides?: Partial<Policy>): Policy {
  const now = new Date().toISOString();
  const policy: Policy = {
    id: crypto.randomUUID(),
    name: "Test Policy",
    description: "A test policy",
    rules: [{ type: "spending_limit", spendingLimit: { maxAmount: "100", period: "daily", currency: "USDC" } }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  return policiesStore.create(policy);
}

describe("AgentService", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    policiesStore.clear();
  });

  describe("create", () => {
    it("creates an agent with valid data", () => {
      const wallet = createTestWallet();
      const result = agentService.create(wallet.id, { name: "My Agent" });
      expect(result.agent).toHaveProperty("id");
      expect(result.agent.name).toBe("My Agent");
      expect(result.agent.walletId).toBe(wallet.id);
      expect(result.agent.status).toBe(AgentStatus.ACTIVE);
      expect(result.agent.policyId).toBeNull();
      expect(result.agent.permissions).toEqual([]);
      expect(result.agent.revokedAt).toBeNull();
      expect(result.sessionKey).toBeTruthy();
    });

    it("creates an agent with a policy", () => {
      const wallet = createTestWallet();
      const policy = createTestPolicy();
      const result = agentService.create(wallet.id, { name: "Policy Agent", policyId: policy.id });
      expect(result.agent.policyId).toBe(policy.id);
    });

    it("creates an agent with permissions", () => {
      const wallet = createTestWallet();
      const result = agentService.create(wallet.id, { name: "Perm Agent", permissions: ["read", "write"] });
      expect(result.agent.permissions).toEqual(["read", "write"]);
    });

    it("stores the key pair for the agent", () => {
      const wallet = createTestWallet();
      const result = agentService.create(wallet.id, { name: "Key Agent" });
      expect(keyManagerService.hasKey(result.agent.id)).toBe(true);
      expect(keyManagerService.retrievePublicKey(result.agent.id)).toBe(result.agent.publicKey);
    });

    it("trims agent name", () => {
      const wallet = createTestWallet();
      const result = agentService.create(wallet.id, { name: "  Trimmed  " });
      expect(result.agent.name).toBe("Trimmed");
    });

    it("throws when name is empty", () => {
      const wallet = createTestWallet();
      expect(() => agentService.create(wallet.id, { name: "" })).toThrow("Agent name is required");
    });

    it("throws when name is whitespace", () => {
      const wallet = createTestWallet();
      expect(() => agentService.create(wallet.id, { name: "   " })).toThrow("Agent name is required");
    });

    it("throws when wallet not found", () => {
      expect(() => agentService.create("nonexistent", { name: "Agent" })).toThrow("Wallet not found");
    });

    it("throws when policy not found", () => {
      const wallet = createTestWallet();
      expect(() =>
        agentService.create(wallet.id, { name: "Agent", policyId: "nonexistent" })
      ).toThrow("Policy not found");
    });
  });

  describe("get", () => {
    it("returns an existing agent", () => {
      const wallet = createTestWallet();
      const { agent } = agentService.create(wallet.id, { name: "Get Agent" });
      expect(agentService.get(agent.id)).toEqual(agent);
    });

    it("throws when agent not found", () => {
      expect(() => agentService.get("nonexistent")).toThrow("Agent not found: nonexistent");
    });
  });

  describe("list", () => {
    it("returns empty array when no agents", () => {
      expect(agentService.list()).toEqual([]);
    });

    it("returns all agents", () => {
      const wallet = createTestWallet();
      agentService.create(wallet.id, { name: "Agent 1" });
      agentService.create(wallet.id, { name: "Agent 2" });
      expect(agentService.list()).toHaveLength(2);
    });
  });

  describe("listByWallet", () => {
    it("returns agents for specific wallet", () => {
      const wallet1 = createTestWallet({ name: "W1" });
      const wallet2 = createTestWallet({ name: "W2" });
      agentService.create(wallet1.id, { name: "Agent W1" });
      agentService.create(wallet2.id, { name: "Agent W2" });
      const result = agentService.listByWallet(wallet1.id);
      expect(result).toHaveLength(1);
      expect(result[0].walletId).toBe(wallet1.id);
    });

    it("returns empty array for wallet with no agents", () => {
      expect(agentService.listByWallet("no-wallet")).toEqual([]);
    });
  });

  describe("revoke", () => {
    it("revokes an active agent", () => {
      const wallet = createTestWallet();
      const { agent } = agentService.create(wallet.id, { name: "Revoke Me" });
      const revoked = agentService.revoke(agent.id);
      expect(revoked.status).toBe(AgentStatus.REVOKED);
      expect(revoked.revokedAt).toBeTruthy();
    });

    it("deletes the key on revocation", () => {
      const wallet = createTestWallet();
      const { agent } = agentService.create(wallet.id, { name: "Key Revoke" });
      agentService.revoke(agent.id);
      expect(keyManagerService.hasKey(agent.id)).toBe(false);
    });

    it("throws when agent not found", () => {
      expect(() => agentService.revoke("nonexistent")).toThrow("Agent not found");
    });

    it("throws when agent is already revoked", () => {
      const wallet = createTestWallet();
      const { agent } = agentService.create(wallet.id, { name: "Double Revoke" });
      agentService.revoke(agent.id);
      expect(() => agentService.revoke(agent.id)).toThrow("Agent is already revoked");
    });
  });

  describe("delete", () => {
    it("deletes an agent and its key", () => {
      const wallet = createTestWallet();
      const { agent } = agentService.create(wallet.id, { name: "Delete Me" });
      agentService.delete(agent.id);
      expect(agentsStore.get(agent.id)).toBeUndefined();
      expect(keyManagerService.hasKey(agent.id)).toBe(false);
    });

    it("throws when agent not found", () => {
      expect(() => agentService.delete("nonexistent")).toThrow("Agent not found");
    });
  });
});
