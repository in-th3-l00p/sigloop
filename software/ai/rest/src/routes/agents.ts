import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function agentRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/", async (c) => {
    const walletId = c.req.query("walletId");
    const agents = await client.listAgents(walletId);
    return c.json({ agents, total: agents.length });
  });

  app.get("/:id", async (c) => {
    const agent = await client.getAgent(c.req.param("id"));
    return c.json({ agent });
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const agent = await client.createAgent(body);
    return c.json({ agent, sessionKey: agent.sessionKey }, 201);
  });

  app.post("/:id/revoke", async (c) => {
    const agent = await client.revokeAgent(c.req.param("id"));
    return c.json({ agent });
  });

  app.delete("/:id", async (c) => {
    await client.deleteAgent(c.req.param("id"));
    return c.json({ message: "Agent deleted" });
  });

  return app;
}
