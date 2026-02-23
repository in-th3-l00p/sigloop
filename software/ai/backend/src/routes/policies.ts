import { Hono } from "hono";
import { policyService } from "../services/policy.service.js";
import type { CreatePolicyRequest } from "../types/policy.js";

const policies = new Hono();

policies.post("/", async (c) => {
  const body = await c.req.json<CreatePolicyRequest>();
  const policy = policyService.create(body);
  return c.json({ policy }, 201);
});

policies.get("/", (c) => {
  const all = policyService.list();
  return c.json({ policies: all, total: all.length });
});

policies.get("/:id", (c) => {
  const id = c.req.param("id");
  const policy = policyService.get(id);
  return c.json({ policy });
});

policies.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<Partial<CreatePolicyRequest>>();
  const policy = policyService.update(id, body);
  return c.json({ policy });
});

policies.delete("/:id", (c) => {
  const id = c.req.param("id");
  policyService.delete(id);
  return c.json({ message: "Policy deleted" });
});

export { policies };
