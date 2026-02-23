import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { payments } from "../../routes/payments.js";
import { errorHandler } from "../../middleware/error.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { paymentsStore } from "../../store/payments.store.js";
import { AgentStatus } from "../../types/agent.js";

function createApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/payments", payments);
  return app;
}

function seedData() {
  const now = new Date().toISOString();
  walletsStore.create({
    id: "w1",
    address: "0xabc",
    name: "W1",
    chainId: 1,
    createdAt: now,
    updatedAt: now,
  });
  agentsStore.create({
    id: "a1",
    walletId: "w1",
    name: "A1",
    publicKey: "0xpub",
    policyId: null,
    status: AgentStatus.ACTIVE,
    permissions: [],
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  });
}

describe("payments routes", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    paymentsStore.clear();
  });

  describe("POST /payments", () => {
    it("records a payment and returns 201", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "a1",
          walletId: "w1",
          domain: "example.com",
          amount: "25.50",
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.payment).toHaveProperty("id");
      expect(body.payment.amount).toBe("25.50");
      expect(body.payment.status).toBe("completed");
    });

    it("returns 400 for missing amount", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "a1",
          walletId: "w1",
          domain: "example.com",
          amount: "",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 for negative amount", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "a1",
          walletId: "w1",
          domain: "example.com",
          amount: "-10",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 for missing agent", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "nonexistent",
          walletId: "w1",
          domain: "example.com",
          amount: "10",
        }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /payments", () => {
    it("returns all payments", async () => {
      const app = createApp();
      seedData();
      await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "a1", walletId: "w1", domain: "a.com", amount: "10" }),
      });
      await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "a1", walletId: "w1", domain: "b.com", amount: "20" }),
      });

      const res = await app.request("/payments");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.payments).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it("filters by domain", async () => {
      const app = createApp();
      seedData();
      await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "a1", walletId: "w1", domain: "a.com", amount: "10" }),
      });
      await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "a1", walletId: "w1", domain: "b.com", amount: "20" }),
      });

      const res = await app.request("/payments?domain=a.com");
      const body = await res.json();
      expect(body.payments).toHaveLength(1);
      expect(body.payments[0].domain).toBe("a.com");
    });

    it("returns empty list when no payments", async () => {
      const app = createApp();
      const res = await app.request("/payments");
      const body = await res.json();
      expect(body.payments).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /payments/stats", () => {
    it("returns stats", async () => {
      const app = createApp();
      seedData();
      await app.request("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: "a1", walletId: "w1", domain: "a.com", amount: "10" }),
      });

      const res = await app.request("/payments/stats");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stats).toHaveProperty("totalSpent");
      expect(body.stats).toHaveProperty("totalTransactions");
      expect(body.stats).toHaveProperty("byAgent");
      expect(body.stats).toHaveProperty("byDomain");
      expect(body.stats).toHaveProperty("byPeriod");
    });

    it("returns zero stats when no payments", async () => {
      const app = createApp();
      const res = await app.request("/payments/stats");
      const body = await res.json();
      expect(body.stats.totalSpent).toBe("0.000000");
      expect(body.stats.totalTransactions).toBe(0);
    });
  });
});
