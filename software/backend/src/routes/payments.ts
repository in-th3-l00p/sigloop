import { Hono } from "hono"
import type { PaymentService } from "../services/payment.js"

export type PaymentRoutesDeps = {
  paymentService: PaymentService
}

export function createPaymentRoutes(deps: PaymentRoutesDeps) {
  const { paymentService } = deps
  const app = new Hono()

  app.post("/", async (c) => {
    const body = await c.req.json()
    const payment = paymentService.record(body)
    return c.json({ payment }, 201)
  })

  app.get("/", (c) => {
    const filters = {
      agentId: c.req.query("agentId"),
      walletId: c.req.query("walletId"),
      domain: c.req.query("domain"),
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
    }
    const payments = paymentService.list(filters)
    return c.json({ payments, total: payments.length })
  })

  app.get("/stats", (c) => {
    const stats = paymentService.getStats()
    return c.json({ stats })
  })

  app.get("/budgets/:walletId", (c) => {
    const budget = paymentService.getBudget(c.req.param("walletId"))
    return c.json({ budget })
  })

  app.post("/budgets/:walletId/check", async (c) => {
    const body = await c.req.json()
    const result = paymentService.checkBudget(c.req.param("walletId"), body)
    return c.json(result)
  })

  return app
}
