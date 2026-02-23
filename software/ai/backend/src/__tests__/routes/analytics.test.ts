import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { analytics } from "../../routes/analytics.js";
import { errorHandler } from "../../middleware/error.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { paymentsStore } from "../../store/payments.store.js";
import { AgentStatus } from "../../types/agent.js";

function createApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/analytics", analytics);
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
    name: "Agent Alpha",
    publicKey: "0xpub",
    policyId: null,
    status: AgentStatus.ACTIVE,
    permissions: [],
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  });
  agentsStore.create({
    id: "a2",
    walletId: "w1",
    name: "Agent Beta",
    publicKey: "0xpub2",
    policyId: null,
    status: AgentStatus.ACTIVE,
    permissions: [],
    createdAt: now,
    updatedAt: now,
    revokedAt: null,
  });
  paymentsStore.append({
    id: "p1",
    agentId: "a1",
    walletId: "w1",
    domain: "example.com",
    amount: "50",
    currency: "USDC",
    status: "completed",
    metadata: {},
    createdAt: "2025-01-15T10:00:00Z",
  });
  paymentsStore.append({
    id: "p2",
    agentId: "a2",
    walletId: "w1",
    domain: "test.io",
    amount: "100",
    currency: "USDC",
    status: "completed",
    metadata: {},
    createdAt: "2025-01-16T14:00:00Z",
  });
}

describe("analytics routes", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    paymentsStore.clear();
  });

  describe("GET /analytics/spending", () => {
    it("returns spending data", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/spending");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.spending).toBeInstanceOf(Array);
      expect(body.spending.length).toBeGreaterThan(0);
    });

    it("returns spending with period parameter", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/spending?period=monthly");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.spending.length).toBeGreaterThan(0);
      expect(body.spending[0].period).toBe("2025-01");
    });

    it("returns spending filtered by walletId", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/spending?walletId=w1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.spending.length).toBeGreaterThan(0);
    });

    it("returns spending filtered by agentId", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/spending?agentId=a1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.spending).toHaveLength(1);
      expect(body.spending[0].totalSpent).toBe("50.000000");
    });

    it("returns empty array when no data", async () => {
      const app = createApp();
      const res = await app.request("/analytics/spending");
      const body = await res.json();
      expect(body.spending).toEqual([]);
    });
  });

  describe("GET /analytics/agents", () => {
    it("returns agent activity data", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agents).toBeInstanceOf(Array);
      expect(body.agents).toHaveLength(2);
    });

    it("respects limit parameter", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/agents?limit=1");
      const body = await res.json();
      expect(body.agents).toHaveLength(1);
    });

    it("respects sortBy parameter", async () => {
      const app = createApp();
      seedData();
      const res = await app.request("/analytics/agents?sortBy=spent");
      const body = await res.json();
      expect(body.agents[0].agentId).toBe("a2");
    });

    it("filters by walletId", async () => {
      const app = createApp();
      seedData();

      walletsStore.create({
        id: "w2",
        address: "0xdef",
        name: "W2",
        chainId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      agentsStore.create({
        id: "a3",
        walletId: "w2",
        name: "Agent Gamma",
        publicKey: "0xpub3",
        policyId: null,
        status: AgentStatus.ACTIVE,
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revokedAt: null,
      });

      const res = await app.request("/analytics/agents?walletId=w2");
      const body = await res.json();
      expect(body.agents).toHaveLength(1);
      expect(body.agents[0].agentId).toBe("a3");
    });

    it("returns empty array when no agents", async () => {
      const app = createApp();
      const res = await app.request("/analytics/agents");
      const body = await res.json();
      expect(body.agents).toEqual([]);
    });
  });
});
