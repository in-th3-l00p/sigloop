import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function analyticsRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/spending", async (c) => {
    const params = {
      period: c.req.query("period"),
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
      walletId: c.req.query("walletId"),
      agentId: c.req.query("agentId"),
    };
    const spending = await client.getSpending(params);
    return c.json({ spending });
  });

  app.get("/agents", async (c) => {
    const params = {
      walletId: c.req.query("walletId"),
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : undefined,
      sortBy: c.req.query("sortBy"),
    };
    const agents = await client.getAgentActivity(params);
    return c.json({ agents });
  });

  return app;
}
