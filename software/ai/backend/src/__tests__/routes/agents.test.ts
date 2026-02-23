import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { agents } from "../../routes/agents.js";
import { errorHandler } from "../../middleware/error.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { policiesStore } from "../../store/policies.store.js";
import type { Wallet } from "../../types/wallet.js";

function createApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/agents", agents);
  return app;
}

function seedWallet(id?: string): Wallet {
  const now = new Date().toISOString();
  const wallet: Wallet = {
    id: id ?? crypto.randomUUID(),
    address: "0xabc",
    name: "Test Wallet",
    chainId: 1,
    createdAt: now,
    updatedAt: now,
  };
  return walletsStore.create(wallet);
}

describe("agents routes", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    policiesStore.clear();
  });

  describe("POST /agents/wallets/:walletId/agents", () => {
    it("creates an agent and returns 201", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const res = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Agent 1" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.agent).toHaveProperty("id");
      expect(body.agent.name).toBe("Agent 1");
      expect(body.agent.walletId).toBe(wallet.id);
      expect(body.sessionKey).toBeTruthy();
    });

    it("returns 400 when name is empty", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const res = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 404 when wallet not found", async () => {
      const app = createApp();
      const res = await app.request("/agents/wallets/nonexistent/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Agent" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /agents", () => {
    it("returns all agents", async () => {
      const app = createApp();
      const wallet = seedWallet();
      await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A1" }),
      });
      await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A2" }),
      });

      const res = await app.request("/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agents).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it("filters by walletId query param", async () => {
      const app = createApp();
      const w1 = seedWallet();
      const w2 = seedWallet();
      await app.request(`/agents/wallets/${w1.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A1" }),
      });
      await app.request(`/agents/wallets/${w2.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A2" }),
      });

      const res = await app.request(`/agents?walletId=${w1.id}`);
      const body = await res.json();
      expect(body.agents).toHaveLength(1);
      expect(body.agents[0].walletId).toBe(w1.id);
    });

    it("returns empty list when no agents", async () => {
      const app = createApp();
      const res = await app.request("/agents");
      const body = await res.json();
      expect(body.agents).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /agents/:id", () => {
    it("returns agent by id", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const createRes = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Find Me" }),
      });
      const { agent } = await createRes.json();

      const res = await app.request(`/agents/${agent.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agent.id).toBe(agent.id);
    });

    it("returns 404 for nonexistent agent", async () => {
      const app = createApp();
      const res = await app.request("/agents/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /agents/:id", () => {
    it("deletes an agent", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const createRes = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Delete Me" }),
      });
      const { agent } = await createRes.json();

      const res = await app.request(`/agents/${agent.id}`, { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Agent deleted");
    });

    it("returns 404 for nonexistent agent", async () => {
      const app = createApp();
      const res = await app.request("/agents/nonexistent", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /agents/:id/revoke", () => {
    it("revokes an active agent", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const createRes = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Revoke Me" }),
      });
      const { agent } = await createRes.json();

      const res = await app.request(`/agents/${agent.id}/revoke`, { method: "POST" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agent.status).toBe("revoked");
      expect(body.agent.revokedAt).toBeTruthy();
    });

    it("returns 409 when agent already revoked", async () => {
      const app = createApp();
      const wallet = seedWallet();
      const createRes = await app.request(`/agents/wallets/${wallet.id}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Double Revoke" }),
      });
      const { agent } = await createRes.json();

      await app.request(`/agents/${agent.id}/revoke`, { method: "POST" });
      const res = await app.request(`/agents/${agent.id}/revoke`, { method: "POST" });
      expect(res.status).toBe(409);
    });

    it("returns 404 for nonexistent agent", async () => {
      const app = createApp();
      const res = await app.request("/agents/nonexistent/revoke", { method: "POST" });
      expect(res.status).toBe(404);
    });
  });
});
