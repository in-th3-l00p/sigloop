import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { walletRoutes } from "../routes/wallets.js";
import type { BackendClient } from "../client/index.js";
import { makeWallet } from "./fixtures.js";

function mockClient(): BackendClient {
  return {
    listWallets: vi.fn(),
    getWallet: vi.fn(),
    createWallet: vi.fn(),
    deleteWallet: vi.fn(),
  } as unknown as BackendClient;
}

describe("walletRoutes", () => {
  let app: Hono;
  let client: ReturnType<typeof mockClient>;

  beforeEach(() => {
    client = mockClient();
    app = new Hono();
    app.route("/api/wallets", walletRoutes(client));
  });

  describe("GET /api/wallets", () => {
    it("returns wallets with total count", async () => {
      const wallets = [makeWallet(), makeWallet({ id: "wallet-2" })];
      vi.mocked(client.listWallets).mockResolvedValue(wallets);

      const res = await app.request("/api/wallets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ wallets, total: 2 });
    });

    it("returns empty array when no wallets", async () => {
      vi.mocked(client.listWallets).mockResolvedValue([]);

      const res = await app.request("/api/wallets");
      const body = await res.json();
      expect(body).toEqual({ wallets: [], total: 0 });
    });
  });

  describe("GET /api/wallets/:id", () => {
    it("returns a single wallet", async () => {
      const wallet = makeWallet();
      vi.mocked(client.getWallet).mockResolvedValue(wallet);

      const res = await app.request("/api/wallets/wallet-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ wallet });
      expect(client.getWallet).toHaveBeenCalledWith("wallet-1");
    });
  });

  describe("POST /api/wallets", () => {
    it("creates a wallet and returns 201", async () => {
      const wallet = makeWallet();
      vi.mocked(client.createWallet).mockResolvedValue(wallet);

      const res = await app.request("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Wallet", chainId: 31337 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ wallet });
      expect(client.createWallet).toHaveBeenCalledWith({
        name: "Test Wallet",
        chainId: 31337,
      });
    });
  });

  describe("DELETE /api/wallets/:id", () => {
    it("deletes a wallet and returns message", async () => {
      vi.mocked(client.deleteWallet).mockResolvedValue(undefined);

      const res = await app.request("/api/wallets/wallet-1", {
        method: "DELETE",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: "Wallet deleted" });
      expect(client.deleteWallet).toHaveBeenCalledWith("wallet-1");
    });
  });
});
