import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { analyticsRoutes } from "../routes/analytics.js";
import type { BackendClient } from "../client/index.js";
import { makeSpendingData, makeAgentActivity } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    getSpending: vi.fn(),
    getAgentActivity: vi.fn(),
  } as unknown as BackendClient;
}

describe("analyticsRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/analytics", analyticsRoutes(client));
  });

  describe("GET /api/analytics/spending", () => {
    it("returns spending data", async () => {
      const spending = [makeSpendingData()];
      vi.mocked(client.getSpending).mockResolvedValue(spending);

      const res = await app.request("/api/analytics/spending");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ spending });
    });

    it("passes query params to client", async () => {
      vi.mocked(client.getSpending).mockResolvedValue([]);

      await app.request(
        "/api/analytics/spending?period=daily&walletId=wallet-1&agentId=agent-1&startDate=2025-01-01&endDate=2025-12-31"
      );
      expect(client.getSpending).toHaveBeenCalledWith({
        period: "daily",
        walletId: "wallet-1",
        agentId: "agent-1",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      });
    });

    it("passes undefined for missing params", async () => {
      vi.mocked(client.getSpending).mockResolvedValue([]);

      await app.request("/api/analytics/spending");
      expect(client.getSpending).toHaveBeenCalledWith({
        period: undefined,
        startDate: undefined,
        endDate: undefined,
        walletId: undefined,
        agentId: undefined,
      });
    });
  });

  describe("GET /api/analytics/agents", () => {
    it("returns agent activity data", async () => {
      const agents = [makeAgentActivity()];
      vi.mocked(client.getAgentActivity).mockResolvedValue(agents);

      const res = await app.request("/api/analytics/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ agents });
    });

    it("passes query params with limit as number", async () => {
      vi.mocked(client.getAgentActivity).mockResolvedValue([]);

      await app.request(
        "/api/analytics/agents?walletId=wallet-1&limit=10&sortBy=spent"
      );
      expect(client.getAgentActivity).toHaveBeenCalledWith({
        walletId: "wallet-1",
        limit: 10,
        sortBy: "spent",
      });
    });

    it("passes undefined limit when not provided", async () => {
      vi.mocked(client.getAgentActivity).mockResolvedValue([]);

      await app.request("/api/analytics/agents");
      expect(client.getAgentActivity).toHaveBeenCalledWith({
        walletId: undefined,
        limit: undefined,
        sortBy: undefined,
      });
    });
  });
});
