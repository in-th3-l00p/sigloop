import { Hono } from "hono";
import { walletService } from "../services/wallet.service.js";
import type { CreateWalletRequest } from "../types/wallet.js";

const wallets = new Hono();

wallets.post("/", async (c) => {
  const body = await c.req.json<CreateWalletRequest>();
  const wallet = walletService.create(body);
  return c.json({ wallet }, 201);
});

wallets.get("/", (c) => {
  const all = walletService.list();
  return c.json({ wallets: all, total: all.length });
});

wallets.get("/:id", (c) => {
  const id = c.req.param("id");
  const wallet = walletService.get(id);
  return c.json({ wallet });
});

wallets.delete("/:id", (c) => {
  const id = c.req.param("id");
  walletService.delete(id);
  return c.json({ message: "Wallet deleted" });
});

export { wallets };
