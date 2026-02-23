import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { paymentFlows } from "../flows/payment.js";
import type { BackendClient } from "../client/index.js";
import {
  makeWallet,
  makePolicy,
  makeAgentWithSessionKey,
  makePayment,
  makePaymentStats,
} from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    createWallet: vi.fn(),
    createPolicy: vi.fn(),
    createAgent: vi.fn(),
    createPayment: vi.fn(),
    getPaymentStats: vi.fn(),
  } as unknown as BackendClient;
}

describe("paymentFlows", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/flows/payment", paymentFlows(client));
  });

  describe("POST /api/flows/payment/x402-simulation", () => {
    it("runs full x402 simulation with defaults", async () => {
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

      const res = await app.request("/api/flows/payment/x402-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.wallet).toEqual(wallet);
      expect(body.result.agent).toEqual(agent);
      expect(body.result.policy).toEqual(policy);
      expect(body.result.payments).toHaveLength(3);
      expect(body.result.stats).toEqual(stats);
      expect(body.steps).toHaveLength(7);
    });

    it("uses custom payments list", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request("/api/flows/payment/x402-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [{ domain: "custom.api.com", amount: "5.000000" }],
        }),
      });

      const body = await res.json();
      expect(body.result.payments).toHaveLength(1);
      expect(client.createPayment).toHaveBeenCalledTimes(1);
    });

    it("passes currency and metadata from payment config", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      await app.request("/api/flows/payment/x402-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: [
            {
              domain: "test.io",
              amount: "1.000000",
              currency: "ETH",
              metadata: { key: "value" },
            },
          ],
        }),
      });

      expect(client.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: "ETH",
          metadata: { key: "value" },
        })
      );
    });
  });

  describe("POST /api/flows/payment/budget-exhaustion", () => {
    it("runs budget exhaustion flow with defaults", async () => {
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

      const res = await app.request("/api/flows/payment/budget-exhaustion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("completed");
      expect(body.result.payments).toHaveLength(4);
      expect(body.result.budgetAnalysis).toBeDefined();
      expect(body.result.budgetAnalysis.budgetLimit).toBe("10.000000");
      expect(body.result.budgetAnalysis.exceeded).toBe(true);
      expect(client.createPayment).toHaveBeenCalledTimes(4);
    });

    it("marks steps that exceed budget in step name", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request("/api/flows/payment/budget-exhaustion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetLimit: "5.000000",
          paymentAmount: "3.000000",
          paymentCount: 3,
        }),
      });

      const body = await res.json();
      const paymentSteps = body.steps.filter((s: any) =>
        s.name.startsWith("payment-")
      );
      expect(paymentSteps[0].name).toBe("payment-1");
      expect(paymentSteps[1].name).toBe("payment-2-exceeds-budget");
      expect(paymentSteps[2].name).toBe("payment-3-exceeds-budget");
    });

    it("calculates budget analysis correctly", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request("/api/flows/payment/budget-exhaustion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetLimit: "10.000000",
          paymentAmount: "4.000000",
          paymentCount: 3,
        }),
      });

      const body = await res.json();
      expect(body.result.budgetAnalysis.totalSpent).toBe("12.000000");
      expect(body.result.budgetAnalysis.exceeded).toBe(true);
      expect(body.result.budgetAnalysis.overageAmount).toBe("2.000000");
    });

    it("reports not exceeded when within budget", async () => {
      vi.mocked(client.createWallet).mockResolvedValue(makeWallet());
      vi.mocked(client.createPolicy).mockResolvedValue(makePolicy());
      vi.mocked(client.createAgent).mockResolvedValue(
        makeAgentWithSessionKey()
      );
      vi.mocked(client.createPayment).mockResolvedValue(makePayment());
      vi.mocked(client.getPaymentStats).mockResolvedValue(makePaymentStats());

      const res = await app.request("/api/flows/payment/budget-exhaustion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetLimit: "100.000000",
          paymentAmount: "1.000000",
          paymentCount: 2,
        }),
      });

      const body = await res.json();
      expect(body.result.budgetAnalysis.exceeded).toBe(false);
      expect(body.result.budgetAnalysis.overageAmount).toBe("0.000000");
    });
  });
});
