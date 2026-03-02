import { Hono } from "hono"
import type { AgentService } from "../services/agent.js"
import type { Hex } from "viem"

export type AgentRoutesDeps = {
  agentService: AgentService
}

export function createAgentRoutes(deps: AgentRoutesDeps) {
  const { agentService } = deps
  const app = new Hono()

  app.post("/wallets/:walletId/agents", async (c) => {
    const body = await c.req.json()
    const result = agentService.create(c.req.param("walletId"), body)
    return c.json(result, 201)
  })

  app.get("/", (c) => {
    const walletId = c.req.query("walletId")
    const agents = agentService.list(walletId)
    return c.json({ agents, total: agents.length })
  })

  app.get("/:id", (c) => {
    const agent = agentService.get(c.req.param("id"))
    return c.json({ agent })
  })

  app.delete("/:id", (c) => {
    agentService.delete(c.req.param("id"))
    return c.json({ message: "Agent deleted" })
  })

  app.post("/:id/revoke", (c) => {
    const agent = agentService.revoke(c.req.param("id"))
    return c.json({ agent })
  })

  app.post("/:id/sign-user-op", async (c) => {
    const body = await c.req.json()
    const signature = await agentService.signUserOp(c.req.param("id"), body.userOpHash as Hex)
    return c.json({ signature })
  })

  app.get("/:id/policy", (c) => {
    const policy = agentService.getPolicy(c.req.param("id"))
    return c.json({ policy })
  })

  app.get("/:id/session", (c) => {
    const session = agentService.getSession(c.req.param("id"))
    return c.json({ session })
  })

  return app
}
