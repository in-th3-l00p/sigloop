import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { onboardingFlows } from "../flows/onboarding.js";
import type { BackendClient } from "../client/index.js";
import {
  makeWallet,
  makePolicy,
  makeAgentWithSessionKey,
} from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    createWallet: vi.fn(),
    createPolicy: vi.fn(),
    createAgent: vi.fn(),
  } as unknown as BackendClient;
}

describe("onboardingFlows", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/flows/onboarding", onboardingFlows(client));
  });

  describe("POST /api/flows/onboarding/agent-onboarding", () => {
    it("creates wallet, policy, and agent with defaults", async () => {
      const wallet = makeWallet();
      const policy = makePolicy();
      const agent = makeAgentWithSessionKey();

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);

      const res = await app.request("/api/flows/onboarding/agent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.wallet).toEqual(wallet);
      expect(body.result.policy).toEqual(policy);
      expect(body.result.agent).toEqual(agent);
      expect(body.steps).toHaveLength(3);

      expect(client.createWallet).toHaveBeenCalledWith({
        name: "Test Wallet",
        chainId: 31337,
      });
      expect(client.createPolicy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Default Policy" })
      );
      expect(client.createAgent).toHaveBeenCalledWith({
        walletId: wallet.id,
        name: "Test Agent",
        policyId: policy.id,
        permissions: ["transfer", "swap"],
      });
    });

    it("uses custom values from request body", async () => {
      const wallet = makeWallet({ name: "Custom Wallet" });
      const policy = makePolicy({ name: "Custom Policy" });
      const agent = makeAgentWithSessionKey({ name: "Custom Agent" });

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);

      const res = await app.request("/api/flows/onboarding/agent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletName: "Custom Wallet",
          chainId: 42161,
          agentName: "Custom Agent",
          policyName: "Custom Policy",
          spendingLimit: "500.000000",
          spendingPeriod: "monthly",
          permissions: ["read"],
        }),
      });

      expect(res.status).toBe(201);
      expect(client.createWallet).toHaveBeenCalledWith({
        name: "Custom Wallet",
        chainId: 42161,
      });
    });

    it("includes allowlist rule when allowedDomains provided", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      await app.request("/api/flows/onboarding/agent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedDomains: ["api.trusted.com"],
        }),
      });

      const policyCall = vi.mocked(client.createPolicy).mock.calls[0][0];
      expect(policyCall.rules).toHaveLength(2);
      expect(policyCall.rules[1].type).toBe("allowlist");
      expect(policyCall.rules[1].allowlist?.domains).toEqual([
        "api.trusted.com",
      ]);
    });

    it("omits allowlist when allowedDomains is empty", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      await app.request("/api/flows/onboarding/agent-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const policyCall = vi.mocked(client.createPolicy).mock.calls[0][0];
      expect(policyCall.rules).toHaveLength(1);
      expect(policyCall.rules[0].type).toBe("spending_limit");
    });
  });

  describe("POST /api/flows/onboarding/multi-agent-setup", () => {
    it("creates wallet with multiple agents using defaults", async () => {
      const wallet = makeWallet({ name: "Multi-Agent Wallet" });
      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      const res = await app.request(
        "/api/flows/onboarding/multi-agent-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.agents).toHaveLength(3);
      expect(body.result.policies).toHaveLength(3);
      expect(client.createWallet).toHaveBeenCalledTimes(1);
      expect(client.createPolicy).toHaveBeenCalledTimes(3);
      expect(client.createAgent).toHaveBeenCalledTimes(3);
    });

    it("creates correct number of agents with custom config", async () => {
      const wallet = makeWallet();
      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      const res = await app.request(
        "/api/flows/onboarding/multi-agent-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletName: "Custom Multi",
            agents: [
              { name: "Agent A", permissions: ["read"], limit: "50.000000" },
              { name: "Agent B", permissions: ["write"], limit: "100.000000" },
            ],
          }),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.result.agents).toHaveLength(2);
      expect(body.result.policies).toHaveLength(2);
      expect(body.steps).toHaveLength(5);
    });

    it("records all step names correctly", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      const res = await app.request(
        "/api/flows/onboarding/multi-agent-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agents: [{ name: "Solo", permissions: ["read"] }],
          }),
        }
      );

      const body = await res.json();
      const stepNames = body.steps.map((s: any) => s.name);
      expect(stepNames).toContain("create-wallet");
      expect(stepNames).toContain("create-policy-Solo");
      expect(stepNames).toContain("create-agent-Solo");
    });
  });
});
