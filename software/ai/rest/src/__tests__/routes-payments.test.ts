import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { paymentRoutes } from "../routes/payments.js";
import type { BackendClient } from "../client/index.js";
import { makePayment, makePaymentStats } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    listPayments: vi.fn(),
    createPayment: vi.fn(),
    getPaymentStats: vi.fn(),
  } as unknown as BackendClient;
}

describe("paymentRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/payments", paymentRoutes(client));
  });

  describe("GET /api/payments", () => {
    it("returns payments with total", async () => {
      const payments = [makePayment()];
      vi.mocked(client.listPayments).mockResolvedValue(payments);

      const res = await app.request("/api/payments");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ payments, total: 1 });
    });

    it("passes filter query params to client", async () => {
      vi.mocked(client.listPayments).mockResolvedValue([]);

      await app.request(
        "/api/payments?agentId=agent-1&walletId=wallet-1&domain=test.io&startDate=2025-01-01&endDate=2025-12-31"
      );
      expect(client.listPayments).toHaveBeenCalledWith({
        agentId: "agent-1",
        walletId: "wallet-1",
        domain: "test.io",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
    });

    it("passes undefined for missing query params", async () => {
      vi.mocked(client.listPayments).mockResolvedValue([]);

      await app.request("/api/payments");
      expect(client.listPayments).toHaveBeenCalledWith({
        agentId: undefined,
        walletId: undefined,
        domain: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe("GET /api/payments/stats", () => {
    it("returns payment stats", async () => {
      const stats = makePaymentStats();
      vi.mocked(client.getPaymentStats).mockResolvedValue(stats);

      const res = await app.request("/api/payments/stats");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ stats });
    });
  });

  describe("POST /api/payments", () => {
    it("creates a payment and returns 201", async () => {
      const payment = makePayment();
      vi.mocked(client.createPayment).mockResolvedValue(payment);

      const res = await app.request("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "agent-1",
          walletId: "wallet-1",
          domain: "api.example.com",
          amount: "1.500000",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ payment });
    });
  });
});
