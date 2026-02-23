import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackendClient } from "../client/index.js";
import {
  makeWallet,
  makeAgent,
  makePolicy,
  makePayment,
  makePaymentStats,
  makeSpendingData,
  makeAgentActivity,
  makeHealthResponse,
} from "./fixtures.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status: number) {
  return new Response(body, { status });
}

describe("BackendClient", () => {
  let client: BackendClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new BackendClient("http://localhost:3001");
  });

  describe("constructor", () => {
    it("strips trailing slash from baseUrl", () => {
      const c = new BackendClient("http://localhost:3001/");
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ wallets: [] })
      );
      c.listWallets();
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/wallets",
        expect.anything()
      );
    });
  });

  describe("request error handling", () => {
    it("throws on non-ok response with body text", async () => {
      mockFetch.mockResolvedValueOnce(textResponse("Not Found", 404));
      await expect(client.health()).rejects.toThrow("Backend 404: Not Found");
    });

    it("throws on 500 response", async () => {
      mockFetch.mockResolvedValueOnce(textResponse("Server Error", 500));
      await expect(client.listWallets()).rejects.toThrow(
        "Backend 500: Server Error"
      );
    });
  });

  describe("health", () => {
    it("returns health response", async () => {
      const data = makeHealthResponse();
      mockFetch.mockResolvedValueOnce(jsonResponse(data));
      const result = await client.health();
      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/health",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });

  describe("wallets", () => {
    it("createWallet sends POST and unwraps wallet", async () => {
      const wallet = makeWallet();
      mockFetch.mockResolvedValueOnce(jsonResponse({ wallet }));
      const result = await client.createWallet({
        name: "Test Wallet",
        chainId: 31337,
      });
      expect(result).toEqual(wallet);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/wallets",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Test Wallet", chainId: 31337 }),
        })
      );
    });

    it("listWallets sends GET and unwraps wallets array", async () => {
      const wallets = [makeWallet(), makeWallet({ id: "wallet-2" })];
      mockFetch.mockResolvedValueOnce(jsonResponse({ wallets }));
      const result = await client.listWallets();
      expect(result).toEqual(wallets);
    });

    it("getWallet sends GET with id and unwraps", async () => {
      const wallet = makeWallet();
      mockFetch.mockResolvedValueOnce(jsonResponse({ wallet }));
      const result = await client.getWallet("wallet-1");
      expect(result).toEqual(wallet);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/wallets/wallet-1",
        expect.anything()
      );
    });

    it("deleteWallet sends DELETE", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.deleteWallet("wallet-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/wallets/wallet-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("agents", () => {
    it("createAgent sends POST with walletId in path, rest in body", async () => {
      const agent = makeAgent();
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ agent, sessionKey: "sk-123" })
      );
      const result = await client.createAgent({
        walletId: "wallet-1",
        name: "Test Agent",
        policyId: "policy-1",
        permissions: ["transfer"],
      });
      expect(result).toEqual({ ...agent, sessionKey: "sk-123" });
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/wallets/wallet-1/agents",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Test Agent",
            policyId: "policy-1",
            permissions: ["transfer"],
          }),
        })
      );
    });

    it("listAgents without walletId", async () => {
      const agents = [makeAgent()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ agents }));
      const result = await client.listAgents();
      expect(result).toEqual(agents);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/agents",
        expect.anything()
      );
    });

    it("listAgents with walletId adds query param", async () => {
      const agents = [makeAgent()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ agents }));
      const result = await client.listAgents("wallet-1");
      expect(result).toEqual(agents);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/agents?walletId=wallet-1",
        expect.anything()
      );
    });

    it("getAgent sends GET with id", async () => {
      const agent = makeAgent();
      mockFetch.mockResolvedValueOnce(jsonResponse({ agent }));
      const result = await client.getAgent("agent-1");
      expect(result).toEqual(agent);
    });

    it("revokeAgent sends POST to revoke endpoint", async () => {
      const agent = makeAgent({ status: "revoked" as any });
      mockFetch.mockResolvedValueOnce(jsonResponse({ agent }));
      const result = await client.revokeAgent("agent-1");
      expect(result).toEqual(agent);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/agents/agent-1/revoke",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("deleteAgent sends DELETE", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.deleteAgent("agent-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/agents/agent-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("policies", () => {
    it("createPolicy sends POST and unwraps", async () => {
      const policy = makePolicy();
      mockFetch.mockResolvedValueOnce(jsonResponse({ policy }));
      const result = await client.createPolicy({
        name: "Test Policy",
        rules: [],
      });
      expect(result).toEqual(policy);
    });

    it("listPolicies sends GET and unwraps", async () => {
      const policies = [makePolicy()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ policies }));
      const result = await client.listPolicies();
      expect(result).toEqual(policies);
    });

    it("getPolicy sends GET with id", async () => {
      const policy = makePolicy();
      mockFetch.mockResolvedValueOnce(jsonResponse({ policy }));
      const result = await client.getPolicy("policy-1");
      expect(result).toEqual(policy);
    });

    it("updatePolicy sends PUT with id and body", async () => {
      const policy = makePolicy({ name: "Updated" });
      mockFetch.mockResolvedValueOnce(jsonResponse({ policy }));
      const result = await client.updatePolicy("policy-1", {
        name: "Updated",
      });
      expect(result).toEqual(policy);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/policies/policy-1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        })
      );
    });

    it("deletePolicy sends DELETE", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await client.deletePolicy("policy-1");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/policies/policy-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("payments", () => {
    it("createPayment sends POST and unwraps", async () => {
      const payment = makePayment();
      mockFetch.mockResolvedValueOnce(jsonResponse({ payment }));
      const result = await client.createPayment({
        agentId: "agent-1",
        walletId: "wallet-1",
        domain: "api.example.com",
        amount: "1.500000",
      });
      expect(result).toEqual(payment);
    });

    it("listPayments without filters", async () => {
      const payments = [makePayment()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ payments }));
      const result = await client.listPayments();
      expect(result).toEqual(payments);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/payments",
        expect.anything()
      );
    });

    it("listPayments with filters adds query params", async () => {
      const payments = [makePayment()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ payments }));
      await client.listPayments({
        agentId: "agent-1",
        domain: "api.example.com",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("agentId=agent-1");
      expect(calledUrl).toContain("domain=api.example.com");
    });

    it("listPayments with empty filters sends no query", async () => {
      const payments: never[] = [];
      mockFetch.mockResolvedValueOnce(jsonResponse({ payments }));
      await client.listPayments({});
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/payments",
        expect.anything()
      );
    });

    it("getPaymentStats sends GET and unwraps stats", async () => {
      const stats = makePaymentStats();
      mockFetch.mockResolvedValueOnce(jsonResponse({ stats }));
      const result = await client.getPaymentStats();
      expect(result).toEqual(stats);
    });
  });

  describe("analytics", () => {
    it("getSpending without params", async () => {
      const spending = [makeSpendingData()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ spending }));
      const result = await client.getSpending();
      expect(result).toEqual(spending);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/analytics/spending",
        expect.anything()
      );
    });

    it("getSpending with params adds query string", async () => {
      const spending = [makeSpendingData()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ spending }));
      await client.getSpending({ period: "daily", walletId: "wallet-1" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("period=daily");
      expect(calledUrl).toContain("walletId=wallet-1");
    });

    it("getAgentActivity without params", async () => {
      const agents = [makeAgentActivity()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ agents }));
      const result = await client.getAgentActivity();
      expect(result).toEqual(agents);
    });

    it("getAgentActivity with params converts limit to string", async () => {
      const agents = [makeAgentActivity()];
      mockFetch.mockResolvedValueOnce(jsonResponse({ agents }));
      await client.getAgentActivity({
        walletId: "wallet-1",
        limit: 10,
        sortBy: "spent",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("walletId=wallet-1");
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("sortBy=spent");
    });
  });
});
