import { describe, it, expect } from "vitest"
import { hashMessage, recoverAddress } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { signUserOpAsAgent } from "../src/signing.js"

describe("signUserOpAsAgent", () => {
  it("produces 85-byte signature (170 hex chars after 0x)", () => {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const userOpHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    return signUserOpAsAgent(account.address, privateKey, userOpHash).then(
      (sig) => {
        const hexBody = sig.slice(2)
        expect(hexBody.length).toBe(170)
      },
    )
  })

  it("first 20 bytes match agent address", async () => {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const userOpHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    const sig = await signUserOpAsAgent(account.address, privateKey, userOpHash)
    const addressFromSig = `0x${sig.slice(2, 42)}`

    expect(addressFromSig.toLowerCase()).toBe(account.address.toLowerCase())
  })

  it("ECDSA portion recovers to agent address", async () => {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const userOpHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`

    const sig = await signUserOpAsAgent(account.address, privateKey, userOpHash)
    const ecdsaSig = `0x${sig.slice(42)}` as `0x${string}`

    const ethHash = hashMessage({ raw: userOpHash })
    const recovered = await recoverAddress({
      hash: ethHash,
      signature: ecdsaSig,
    })

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase())
  })
})
