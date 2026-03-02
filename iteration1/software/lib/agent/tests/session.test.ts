import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  generateSessionKey,
  sessionKeyFromPrivateKey,
  isSessionKeyActive,
  getSessionKeyRemainingTime,
  serializeSessionKey,
  deserializeSessionKey,
} from "../src/session.js"

describe("generateSessionKey", () => {
  it("generates a valid session key", () => {
    const key = generateSessionKey()

    expect(key.privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(key.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(key.account).toBeDefined()
    expect(key.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it("uses default 1 day duration", () => {
    const now = Math.floor(Date.now() / 1000)
    const key = generateSessionKey()

    expect(key.expiresAt).toBeGreaterThanOrEqual(now + 86400 - 1)
    expect(key.expiresAt).toBeLessThanOrEqual(now + 86400 + 1)
  })

  it("accepts custom duration", () => {
    const now = Math.floor(Date.now() / 1000)
    const key = generateSessionKey(3600)

    expect(key.expiresAt).toBeGreaterThanOrEqual(now + 3600 - 1)
    expect(key.expiresAt).toBeLessThanOrEqual(now + 3600 + 1)
  })

  it("generates unique keys", () => {
    const key1 = generateSessionKey()
    const key2 = generateSessionKey()

    expect(key1.privateKey).not.toBe(key2.privateKey)
    expect(key1.address).not.toBe(key2.address)
  })
})

describe("sessionKeyFromPrivateKey", () => {
  it("produces deterministic address", () => {
    const key = generateSessionKey()
    const loaded = sessionKeyFromPrivateKey(key.privateKey)

    expect(loaded.address).toBe(key.address)
  })
})

describe("isSessionKeyActive", () => {
  it("returns true for fresh key", () => {
    const key = generateSessionKey()
    expect(isSessionKeyActive(key)).toBe(true)
  })

  it("returns false for expired key", () => {
    const key = generateSessionKey()
    key.expiresAt = Math.floor(Date.now() / 1000) - 100
    expect(isSessionKeyActive(key)).toBe(false)
  })
})

describe("getSessionKeyRemainingTime", () => {
  it("returns positive for active key", () => {
    const key = generateSessionKey(3600)
    const remaining = getSessionKeyRemainingTime(key)
    expect(remaining).toBeGreaterThan(3500)
    expect(remaining).toBeLessThanOrEqual(3600)
  })

  it("returns 0 for expired key", () => {
    const key = generateSessionKey()
    key.expiresAt = Math.floor(Date.now() / 1000) - 100
    expect(getSessionKeyRemainingTime(key)).toBe(0)
  })
})

describe("serializeSessionKey / deserializeSessionKey", () => {
  it("roundtrips a session key", () => {
    const key = generateSessionKey()
    const serialized = serializeSessionKey(key)
    const deserialized = deserializeSessionKey(serialized)

    expect(deserialized.privateKey).toBe(key.privateKey)
    expect(deserialized.address).toBe(key.address)
    expect(deserialized.expiresAt).toBe(key.expiresAt)
    expect(deserialized.account).toBeDefined()
  })

  it("produces valid JSON", () => {
    const key = generateSessionKey()
    const serialized = serializeSessionKey(key)
    expect(() => JSON.parse(serialized)).not.toThrow()
  })
})
