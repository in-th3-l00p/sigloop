import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { healthRoutes } from "../routes/health.js";
import type { BackendClient } from "../client/index.js";
import { makeHealthResponse } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    health: vi.fn(),
  } as unknown as BackendClient;
}

describe("healthRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/health", healthRoutes(client));
  });

  describe("GET /api/health", () => {
    it("returns ok status when backend is healthy", async () => {
      const backendHealth = makeHealthResponse();
      vi.mocked(client.health).mockResolvedValue(backendHealth);

      const res = await app.request("/api/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.version).toBe("0.1.0");
      expect(body.backend).toEqual(backendHealth);
      expect(body.timestamp).toBeDefined();
    });

    it("returns degraded 503 when backend is unreachable", async () => {
      vi.mocked(client.health).mockRejectedValue(
        new Error("Connection refused")
      );

      const res = await app.request("/api/health");
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.status).toBe("degraded");
      expect(body.version).toBe("0.1.0");
      expect(body.backend).toEqual({ status: "unreachable" });
      expect(body.timestamp).toBeDefined();
    });
  });
});
