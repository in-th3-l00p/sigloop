import { Hono } from "hono";
import { paymentService } from "../services/payment.service.js";
import type { RecordPaymentRequest } from "../types/payment.js";

const payments = new Hono();

payments.get("/", (c) => {
  const agentId = c.req.query("agentId");
  const walletId = c.req.query("walletId");
  const domain = c.req.query("domain");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const all = paymentService.list({ agentId, walletId, domain, startDate, endDate });
  return c.json({ payments: all, total: all.length });
});

payments.get("/stats", (c) => {
  const stats = paymentService.getStats();
  return c.json({ stats });
});

payments.post("/", async (c) => {
  const body = await c.req.json<RecordPaymentRequest>();
  const payment = paymentService.record(body);
  return c.json({ payment }, 201);
});

export { payments };
