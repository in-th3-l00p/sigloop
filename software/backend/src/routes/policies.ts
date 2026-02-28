import { Hono } from "hono"
import type { PolicyService } from "../services/policy.js"

export type PolicyRoutesDeps = {
  policyService: PolicyService
}

export function createPolicyRoutes(deps: PolicyRoutesDeps) {
  const { policyService } = deps
  const app = new Hono()

  app.post("/", async (c) => {
    const body = await c.req.json()
    const policy = policyService.create(body)
    return c.json({ policy }, 201)
  })

  app.get("/", (c) => {
    const policies = policyService.list()
    return c.json({ policies, total: policies.length })
  })

  app.get("/:id", (c) => {
    const policy = policyService.get(c.req.param("id"))
    return c.json({ policy })
  })

  app.put("/:id", async (c) => {
    const body = await c.req.json()
    const policy = policyService.update(c.req.param("id"), body)
    return c.json({ policy })
  })

  app.delete("/:id", (c) => {
    policyService.delete(c.req.param("id"))
    return c.json({ message: "Policy deleted" })
  })

  app.post("/:id/encode", (c) => {
    const encoded = policyService.encode(c.req.param("id"))
    return c.json({ encoded })
  })

  app.post("/compose", async (c) => {
    const body = await c.req.json()
    const policy = policyService.compose(body.policyIds)
    return c.json({ policy }, 201)
  })

  return app
}
