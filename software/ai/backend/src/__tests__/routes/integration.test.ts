import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { routes } from "../../routes/index.js";
import { errorHandler } from "../../middleware/error.js";
import { walletsStore } from "../../store/wallets.store.js";
import { agentsStore } from "../../store/agents.store.js";
import { policiesStore } from "../../store/policies.store.js";
import { paymentsStore } from "../../store/payments.store.js";

function createApp(): Hono {
  const app = new Hono();
  app.use("/*", cors());
  app.onError(errorHandler);
  app.route("/api", routes);
  return app;
}

const authHeaders = {
  "X-API-KEY": "sigloop-dev-key",
  "Content-Type": "application/json",
  "x-forwarded-for": `integration-${Date.now()}`,
};

describe("integration tests", () => {
  beforeEach(() => {
    walletsStore.clear();
    agentsStore.clear();
    policiesStore.clear();
    paymentsStore.clear();
  });

  it("health endpoint does not require auth", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("protected endpoint requires auth", async () => {
    const app = createApp();
    const ip = `integration-auth-${Date.now()}`;
    const res = await app.request("/api/wallets", {
      headers: { "x-forwarded-for": ip },
    });
    expect(res.status).toBe(401);
  });

  it("protected endpoint rejects invalid auth", async () => {
    const app = createApp();
    const ip = `integration-invalid-${Date.now()}`;
    const res = await app.request("/api/wallets", {
      headers: { "X-API-KEY": "wrong", "x-forwarded-for": ip },
    });
    expect(res.status).toBe(403);
  });

  it("full CRUD flow for wallets with auth", async () => {
    const app = createApp();
    const ip = `integration-crud-${Date.now()}`;
    const headers = { ...authHeaders, "x-forwarded-for": ip };

    const createRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Integration Wallet" }),
    });
    expect(createRes.status).toBe(201);
    const { wallet } = await createRes.json();

    const getRes = await app.request(`/api/wallets/${wallet.id}`, { headers });
    expect(getRes.status).toBe(200);

    const listRes = await app.request("/api/wallets", { headers });
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.total).toBe(1);

    const deleteRes = await app.request(`/api/wallets/${wallet.id}`, {
      method: "DELETE",
      headers,
    });
    expect(deleteRes.status).toBe(200);
  });

  it("full agent lifecycle: create, revoke, delete", async () => {
    const app = createApp();
    const ip = `integration-agent-${Date.now()}`;
    const headers = { ...authHeaders, "x-forwarded-for": ip };

    const walletRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Agent Wallet" }),
    });
    const { wallet } = await walletRes.json();

    const agentRes = await app.request(`/api/agents/wallets/${wallet.id}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Lifecycle Agent" }),
    });
    expect(agentRes.status).toBe(201);
    const { agent } = await agentRes.json();

    const revokeRes = await app.request(`/api/agents/${agent.id}/revoke`, {
      method: "POST",
      headers,
    });
    expect(revokeRes.status).toBe(200);
    const revokeBody = await revokeRes.json();
    expect(revokeBody.agent.status).toBe("revoked");

    const deleteRes = await app.request(`/api/agents/${agent.id}`, {
      method: "DELETE",
      headers,
    });
    expect(deleteRes.status).toBe(200);
  });

  it("payment and analytics flow", async () => {
    const app = createApp();
    const ip = `integration-payment-${Date.now()}`;
    const headers = { ...authHeaders, "x-forwarded-for": ip };

    const walletRes = await app.request("/api/wallets", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Pay Wallet" }),
    });
    const { wallet } = await walletRes.json();

    const agentRes = await app.request(`/api/agents/wallets/${wallet.id}/agents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Pay Agent" }),
    });
    const { agent } = await agentRes.json();

    const payRes = await app.request("/api/payments", {
      method: "POST",
      headers,
      body: JSON.stringify({
        agentId: agent.id,
        walletId: wallet.id,
        domain: "example.com",
        amount: "42.50",
      }),
    });
    expect(payRes.status).toBe(201);

    const statsRes = await app.request("/api/payments/stats", { headers });
    expect(statsRes.status).toBe(200);
    const statsBody = await statsRes.json();
    expect(statsBody.stats.totalTransactions).toBe(1);

    const spendingRes = await app.request("/api/analytics/spending", { headers });
    expect(spendingRes.status).toBe(200);
    const spendingBody = await spendingRes.json();
    expect(spendingBody.spending.length).toBeGreaterThan(0);

    const agentsRes = await app.request("/api/analytics/agents", { headers });
    expect(agentsRes.status).toBe(200);
    const agentsBody = await agentsRes.json();
    expect(agentsBody.agents.length).toBeGreaterThan(0);
  });
});
