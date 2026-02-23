import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";

export function walletRoutes(client: BackendClient) {
  const app = new Hono();

  app.get("/", async (c) => {
    const wallets = await client.listWallets();
    return c.json({ wallets, total: wallets.length });
  });

  app.get("/:id", async (c) => {
    const wallet = await client.getWallet(c.req.param("id"));
    return c.json({ wallet });
  });

  app.post("/", async (c) => {
    const body = await c.req.json();
    const wallet = await client.createWallet(body);
    return c.json({ wallet }, 201);
  });

  app.delete("/:id", async (c) => {
    await client.deleteWallet(c.req.param("id"));
    return c.json({ message: "Wallet deleted" });
  });

  return app;
}
