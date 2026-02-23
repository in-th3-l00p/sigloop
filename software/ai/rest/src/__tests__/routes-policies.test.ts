import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { policyRoutes } from "../routes/policies.js";
import type { BackendClient } from "../client/index.js";
import { makePolicy } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    listPolicies: vi.fn(),
    getPolicy: vi.fn(),
    createPolicy: vi.fn(),
    updatePolicy: vi.fn(),
    deletePolicy: vi.fn(),
  } as unknown as BackendClient;
}

describe("policyRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/policies", policyRoutes(client));
  });

  describe("GET /api/policies", () => {
    it("returns policies with total", async () => {
      const policies = [makePolicy(), makePolicy({ id: "policy-2" })];
      vi.mocked(client.listPolicies).mockResolvedValue(policies);

      const res = await app.request("/api/policies");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ policies, total: 2 });
    });

    it("returns empty array when no policies", async () => {
      vi.mocked(client.listPolicies).mockResolvedValue([]);

      const res = await app.request("/api/policies");
      const body = await res.json();
      expect(body).toEqual({ policies: [], total: 0 });
    });
  });

  describe("GET /api/policies/:id", () => {
    it("returns a single policy", async () => {
      const policy = makePolicy();
      vi.mocked(client.getPolicy).mockResolvedValue(policy);

      const res = await app.request("/api/policies/policy-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ policy });
      expect(client.getPolicy).toHaveBeenCalledWith("policy-1");
    });
  });

  describe("POST /api/policies", () => {
    it("creates a policy and returns 201", async () => {
      const policy = makePolicy();
      vi.mocked(client.createPolicy).mockResolvedValue(policy);

      const res = await app.request("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Policy", rules: [] }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ policy });
    });
  });

  describe("PUT /api/policies/:id", () => {
    it("updates a policy and returns it", async () => {
      const policy = makePolicy({ name: "Updated Policy" });
      vi.mocked(client.updatePolicy).mockResolvedValue(policy);

      const res = await app.request("/api/policies/policy-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Policy" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ policy });
      expect(client.updatePolicy).toHaveBeenCalledWith("policy-1", {
        name: "Updated Policy",
      });
    });
  });

  describe("DELETE /api/policies/:id", () => {
    it("deletes a policy and returns message", async () => {
      vi.mocked(client.deletePolicy).mockResolvedValue(undefined);

      const res = await app.request("/api/policies/policy-1", {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: "Policy deleted" });
    });
  });
});
