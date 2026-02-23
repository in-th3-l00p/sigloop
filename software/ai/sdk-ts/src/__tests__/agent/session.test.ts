import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateSessionKey,
  sessionKeyFromPrivateKey,
  serializeSessionKey,
  deserializeSessionKey,
  isSessionKeyExpired,
  isSessionKeyActive,
  getSessionKeyRemainingTime,
} from "../../agent/session.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateSessionKey", () => {
  it("generates a session key with default duration", () => {
    const key = generateSessionKey();
    expect(key.privateKey).toMatch(/^0x[a-f0-9]{64}$/);
    expect(key.publicKey).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(key.account).toBeDefined();
    expect(key.validUntil - key.validAfter).toBe(86400);
    expect(key.nonce).toBeGreaterThan(0n);
  });

  it("generates a session key with custom duration", () => {
    const key = generateSessionKey(3600);
    expect(key.validUntil - key.validAfter).toBe(3600);
  });

  it("uses the provided nonce", () => {
    const key = generateSessionKey(86400, 42n);
    expect(key.nonce).toBe(42n);
  });

  it("generates unique keys on successive calls", () => {
    const a = generateSessionKey();
    const b = generateSessionKey();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.publicKey).not.toBe(b.publicKey);
  });

  it("sets validAfter to current time", () => {
    const now = Math.floor(Date.now() / 1000);
    const key = generateSessionKey();
    expect(key.validAfter).toBeGreaterThanOrEqual(now - 1);
    expect(key.validAfter).toBeLessThanOrEqual(now + 1);
  });
});

describe("sessionKeyFromPrivateKey", () => {
  it("recreates a session key from private key", () => {
    const original = generateSessionKey();
    const restored = sessionKeyFromPrivateKey(
      original.privateKey,
      original.validAfter,
      original.validUntil,
      original.nonce
    );
    expect(restored.publicKey).toBe(original.publicKey);
    expect(restored.privateKey).toBe(original.privateKey);
    expect(restored.validAfter).toBe(original.validAfter);
    expect(restored.validUntil).toBe(original.validUntil);
    expect(restored.nonce).toBe(original.nonce);
  });

  it("derives the correct account from the private key", () => {
    const original = generateSessionKey();
    const restored = sessionKeyFromPrivateKey(
      original.privateKey,
      1000,
      2000,
      100n
    );
    expect(restored.publicKey).toBe(original.publicKey);
    expect(restored.account).toBeDefined();
  });
});

describe("serializeSessionKey", () => {
  it("serializes a session key to JSON-compatible object", () => {
    const key = generateSessionKey();
    const serialized = serializeSessionKey(key);
    expect(serialized.privateKey).toBe(key.privateKey);
    expect(serialized.publicKey).toBe(key.publicKey);
    expect(serialized.validAfter).toBe(key.validAfter);
    expect(serialized.validUntil).toBe(key.validUntil);
    expect(typeof serialized.nonce).toBe("string");
    expect(serialized.nonce).toBe(key.nonce.toString());
  });
});

describe("deserializeSessionKey", () => {
  it("round-trips through serialize/deserialize", () => {
    const original = generateSessionKey();
    const serialized = serializeSessionKey(original);
    const deserialized = deserializeSessionKey(serialized);
    expect(deserialized.privateKey).toBe(original.privateKey);
    expect(deserialized.publicKey).toBe(original.publicKey);
    expect(deserialized.validAfter).toBe(original.validAfter);
    expect(deserialized.validUntil).toBe(original.validUntil);
    expect(deserialized.nonce).toBe(original.nonce);
    expect(deserialized.account).toBeDefined();
  });
});

describe("isSessionKeyExpired", () => {
  it("returns false for a key that expires in the future", () => {
    const key = generateSessionKey(86400);
    expect(isSessionKeyExpired(key)).toBe(false);
  });

  it("returns true for an expired key", () => {
    const now = Math.floor(Date.now() / 1000);
    const key = generateSessionKey();
    key.validUntil = now - 100;
    expect(isSessionKeyExpired(key)).toBe(true);
  });
});

describe("isSessionKeyActive", () => {
  it("returns true for a currently active key", () => {
    const key = generateSessionKey(86400);
    expect(isSessionKeyActive(key)).toBe(true);
  });

  it("returns false for an expired key", () => {
    const now = Math.floor(Date.now() / 1000);
    const key = generateSessionKey();
    key.validUntil = now - 100;
    expect(isSessionKeyActive(key)).toBe(false);
  });

  it("returns false for a key not yet valid", () => {
    const now = Math.floor(Date.now() / 1000);
    const key = generateSessionKey();
    key.validAfter = now + 1000;
    key.validUntil = now + 2000;
    expect(isSessionKeyActive(key)).toBe(false);
  });
});

describe("getSessionKeyRemainingTime", () => {
  it("returns positive remaining time for active key", () => {
    const key = generateSessionKey(86400);
    const remaining = getSessionKeyRemainingTime(key);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(86400);
  });

  it("returns 0 for an expired key", () => {
    const now = Math.floor(Date.now() / 1000);
    const key = generateSessionKey();
    key.validUntil = now - 100;
    expect(getSessionKeyRemainingTime(key)).toBe(0);
  });
});
