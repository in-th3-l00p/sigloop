import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function healthRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/", async (c) => {
    try {
      const backend = await client.health();
      return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
        backend: backend,
      });
    } catch {
      return c.json(
        {
          status: "degraded",
          timestamp: new Date().toISOString(),
          version: "0.1.0",
          backend: { status: "unreachable" },
        },
        503
      );
    }
  });

  return app;
}
