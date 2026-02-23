import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function policyRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/", async (c) => {
    const policies = await client.listPolicies();
    return c.json({ policies, total: policies.length });
  });

  app.get("/:id", async (c) => {
    const policy = await client.getPolicy(c.req.param("id"));
    return c.json({ policy });
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const policy = await client.createPolicy(body);
    return c.json({ policy }, 201);
  });

  app.put("/:id", async (c) => {
    const body = await c.req.json();
    const policy = await client.updatePolicy(c.req.param("id"), body);
    return c.json({ policy });
  });

  app.delete("/:id", async (c) => {
    await client.deletePolicy(c.req.param("id"));
    return c.json({ message: "Policy deleted" });
  });

  return app;
}
