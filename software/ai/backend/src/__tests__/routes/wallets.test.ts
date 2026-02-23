import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { wallets } from "../../routes/wallets.js";
import { errorHandler } from "../../middleware/error.js";
import { walletsStore } from "../../store/wallets.store.js";

function createApp(): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/wallets", wallets);
  return app;
}

describe("wallets routes", () => {
  beforeEach(() => {
    walletsStore.clear();
  });

  describe("POST /wallets", () => {
    it("creates a wallet and returns 201", async () => {
      const app = createApp();
      const res = await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Wallet" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.wallet).toHaveProperty("id");
      expect(body.wallet.name).toBe("My Wallet");
      expect(body.wallet.chainId).toBe(1);
    });

    it("creates a wallet with custom chainId", async () => {
      const app = createApp();
      const res = await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Polygon", chainId: 137 }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.wallet.chainId).toBe(137);
    });

    it("returns 400 when name is missing", async () => {
      const app = createApp();
      const res = await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Bad Request");
    });
  });

  describe("GET /wallets", () => {
    it("returns empty list initially", async () => {
      const app = createApp();
      const res = await app.request("/wallets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wallets).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("returns all wallets", async () => {
      const app = createApp();
      await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "W1" }),
      });
      await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "W2" }),
      });

      const res = await app.request("/wallets");
      const body = await res.json();
      expect(body.wallets).toHaveLength(2);
      expect(body.total).toBe(2);
    });
  });

  describe("GET /wallets/:id", () => {
    it("returns a wallet by id", async () => {
      const app = createApp();
      const createRes = await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Findable" }),
      });
      const { wallet } = await createRes.json();

      const res = await app.request(`/wallets/${wallet.id}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wallet.id).toBe(wallet.id);
      expect(body.wallet.name).toBe("Findable");
    });

    it("returns 404 for nonexistent wallet", async () => {
      const app = createApp();
      const res = await app.request("/wallets/nonexistent");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not Found");
    });
  });

  describe("DELETE /wallets/:id", () => {
    it("deletes a wallet", async () => {
      const app = createApp();
      const createRes = await app.request("/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Delete Me" }),
      });
      const { wallet } = await createRes.json();

      const res = await app.request(`/wallets/${wallet.id}`, { method: "DELETE" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Wallet deleted");

      const getRes = await app.request(`/wallets/${wallet.id}`);
      expect(getRes.status).toBe(404);
    });

    it("returns 404 when deleting nonexistent wallet", async () => {
      const app = createApp();
      const res = await app.request("/wallets/nonexistent", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });
});
