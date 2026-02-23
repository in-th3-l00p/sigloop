import { describe, it, expect, beforeEach } from "vitest";
import { keyManagerService } from "../../services/keymanager.service.js";

describe("KeyManagerService", () => {
  beforeEach(() => {
    const testId = "test-key-cleanup";
    keyManagerService.storeKey(testId, "pk", "sk");
    keyManagerService.deleteKey(testId);
  });

  describe("generateKeyPair", () => {
    it("returns a publicKey and privateKey", () => {
      const pair = keyManagerService.generateKeyPair();
      expect(pair).toHaveProperty("publicKey");
      expect(pair).toHaveProperty("privateKey");
      expect(pair.publicKey).toBeTruthy();
      expect(pair.privateKey).toBeTruthy();
    });

    it("returns a publicKey that looks like an ethereum address", () => {
      const pair = keyManagerService.generateKeyPair();
      expect(pair.publicKey).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("returns a privateKey that looks like a hex private key", () => {
      const pair = keyManagerService.generateKeyPair();
      expect(pair.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it("generates unique key pairs on each call", () => {
      const pair1 = keyManagerService.generateKeyPair();
      const pair2 = keyManagerService.generateKeyPair();
      expect(pair1.publicKey).not.toBe(pair2.publicKey);
      expect(pair1.privateKey).not.toBe(pair2.privateKey);
    });
  });

  describe("storeKey and retrievePublicKey", () => {
    it("stores and retrieves a public key", () => {
      const pair = keyManagerService.generateKeyPair();
      keyManagerService.storeKey("agent-1", pair.publicKey, pair.privateKey);
      expect(keyManagerService.retrievePublicKey("agent-1")).toBe(pair.publicKey);
      keyManagerService.deleteKey("agent-1");
    });

    it("returns undefined for non-existent key", () => {
      expect(keyManagerService.retrievePublicKey("nonexistent")).toBeUndefined();
    });
  });

  describe("retrievePrivateKey", () => {
    it("retrieves the original private key after store", () => {
      const pair = keyManagerService.generateKeyPair();
      keyManagerService.storeKey("agent-2", pair.publicKey, pair.privateKey);
      expect(keyManagerService.retrievePrivateKey("agent-2")).toBe(pair.privateKey);
      keyManagerService.deleteKey("agent-2");
    });

    it("returns undefined for non-existent key", () => {
      expect(keyManagerService.retrievePrivateKey("nonexistent")).toBeUndefined();
    });
  });

  describe("deleteKey", () => {
    it("deletes an existing key and returns true", () => {
      keyManagerService.storeKey("agent-3", "pk", "sk");
      expect(keyManagerService.deleteKey("agent-3")).toBe(true);
      expect(keyManagerService.hasKey("agent-3")).toBe(false);
    });

    it("returns false when deleting a non-existent key", () => {
      expect(keyManagerService.deleteKey("nonexistent")).toBe(false);
    });
  });

  describe("hasKey", () => {
    it("returns true when key exists", () => {
      keyManagerService.storeKey("agent-4", "pk", "sk");
      expect(keyManagerService.hasKey("agent-4")).toBe(true);
      keyManagerService.deleteKey("agent-4");
    });

    it("returns false when key does not exist", () => {
      expect(keyManagerService.hasKey("nonexistent")).toBe(false);
    });
  });
});
