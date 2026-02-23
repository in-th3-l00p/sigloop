import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { lifecycleFlows } from "../flows/lifecycle.js";
import type { BackendClient } from "../client/index.js";
import { AgentStatus } from "../types/index.js";
import {
  makeWallet,
  makePolicy,
  makeAgent,
  makeAgentWithSessionKey,
  makePayment,
} from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    createWallet: vi.fn(),
    createPolicy: vi.fn(),
    createAgent: vi.fn(),
    createPayment: vi.fn(),
    revokeAgent: vi.fn(),
    getWallet: vi.fn(),
    listAgents: vi.fn(),
    listPolicies: vi.fn(),
    listWallets: vi.fn(),
    deleteAgent: vi.fn(),
    deletePolicy: vi.fn(),
    deleteWallet: vi.fn(),
    updatePolicy: vi.fn(),
  } as unknown as BackendClient;
}

describe("lifecycleFlows", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/flows/lifecycle", lifecycleFlows(client));
  });

  describe("POST /api/flows/lifecycle/agent-lifecycle", () => {
    it("runs full agent lifecycle with defaults", async () => {
      const wallet = makeWallet();
      const policy = makePolicy();
      const agent = makeAgentWithSessionKey();
      const payment = makePayment();
      const revokedAgent = makeAgent({ status: AgentStatus.REVOKED });

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);
      vi.mocked(client.createPayment).mockResolvedValue(payment);
      vi.mocked(client.revokeAgent).mockResolvedValue(revokedAgent);
      vi.mocked(client.getWallet).mockResolvedValue(wallet);

      const res = await app.request("/api/flows/lifecycle/agent-lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.wallet).toEqual(wallet);
      expect(body.result.agent).toEqual(agent);
      expect(body.result.payments).toHaveLength(3);
      expect(body.result.revokedAgent).toEqual(revokedAgent);
      expect(body.result.postRevokeWallet).toEqual(wallet);
    });

    it("creates correct number of payments based on paymentCount", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.revokeAgent).mockResolvedValue(makeAgent());
      vi.mocked(client.getWallet).mockResolvedValue(makeWallet());

      await app.request("/api/flows/lifecycle/agent-lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentCount: 5 }),
      });

      expect(client.createPayment).toHaveBeenCalledTimes(5);
    });

    it("records step names correctly", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.revokeAgent).mockResolvedValue(makeAgent());
      vi.mocked(client.getWallet).mockResolvedValue(makeWallet());

      const res = await app.request("/api/flows/lifecycle/agent-lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentCount: 1 }),
      });

      const body = await res.json();
      const names = body.steps.map((s: any) => s.name);
      expect(names).toEqual([
        "create-wallet",
        "create-policy",
        "create-agent",
        "active-payment-1",
        "revoke-agent",
        "verify-wallet-state",
      ]);
    });
  });

  describe("POST /api/flows/lifecycle/policy-update", () => {
    it("runs policy update flow", async () => {
      const wallet = makeWallet();
      const policy = makePolicy();
      const updatedPolicy = makePolicy({ name: "Expanded Policy" });
      const agent = makeAgentWithSessionKey();
      const payment = makePayment();

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);
      vi.mocked(client.createPayment).mockResolvedValue(payment);
      vi.mocked(client.updatePolicy).mockResolvedValue(updatedPolicy);

      const res = await app.request("/api/flows/lifecycle/policy-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.initialPolicy).toEqual(policy);
      expect(body.result.updatedPolicy).toEqual(updatedPolicy);
      expect(body.result.payments).toHaveLength(2);
    });

    it("calls updatePolicy with expanded rules", async () => {
      const policy = makePolicy({ id: "pol-1" });
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.updatePolicy).mockResolvedValue(policy);

      await app.request("/api/flows/lifecycle/policy-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(client.updatePolicy).toHaveBeenCalledWith(
        "pol-1",
        expect.objectContaining({
          name: "Expanded Policy",
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: "spending_limit",
              spendingLimit: expect.objectContaining({
                maxAmount: "500.000000",
              }),
            }),
          ]),
        })
      );
    });

    it("records correct step sequence", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.updatePolicy).mockResolvedValue(makePolicy());

      const res = await app.request("/api/flows/lifecycle/policy-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      const names = body.steps.map((s: any) => s.name);
      expect(names).toEqual([
        "create-wallet",
        "create-initial-policy",
        "create-agent",
        "payment-under-initial-policy",
        "expand-policy",
        "payment-under-expanded-policy",
      ]);
    });
  });

  describe("POST /api/flows/lifecycle/cleanup", () => {
    it("deletes all resources", async () => {
      const activeAgent = makeAgent({
        id: "a1",
        status: AgentStatus.ACTIVE,
      });
      const revokedAgent = makeAgent({
        id: "a2",
        status: AgentStatus.REVOKED,
      });
      const policy = makePolicy({ id: "p1" });
      const wallet = makeWallet({ id: "w1" });

      vi.mocked(client.listAgents).mockResolvedValue([
        activeAgent,
        revokedAgent,
      ]);
      vi.mocked(client.revokeAgent).mockResolvedValue(activeAgent);
      vi.mocked(client.deleteAgent).mockResolvedValue(undefined);
      vi.mocked(client.listPolicies).mockResolvedValue([policy]);
      vi.mocked(client.deletePolicy).mockResolvedValue(undefined);
      vi.mocked(client.listWallets).mockResolvedValue([wallet]);
      vi.mocked(client.deleteWallet).mockResolvedValue(undefined);

      const res = await app.request("/api/flows/lifecycle/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.deleted).toEqual({
        agents: 2,
        policies: 1,
        wallets: 1,
      });

      expect(client.revokeAgent).toHaveBeenCalledWith("a1");
      expect(client.revokeAgent).toHaveBeenCalledTimes(1);
      expect(client.deleteAgent).toHaveBeenCalledTimes(2);
      expect(client.deletePolicy).toHaveBeenCalledTimes(1);
      expect(client.deleteWallet).toHaveBeenCalledTimes(1);
    });

    it("handles empty state gracefully", async () => {
      vi.mocked(client.listAgents).mockResolvedValue([]);
      vi.mocked(client.listPolicies).mockResolvedValue([]);
      vi.mocked(client.listWallets).mockResolvedValue([]);

      const res = await app.request("/api/flows/lifecycle/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const body = await res.json();
      expect(body.result.deleted).toEqual({
        agents: 0,
        policies: 0,
        wallets: 0,
      });
    });

    it("only revokes active agents before deleting", async () => {
      const revokedAgent = makeAgent({
        id: "a-revoked",
        status: AgentStatus.REVOKED,
      });
      const expiredAgent = makeAgent({
        id: "a-expired",
        status: AgentStatus.EXPIRED,
      });

      vi.mocked(client.listAgents).mockResolvedValue([
        revokedAgent,
        expiredAgent,
      ]);
      vi.mocked(client.deleteAgent).mockResolvedValue(undefined);
      vi.mocked(client.listPolicies).mockResolvedValue([]);
      vi.mocked(client.listWallets).mockResolvedValue([]);

      await app.request("/api/flows/lifecycle/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(client.revokeAgent).not.toHaveBeenCalled();
      expect(client.deleteAgent).toHaveBeenCalledTimes(2);
    });
  });
});
