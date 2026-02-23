import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { scenarioFlows } from "../flows/scenarios.js";
import type { BackendClient } from "../client/index.js";
import {
  makeWallet,
  makePolicy,
  makeAgentWithSessionKey,
  makePayment,
  makePaymentStats,
  makeAgentActivity,
} from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    createWallet: vi.fn(),
    createPolicy: vi.fn(),
    createAgent: vi.fn(),
    createPayment: vi.fn(),
    getPaymentStats: vi.fn(),
    getAgentActivity: vi.fn(),
  } as unknown as BackendClient;
}

describe("scenarioFlows", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/flows/scenarios", scenarioFlows(client));
  });

  describe("POST /api/flows/scenarios/defi-trading-bot", () => {
    it("runs defi trading bot scenario with defaults", async () => {
      const wallet = makeWallet();
      const policy = makePolicy();
      const agent = makeAgentWithSessionKey();
      const payment = makePayment();
      const activity = [makeAgentActivity()];

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);
      vi.mocked(client.createPayment).mockResolvedValue(payment);
      vi.mocked(client.getAgentActivity).mockResolvedValue(activity);

      const res = await app.request(
        "/api/flows/scenarios/defi-trading-bot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.wallet).toEqual(wallet);
      expect(body.result.tradingAgent).toEqual(agent);
      expect(body.result.trades).toHaveLength(5);
      expect(body.result.activity).toEqual(activity);
    });

    it("creates trades cycling through trading pairs", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getAgentActivity).mockResolvedValue([]);

      await app.request("/api/flows/scenarios/defi-trading-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeCount: 4 }),
      });

      expect(client.createPayment).toHaveBeenCalledTimes(4);
      const calls = vi.mocked(client.createPayment).mock.calls;
      expect(calls[0][0].metadata?.pair).toBe("ETH/USDC");
      expect(calls[0][0].metadata?.action).toBe("buy");
      expect(calls[1][0].metadata?.pair).toBe("WBTC/USDC");
      expect(calls[1][0].metadata?.action).toBe("sell");
      expect(calls[2][0].metadata?.pair).toBe("ARB/USDC");
      expect(calls[2][0].metadata?.action).toBe("buy");
      expect(calls[3][0].metadata?.pair).toBe("ETH/USDC");
      expect(calls[3][0].metadata?.action).toBe("sell");
    });

    it("creates policy with time_window and allowlist rules", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getAgentActivity).mockResolvedValue([]);

      await app.request("/api/flows/scenarios/defi-trading-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const policyCall = vi.mocked(client.createPolicy).mock.calls[0][0];
      expect(policyCall.rules).toHaveLength(3);
      expect(policyCall.rules.map((r) => r.type)).toEqual([
        "spending_limit",
        "allowlist",
        "time_window",
      ]);
    });

    it("uses custom trade parameters", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getAgentActivity).mockResolvedValue([]);

      await app.request("/api/flows/scenarios/defi-trading-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: "My Bot",
          tradingPairs: ["SOL/USDC"],
          dailyBudget: "2000.000000",
          tradeSize: "100.000000",
          tradeCount: 2,
        }),
      });

      expect(client.createWallet).toHaveBeenCalledWith({
        name: "My Bot Treasury",
        chainId: 42161,
      });
      expect(client.createPayment).toHaveBeenCalledTimes(2);
    });
  });

  describe("POST /api/flows/scenarios/api-marketplace-consumer", () => {
    it("runs marketplace consumer scenario with defaults", async () => {
      const wallet = makeWallet();
      const policy = makePolicy();
      const agent = makeAgentWithSessionKey();
      const payment = makePayment();
      const stats = makePaymentStats();

      vi.mocked(client.createWallet).mockResolvedValue(wallet);
      vi.mocked(client.createPolicy).mockResolvedValue(policy);
      vi.mocked(client.createAgent).mockResolvedValue(agent);
      vi.mocked(client.createPayment).mockResolvedValue(payment);
      vi.mocked(client.getPaymentStats).mockResolvedValue(stats);

      const res = await app.request(
        "/api/flows/scenarios/api-marketplace-consumer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.apiCalls).toHaveLength(9);
      expect(body.result.summary.totalCalls).toBe(9);
    });

    it("creates correct number of calls per API", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(
        makePayment({ amount: "0.010000" })
      );
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request(
        "/api/flows/scenarios/api-marketplace-consumer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apis: [
              { domain: "test.api.com", costPerCall: "0.010000" },
            ],
            callsPerApi: 5,
          }),
        }
      );

      const body = await res.json();
      expect(body.result.apiCalls).toHaveLength(5);
      expect(client.createPayment).toHaveBeenCalledTimes(5);
    });

    it("includes x402 metadata in payment calls", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      await app.request("/api/flows/scenarios/api-marketplace-consumer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apis: [{ domain: "weather.api.io", costPerCall: "0.010000" }],
          callsPerApi: 1,
        }),
      });

      expect(client.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: "weather.api.io",
          amount: "0.010000",
          metadata: expect.objectContaining({
            requestType: "x402",
            callIndex: "1",
            endpoint: "/v1/weather",
          }),
        })
      );
    });

    it("calculates summary spending correctly", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );

      let callCount = 0;
      vi.mocked(client.createPayment).mockImplementation(async (data) => {
        callCount++;
        return makePayment({
          id: `payment-${callCount}`,
          amount: data.amount,
        });
      });
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request(
        "/api/flows/scenarios/api-marketplace-consumer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apis: [
              { domain: "a.io", costPerCall: "1.000000" },
              { domain: "b.io", costPerCall: "2.000000" },
            ],
            callsPerApi: 2,
          }),
        }
      );

      const body = await res.json();
      expect(body.result.summary.totalCalls).toBe(4);
      expect(body.result.summary.totalSpent).toBe("6.000000");
      expect(body.result.summary.byDomain).toEqual([
        { domain: "a.io", calls: 2, spent: "2.000000" },
        { domain: "b.io", calls: 2, spent: "4.000000" },
      ]);
    });
  });

  describe("POST /api/flows/scenarios/multi-chain-operations", () => {
    it("runs multi-chain scenario with defaults", async () => {
      let walletIdx = 0;
      vi.mocked(client.createWallet).mockImplementation(async (data) => {
        walletIdx++;
        return makeWallet({ id: `w-${walletIdx}`, name: data.name });
      });

      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());

      let agentIdx = 0;
      vi.mocked(client.createAgent).mockImplementation(async (data) => {
        agentIdx++;
        return makeAgentWithSessionKey({
          id: `a-${agentIdx}`,
          name: data.name,
        });
      });

      vi.mocked(client.createPayment).mockResolvedValue(makePayment());

      const res = await app.request(
        "/api/flows/scenarios/multi-chain-operations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.wallets).toHaveLength(3);
      expect(body.result.agents).toHaveLength(3);
      expect(body.result.payments).toHaveLength(3);
      expect(body.result.chains).toHaveLength(3);
      expect(client.createWallet).toHaveBeenCalledTimes(3);
      expect(client.createAgent).toHaveBeenCalledTimes(3);
      expect(client.createPayment).toHaveBeenCalledTimes(3);
    });

    it("creates wallets for each chain", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());

      await app.request("/api/flows/scenarios/multi-chain-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chains: [
            { name: "TestChain", chainId: 999 },
          ],
        }),
      });

      expect(client.createWallet).toHaveBeenCalledWith({
        name: "TestChain Wallet",
        chainId: 999,
      });
    });

    it("creates payments with chain metadata", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(
        makeWallet({ id: "w1" })
      );
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey({ id: "a1" })
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());

      await app.request("/api/flows/scenarios/multi-chain-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chains: [{ name: "Base", chainId: 8453 }],
          paymentPerChain: "50.000000",
        }),
      });

      expect(client.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "a1",
          walletId: "w1",
          domain: "bridge.base.io",
          amount: "50.000000",
          metadata: {
            chainId: "8453",
            chainName: "Base",
            operation: "bridge-transfer",
          },
        })
      );
    });

    it("creates single cross-chain policy shared by all agents", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(
        makePolicy({ id: "shared-pol" })
      );
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());

      await app.request("/api/flows/scenarios/multi-chain-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chains: [
            { name: "A", chainId: 1 },
            { name: "B", chainId: 2 },
          ],
        }),
      });

      expect(client.createPolicy).toHaveBeenCalledTimes(1);
      const agentCalls = vi.mocked(client.createAgent).mock.calls;
      expect(agentCalls[0][0].policyId).toBe("shared-pol");
      expect(agentCalls[1][0].policyId).toBe("shared-pol");
    });
  });
});
