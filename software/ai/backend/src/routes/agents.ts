import { Hono } from "hono";
import { agentService } from "../services/agent.service.js";
import type { CreateAgentRequest } from "../types/agent.js";

const agents = new Hono();

agents.post("/wallets/:walletId/agents", async (c) => {
  const walletId = c.req.param("walletId");
  const body = await c.req.json<CreateAgentRequest>();
  const result = agentService.create(walletId, body);
  return c.json({ agent: result.agent, sessionKey: result.sessionKey }, 201);
});

agents.get("/", (c) => {
  const walletId = c.req.query("walletId");
  const all = walletId ? agentService.listByWallet(walletId) : agentService.list();
  return c.json({ agents: all, total: all.length });
});

agents.get("/:id", (c) => {
  const id = c.req.param("id");
  const agent = agentService.get(id);
  return c.json({ agent });
});

agents.delete("/:id", (c) => {
  const id = c.req.param("id");
  agentService.delete(id);
  return c.json({ message: "Agent deleted" });
});

agents.post("/:id/revoke", (c) => {
  const id = c.req.param("id");
  const agent = agentService.revoke(id);
  return c.json({ agent });
});

export { agents };
