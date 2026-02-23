import { Hono } from "hono";
import { analyticsService } from "../services/analytics.service.js";

const analytics = new Hono();

analytics.get("/spending", (c) => {
  const period = c.req.query("period") as "hourly" | "daily" | "weekly" | "monthly" | undefined;
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const walletId = c.req.query("walletId");
  const agentId = c.req.query("agentId");

  const data = analyticsService.getSpending({ period, startDate, endDate, walletId, agentId });
  return c.json({ spending: data });
});

analytics.get("/agents", (c) => {
  const walletId = c.req.query("walletId");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined;
  const sortBy = c.req.query("sortBy") as "spent" | "transactions" | "recent" | undefined;

  const data = analyticsService.getAgentActivity({ walletId, limit, sortBy });
  return c.json({ agents: data });
});

export { analytics };
