import { describe, it, expect, vi, beforeEach } from "vitest"
import { privateKeyToAccount } from "viem/accounts"
import { hashMessage, recoverAddress, toBytes } from "viem"
import { createKmsSigner } from "../../src/kms/signer.js"

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

const realAccount = privateKeyToAccount(TEST_PRIVATE_KEY)

const mockSend = vi.fn()
const mockKmsClient = { send: mockSend } as any

beforeEach(() => {
  mockSend.mockReset()
})

function setupMockKms() {
  const pubKeyBytes = toBytes(realAccount.publicKey)
  const spki = buildSpki(pubKeyBytes)

  mockSend.mockImplementation(async (command: any) => {
    if (command.constructor.name === "GetPublicKeyCommand") {
      return { PublicKey: spki }
    }

    if (command.constructor.name === "SignCommand") {
      const hash = `0x${Buffer.from(command.input.Message).toString("hex")}` as `0x${string}`
      const sig = await realAccount.sign({ hash })

      const rHex = sig.slice(2, 66)
      const sHex = sig.slice(66, 130)
      const r = BigInt(`0x${rHex}`)
      const s = BigInt(`0x${sHex}`)

      return { Signature: encodeDerSignature(r, s) }
    }

    throw new Error(`Unexpected command: ${command.constructor.name}`)
  })
}

describe("createKmsSigner", () => {
  it("creates a signer with the correct address", async () => {
    setupMockKms()

    const result = await createKmsSigner({
      kmsClient: mockKmsClient,
      keyId: "test-key",
    })

    expect(result.address.toLowerCase()).toBe(realAccount.address.toLowerCase())
    expect(result.publicKey).toBeDefined()
    expect(result.signer).toBeDefined()
    expect(result.signer.type).toBe("local")
  })

  it("signMessage produces recoverable signatures", async () => {
    setupMockKms()

    const { signer, address } = await createKmsSigner({
      kmsClient: mockKmsClient,
      keyId: "test-key",
    })

    const message = "hello KMS"
    const sig = await signer.signMessage({ message })
    const hash = hashMessage(message)

    const recovered = await recoverAddress({ hash, signature: sig })
    expect(recovered.toLowerCase()).toBe(address.toLowerCase())
  })
})
