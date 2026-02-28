import { Hono } from "hono"
import type { AnalyticsService } from "../services/analytics.js"

export type AnalyticsRoutesDeps = {
  analyticsService: AnalyticsService
}

export function createAnalyticsRoutes(deps: AnalyticsRoutesDeps) {
  const { analyticsService } = deps
  const app = new Hono()

  app.get("/spending", (c) => {
    const params = {
      period: c.req.query("period") as any,
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
      walletId: c.req.query("walletId"),
      agentId: c.req.query("agentId"),
    }
    const spending = analyticsService.getSpending(params)
    return c.json({ spending })
  })

  app.get("/agents", (c) => {
    const params = {
      walletId: c.req.query("walletId"),
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
      sortBy: c.req.query("sortBy") as any,
    }
    const agents = analyticsService.getAgentActivity(params)
    return c.json({ agents })
  })

  return app
}
