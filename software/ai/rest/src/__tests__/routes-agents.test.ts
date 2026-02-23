import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { agentRoutes } from "../routes/agents.js";
import type { BackendClient } from "../client/index.js";
import { makeAgent, makeAgentWithSessionKey } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    listAgents: vi.fn(),
    getAgent: vi.fn(),
    createAgent: vi.fn(),
    revokeAgent: vi.fn(),
    deleteAgent: vi.fn(),
  } as unknown as BackendClient;
}

describe("agentRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/agents", agentRoutes(client));
  });

  describe("GET /api/agents", () => {
    it("returns all agents with total", async () => {
      const agents = [makeAgent()];
      vi.mocked(client.listAgents).mockResolvedValue(agents);

      const res = await app.request("/api/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ agents, total: 1 });
      expect(client.listAgents).toHaveBeenCalledWith(undefined);
    });

    it("passes walletId query param to client", async () => {
      vi.mocked(client.listAgents).mockResolvedValue([]);

      await app.request("/api/agents?walletId=wallet-1");
      expect(client.listAgents).toHaveBeenCalledWith("wallet-1");
    });
  });

  describe("GET /api/agents/:id", () => {
    it("returns a single agent", async () => {
      const agent = makeAgent();
      vi.mocked(client.getAgent).mockResolvedValue(agent);

      const res = await app.request("/api/agents/agent-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ agent });
    });
  });

  describe("POST /api/agents", () => {
    it("creates agent and returns 201 with sessionKey", async () => {
      const agent = makeAgentWithSessionKey();
      vi.mocked(client.createAgent).mockResolvedValue(agent);

      const res = await app.request("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: "wallet-1",
          name: "Test Agent",
          permissions: ["transfer"],
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.agent).toBeDefined();
      expect(body.sessionKey).toBe("sk-test-123");
    });
  });

  describe("POST /api/agents/:id/revoke", () => {
    it("revokes agent and returns it", async () => {
      const agent = makeAgent({ status: "revoked" as any });
      vi.mocked(client.revokeAgent).mockResolvedValue(agent);

      const res = await app.request("/api/agents/agent-1/revoke", {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ agent });
      expect(client.revokeAgent).toHaveBeenCalledWith("agent-1");
    });
  });

  describe("DELETE /api/agents/:id", () => {
    it("deletes agent and returns message", async () => {
      vi.mocked(client.deleteAgent).mockResolvedValue(undefined);

      const res = await app.request("/api/agents/agent-1", {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: "Agent deleted" });
    });
  });
});
