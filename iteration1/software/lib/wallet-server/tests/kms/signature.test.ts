import { describe, it, expect } from "vitest"
import { recoverAddress, keccak256, toBytes, hashMessage } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { parseDerSignature, normalizeS, toEthSignature } from "../../src/kms/signature.js"
import { SECP256K1_N, SECP256K1_HALF_N } from "../../src/constants.js"

function bigIntToBytes(n: bigint, length: number): Uint8Array {
  const hex = n.toString(16).padStart(length * 2, "0")
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function encodeDerSignature(r: bigint, s: bigint): Uint8Array {
  const rBytes = bigIntToBytes(r, 32)
  const sBytes = bigIntToBytes(s, 32)

  const rNeedsPad = rBytes[0] >= 0x80
  const sNeedsPad = sBytes[0] >= 0x80

  const rEncLen = 32 + (rNeedsPad ? 1 : 0)
  const sEncLen = 32 + (sNeedsPad ? 1 : 0)

  const totalLen = 2 + rEncLen + 2 + sEncLen
  const der = new Uint8Array(2 + totalLen)

  let offset = 0
  der[offset++] = 0x30
  der[offset++] = totalLen

  der[offset++] = 0x02
  der[offset++] = rEncLen
  if (rNeedsPad) der[offset++] = 0x00
  der.set(rBytes, offset)
  offset += 32

  der[offset++] = 0x02
  der[offset++] = sEncLen
  if (sNeedsPad) der[offset++] = 0x00
  der.set(sBytes, offset)

  return der
}

describe("parseDerSignature", () => {
  it("parses a DER signature without padding", () => {
    const r = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn
    const s = 0x0edcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321n

    const der = encodeDerSignature(r, s)
    const result = parseDerSignature(der)

    expect(result.r).toBe(r)
    expect(result.s).toBe(s)
  })

  it("parses a DER signature with leading zero padding", () => {
    const r = 0xf234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn
    const s = 0xa1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8a1b2c3d4e5f6a7b8n

    const der = encodeDerSignature(r, s)
    const result = parseDerSignature(der)

    expect(result.r).toBe(r)
    expect(result.s).toBe(s)
  })

  it("throws on invalid sequence tag", () => {
    const bad = new Uint8Array([0x31, 0x00])
    expect(() => parseDerSignature(bad)).toThrow("Expected DER SEQUENCE tag")
  })
})

describe("normalizeS", () => {
  it("keeps s unchanged when below half-N", () => {
    const s = SECP256K1_HALF_N - 1n
    expect(normalizeS(s)).toBe(s)
  })

  it("flips s when above half-N", () => {
    const s = SECP256K1_HALF_N + 1n
    expect(normalizeS(s)).toBe(SECP256K1_N - s)
  })

  it("keeps s unchanged when equal to half-N", () => {
    expect(normalizeS(SECP256K1_HALF_N)).toBe(SECP256K1_HALF_N)
  })
})

describe("toEthSignature", () => {
  it("converts a real signature to recoverable Ethereum format", async () => {
    const privateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    const account = privateKeyToAccount(privateKey)
    const message = "test message"
    const hash = hashMessage(message)

    const viemSig = await account.signMessage({ message })
    const rHex = viemSig.slice(0, 66)
    const sHex = `0x${viemSig.slice(66, 130)}`
    const r = BigInt(rHex)
    const s = BigInt(sHex)

    const derBytes = encodeDerSignature(r, s)

    const ethSig = await toEthSignature({
      derSignature: derBytes,
      hash,
      address: account.address,
    })

    const recovered = await recoverAddress({ hash, signature: ethSig })
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase())
  })
})
