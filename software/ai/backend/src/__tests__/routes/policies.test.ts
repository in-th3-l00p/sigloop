import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { policies } from "../../routes/policies.js";
import { errorHandler } from "../../middleware/error.js";
import { policiesStore } from "../../store/policies.store.js";

function createApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/policies", policies);
  return app;
}

const validBody = {
  name: "Test Policy",
  rules: [{ type: "spending_limit", spendingLimit: { maxAmount: "100", period: "daily", currency: "USDC" } }],
};

describe("policies routes", () => {
  beforeEach(() => {
    policiesStore.clear();
  });

  describe("POST /policies", () => {
    it("creates a policy and returns 201", async () => {
      const app = createApp();
      const res = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.policy).toHaveProperty("id");
      expect(body.policy.name).toBe("Test Policy");
    });

    it("returns 400 when name is empty", async () => {
      const app = createApp();
      const res = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, name: "" }),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when rules are empty", async () => {
      const app = createApp();
      const res = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "No Rules", rules: [] }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /policies", () => {
    it("returns all policies", async () => {
      const app = createApp();
      await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });

      const res = await app.request("/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policies).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it("returns empty list when no policies", async () => {
      const app = createApp();
      const res = await app.request("/policies");
      const body = await res.json();
      expect(body.policies).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe("GET /policies/:id", () => {
    it("returns a policy by id", async () => {
      const app = createApp();
      const createRes = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const { policy } = await createRes.json();

      const res = await app.request(`/policies/${policy.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.id).toBe(policy.id);
    });

    it("returns 404 for nonexistent policy", async () => {
      const app = createApp();
      const res = await app.request("/policies/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /policies/:id", () => {
    it("updates a policy name", async () => {
      const app = createApp();
      const createRes = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const { policy } = await createRes.json();

      const res = await app.request(`/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.name).toBe("Updated Name");
    });

    it("updates policy rules", async () => {
      const app = createApp();
      const createRes = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const { policy } = await createRes.json();

      const newRules = [{ type: "allowlist", allowlist: { addresses: ["0xabc"], domains: [] } }];
      const res = await app.request(`/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: newRules }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy.rules[0].type).toBe("allowlist");
    });

    it("returns 404 for nonexistent policy", async () => {
      const app = createApp();
      const res = await app.request("/policies/nonexistent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nope" }),
      });
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid rules update", async () => {
      const app = createApp();
      const createRes = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const { policy } = await createRes.json();

      const res = await app.request(`/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: [] }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /policies/:id", () => {
    it("deletes a policy", async () => {
      const app = createApp();
      const createRes = await app.request("/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      });
      const { policy } = await createRes.json();

      const res = await app.request(`/policies/${policy.id}`, { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Policy deleted");
    });

    it("returns 404 for nonexistent policy", async () => {
      const app = createApp();
      const res = await app.request("/policies/nonexistent", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });
});
