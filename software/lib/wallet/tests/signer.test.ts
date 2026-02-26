import { describe, it, expect } from "vitest"
import { createSigner, randomSigner, generatePrivateKey } from "../src/signer.js"

describe("createSigner", () => {
  it("creates a local account from a private key", () => {
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    const signer = createSigner(privateKey)

    expect(signer.address).toBeDefined()
    expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(signer.type).toBe("local")
  })

  it("derives deterministic addresses from same key", () => {
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    const signer1 = createSigner(privateKey)
    const signer2 = createSigner(privateKey)

    expect(signer1.address).toBe(signer2.address)
  })

  it("derives different addresses from different keys", () => {
    const key1 = generatePrivateKey()
    const key2 = generatePrivateKey()
    const signer1 = createSigner(key1)
    const signer2 = createSigner(key2)

    expect(signer1.address).not.toBe(signer2.address)
  })

  it("exposes sign functions", () => {
    const privateKey = generatePrivateKey()
    const signer = createSigner(privateKey)

    expect(typeof signer.signMessage).toBe("function")
    expect(typeof signer.signTypedData).toBe("function")
    expect(typeof signer.signTransaction).toBe("function")
  })
})

describe("randomSigner", () => {
  it("generates a random private key and account", () => {
    const result = randomSigner()

    expect(result.privateKey).toBeDefined()
    expect(result.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(result.account.address).toBeDefined()
    expect(result.account.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it("generates unique signers each time", () => {
    const result1 = randomSigner()
    const result2 = randomSigner()

    expect(result1.privateKey).not.toBe(result2.privateKey)
    expect(result1.account.address).not.toBe(result2.account.address)
  })

  it("returned key matches returned account", () => {
    const result = randomSigner()
    const reconstructed = createSigner(result.privateKey)

    expect(reconstructed.address).toBe(result.account.address)
  })
})

describe("generatePrivateKey", () => {
  it("generates a valid hex private key", () => {
    const key = generatePrivateKey()

    expect(key).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  it("generates unique keys", () => {
    const keys = new Set(Array.from({ length: 10 }, () => generatePrivateKey()))

    expect(keys.size).toBe(10)
  })
})
