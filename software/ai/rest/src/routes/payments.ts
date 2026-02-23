import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function paymentRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/", async (c) => {
    const filters = {
      agentId: c.req.query("agentId"),
      walletId: c.req.query("walletId"),
      domain: c.req.query("domain"),
      startDate: c.req.query("startDate"),
      endDate: c.req.query("endDate"),
    };
    const payments = await client.listPayments(filters);
    return c.json({ payments, total: payments.length });
  });

  app.get("/stats", async (c) => {
    const stats = await client.getPaymentStats();
    return c.json({ stats });
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const payment = await client.createPayment(body);
    return c.json({ payment }, 201);
  });

  return app;
}
