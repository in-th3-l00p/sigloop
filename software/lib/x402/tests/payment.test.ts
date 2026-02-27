import { describe, it, expect, vi } from "vitest"
import { signEIP3009Authorization, buildPaymentHeader, parsePaymentHeader, generateNonce } from "../src/payment.js"
import type { EIP3009AuthorizationParams } from "../src/types.js"

const MOCK_PARAMS: EIP3009AuthorizationParams = {
  token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  from: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  value: 1000000n,
  validAfter: 0n,
  validBefore: 1700000000n,
  nonce: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
}

describe("signEIP3009Authorization", () => {
  it("calls signer.signTypedData with correct params", async () => {
    const mockSigner = {
      signTypedData: vi.fn().mockResolvedValue("0xmocksignature"),
    }

    const result = await signEIP3009Authorization(mockSigner, MOCK_PARAMS)

    expect(mockSigner.signTypedData).toHaveBeenCalledOnce()
    expect(mockSigner.signTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryType: "TransferWithAuthorization",
        message: expect.objectContaining({
          from: MOCK_PARAMS.from,
          to: MOCK_PARAMS.to,
          value: MOCK_PARAMS.value,
        }),
      }),
    )
    expect(result.authorization).toEqual(MOCK_PARAMS)
    expect(result.signature).toBe("0xmocksignature")
  })
})

describe("buildPaymentHeader / parsePaymentHeader", () => {
  it("builds a base64 encoded header", () => {
    const header = buildPaymentHeader(MOCK_PARAMS, "0xsig123")

    expect(typeof header).toBe("string")
    expect(() => atob(header)).not.toThrow()
  })

  it("roundtrips through build and parse", () => {
    const header = buildPaymentHeader(MOCK_PARAMS, "0xsig123")
    const parsed = parsePaymentHeader(header)

    expect(parsed.authorization.from).toBe(MOCK_PARAMS.from)
    expect(parsed.authorization.to).toBe(MOCK_PARAMS.to)
    expect(parsed.authorization.value).toBe(MOCK_PARAMS.value)
    expect(parsed.authorization.validAfter).toBe(MOCK_PARAMS.validAfter)
    expect(parsed.authorization.validBefore).toBe(MOCK_PARAMS.validBefore)
    expect(parsed.authorization.nonce).toBe(MOCK_PARAMS.nonce)
    expect(parsed.signature).toBe("0xsig123")
  })
})

describe("generateNonce", () => {
  it("generates a 32-byte hex nonce", () => {
    const nonce = generateNonce()
    expect(nonce).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  it("generates unique nonces", () => {
    const a = generateNonce()
    const b = generateNonce()
    expect(a).not.toBe(b)
  })
})
