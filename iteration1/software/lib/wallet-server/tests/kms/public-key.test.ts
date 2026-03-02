import { describe, it, expect } from "vitest"
import { privateKeyToAccount } from "viem/accounts"
import { keccak256, getAddress, toBytes } from "viem"
import {
  extractUncompressedPublicKey,
  deriveEthAddressFromSpki,
} from "../../src/kms/public-key.js"
import {
  SPKI_SECP256K1_HEADER_LENGTH,
  UNCOMPRESSED_PUBLIC_KEY_LENGTH,
} from "../../src/constants.js"

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

function buildSpki(uncompressedPublicKey: Uint8Array): Uint8Array {
  const header = new Uint8Array([
    0x30, 0x56, 0x30, 0x10, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x05, 0x2b,
    0x81, 0x04, 0x00, 0x0a, 0x03, 0x42, 0x00,
  ])
  const spki = new Uint8Array(header.length + uncompressedPublicKey.length)
  spki.set(header)
  spki.set(uncompressedPublicKey, header.length)
  return spki
}

function getTestPublicKey(): Uint8Array {
  const account = privateKeyToAccount(TEST_PRIVATE_KEY)
  const pubKeyHex = account.publicKey
  return toBytes(pubKeyHex)
}

describe("extractUncompressedPublicKey", () => {
  it("extracts 65-byte uncompressed key from valid SPKI", () => {
    const pubKey = getTestPublicKey()
    const spki = buildSpki(pubKey)

    const extracted = extractUncompressedPublicKey(spki)

    expect(extracted.length).toBe(UNCOMPRESSED_PUBLIC_KEY_LENGTH)
    expect(extracted[0]).toBe(0x04)
    expect(Buffer.from(extracted)).toEqual(Buffer.from(pubKey))
  })

  it("throws on truncated SPKI", () => {
    const short = new Uint8Array(SPKI_SECP256K1_HEADER_LENGTH + 10)
    expect(() => extractUncompressedPublicKey(short)).toThrow("Invalid SPKI length")
  })

  it("throws on wrong prefix", () => {
    const pubKey = getTestPublicKey()
    const spki = buildSpki(pubKey)
    spki[SPKI_SECP256K1_HEADER_LENGTH] = 0x02

    expect(() => extractUncompressedPublicKey(spki)).toThrow("Invalid public key prefix")
  })
})

describe("deriveEthAddressFromSpki", () => {
  it("derives the correct Ethereum address from SPKI", () => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY)
    const pubKey = getTestPublicKey()
    const spki = buildSpki(pubKey)

    const result = deriveEthAddressFromSpki(spki)

    expect(result.address.toLowerCase()).toBe(account.address.toLowerCase())
    expect(result.publicKey).toBeDefined()
    expect(result.publicKey.startsWith("0x04")).toBe(true)
  })

  it("returns a checksummed address", () => {
    const pubKey = getTestPublicKey()
    const spki = buildSpki(pubKey)

    const result = deriveEthAddressFromSpki(spki)

    expect(result.address).toBe(getAddress(result.address))
  })
})
