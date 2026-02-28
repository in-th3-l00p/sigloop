import { Hono } from "hono"
import type { WalletService } from "../services/wallet.js"

export type WalletRoutesDeps = {
  walletService: WalletService
}

export function createWalletRoutes(deps: WalletRoutesDeps) {
  const { walletService } = deps
  const app = new Hono()

  app.post("/", async (c) => {
    const body = await c.req.json()
    const wallet = walletService.create(body)
    return c.json({ wallet }, 201)
  })

  app.get("/", (c) => {
    const wallets = walletService.list()
    return c.json({ wallets, total: wallets.length })
  })

  app.get("/:id", (c) => {
    const wallet = walletService.get(c.req.param("id"))
    return c.json({ wallet })
  })

  app.delete("/:id", (c) => {
    walletService.delete(c.req.param("id"))
    return c.json({ message: "Wallet deleted" })
  })

  app.post("/:id/sign-message", async (c) => {
    const body = await c.req.json()
    const signature = await walletService.signMessage(c.req.param("id"), body)
    return c.json({ signature })
  })

  app.post("/:id/send-transaction", async (c) => {
    const body = await c.req.json()
    const txHash = await walletService.sendTransaction(c.req.param("id"), body)
    return c.json({ txHash })
  })

  return app
}
