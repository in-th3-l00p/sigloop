import { Hono } from "hono"
import type { DeFiService } from "../services/defi.js"

export type DeFiRoutesDeps = {
  defiService: DeFiService
}

export function createDeFiRoutes(deps: DeFiRoutesDeps) {
  const { defiService } = deps
  const app = new Hono()

  app.post("/swap/encode", async (c) => {
    const body = await c.req.json()
    const result = defiService.encodeSwap(body)
    return c.json({ result })
  })

  app.post("/supply/encode", async (c) => {
    const body = await c.req.json()
    const result = defiService.encodeSupply(body)
    return c.json({ result })
  })

  app.post("/borrow/encode", async (c) => {
    const body = await c.req.json()
    const result = defiService.encodeBorrow(body)
    return c.json({ result })
  })

  app.post("/repay/encode", async (c) => {
    const body = await c.req.json()
    const result = defiService.encodeRepay(body)
    return c.json({ result })
  })

  app.post("/approve/encode", async (c) => {
    const body = await c.req.json()
    const result = defiService.encodeApprove(body)
    return c.json({ result })
  })

  return app
}
