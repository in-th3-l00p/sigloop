import { describe, it, expect, beforeEach } from "vitest";
import { walletService } from "../../services/wallet.service.js";
import { walletsStore } from "../../store/wallets.store.js";

describe("WalletService", () => {
  beforeEach(() => {
    walletsStore.clear();
  });

  describe("create", () => {
    it("creates a wallet with valid name", () => {
      const wallet = walletService.create({ name: "My Wallet" });
      expect(wallet).toHaveProperty("id");
      expect(wallet).toHaveProperty("address");
      expect(wallet.name).toBe("My Wallet");
      expect(wallet.chainId).toBe(1);
      expect(wallet.createdAt).toBeTruthy();
      expect(wallet.updatedAt).toBeTruthy();
    });

    it("creates a wallet with custom chainId", () => {
      const wallet = walletService.create({ name: "Polygon Wallet", chainId: 137 });
      expect(wallet.chainId).toBe(137);
    });

    it("trims wallet name", () => {
      const wallet = walletService.create({ name: "  Spaced Name  " });
      expect(wallet.name).toBe("Spaced Name");
    });

    it("generates a valid ethereum address", () => {
      const wallet = walletService.create({ name: "ETH Wallet" });
      expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("generates unique ids for each wallet", () => {
      const w1 = walletService.create({ name: "Wallet 1" });
      const w2 = walletService.create({ name: "Wallet 2" });
      expect(w1.id).not.toBe(w2.id);
    });

    it("throws when name is empty", () => {
      expect(() => walletService.create({ name: "" })).toThrow("Wallet name is required");
    });

    it("throws when name is whitespace only", () => {
      expect(() => walletService.create({ name: "   " })).toThrow("Wallet name is required");
    });

    it("stores wallet in the store", () => {
      const wallet = walletService.create({ name: "Stored Wallet" });
      expect(walletsStore.get(wallet.id)).toEqual(wallet);
    });
  });

  describe("get", () => {
    it("returns existing wallet", () => {
      const created = walletService.create({ name: "Found Wallet" });
      const found = walletService.get(created.id);
      expect(found).toEqual(created);
    });

    it("throws when wallet not found", () => {
      expect(() => walletService.get("nonexistent")).toThrow("Wallet not found: nonexistent");
    });
  });

  describe("list", () => {
    it("returns empty array when no wallets", () => {
      expect(walletService.list()).toEqual([]);
    });

    it("returns all wallets", () => {
      walletService.create({ name: "Wallet A" });
      walletService.create({ name: "Wallet B" });
      const result = walletService.list();
      expect(result).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("deletes an existing wallet", () => {
      const wallet = walletService.create({ name: "Delete Me" });
      walletService.delete(wallet.id);
      expect(walletsStore.get(wallet.id)).toBeUndefined();
    });

    it("throws when wallet not found", () => {
      expect(() => walletService.delete("nonexistent")).toThrow("Wallet not found: nonexistent");
    });
  });
});
