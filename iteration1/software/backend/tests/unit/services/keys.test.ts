import { describe, it, expect } from "vitest"
import { createKeysService } from "../../../src/services/keys.js"

describe("createKeysService", () => {
  it("generates a key pair", () => {
    const service = createKeysService()
    const { publicKey, privateKey } = service.generateKeyPair()
    expect(publicKey).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  it("stores and retrieves keys", () => {
    const service = createKeysService()
    const pk = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as const
    service.storeKey("id-1", "0x1111", pk)
    expect(service.retrievePublicKey("id-1")).toBe("0x1111")
    expect(service.retrievePrivateKey("id-1")).toBe(pk)
  })

  it("returns undefined for missing keys", () => {
    const service = createKeysService()
    expect(service.retrievePublicKey("nope")).toBeUndefined()
    expect(service.retrievePrivateKey("nope")).toBeUndefined()
  })

  it("deletes keys", () => {
    const service = createKeysService()
    service.storeKey("id-1", "0x1111", "0xabcd" as any)
    expect(service.deleteKey("id-1")).toBe(true)
    expect(service.hasKey("id-1")).toBe(false)
  })

  it("checks key existence", () => {
    const service = createKeysService()
    expect(service.hasKey("id-1")).toBe(false)
    service.storeKey("id-1", "0x1111", "0xabcd" as any)
    expect(service.hasKey("id-1")).toBe(true)
  })
})
