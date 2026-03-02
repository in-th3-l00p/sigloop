import { describe, it, expect } from "vitest"
import { createDeFiService } from "../../../src/services/defi.js"

describe("createDeFiService", () => {
  const service = createDeFiService()

  it("encodes a swap", () => {
    const result = service.encodeSwap({
      chainId: 8453,
      tokenIn: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      tokenOut: "0x4200000000000000000000000000000000000006",
      amountIn: "1000000",
      minAmountOut: "0",
      recipient: "0x1111111111111111111111111111111111111111",
    })
    expect(result.to).toMatch(/^0x/)
    expect(result.data).toMatch(/^0x/)
    expect(result.value).toBe("0")
  })

  it("throws when tokenIn is missing", () => {
    expect(() =>
      service.encodeSwap({
        chainId: 8453,
        tokenIn: "",
        tokenOut: "0x4200000000000000000000000000000000000006",
        amountIn: "1000000",
        minAmountOut: "0",
        recipient: "0x1111111111111111111111111111111111111111",
      }),
    ).toThrow("required")
  })

  it("encodes a supply", () => {
    const result = service.encodeSupply({
      chainId: 8453,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: "1000000",
      onBehalfOf: "0x1111111111111111111111111111111111111111",
    })
    expect(result.to).toMatch(/^0x/)
    expect(result.data).toMatch(/^0x/)
  })

  it("encodes a borrow", () => {
    const result = service.encodeBorrow({
      chainId: 8453,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: "1000000",
      onBehalfOf: "0x1111111111111111111111111111111111111111",
    })
    expect(result.to).toMatch(/^0x/)
    expect(result.data).toMatch(/^0x/)
  })

  it("encodes a repay", () => {
    const result = service.encodeRepay({
      chainId: 8453,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      amount: "1000000",
      onBehalfOf: "0x1111111111111111111111111111111111111111",
    })
    expect(result.to).toMatch(/^0x/)
    expect(result.data).toMatch(/^0x/)
  })

  it("encodes an approve", () => {
    const result = service.encodeApprove({
      token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      spender: "0x1111111111111111111111111111111111111111",
      amount: "1000000",
    })
    expect(result.to).toMatch(/^0x/)
    expect(result.data).toMatch(/^0x/)
  })

  it("throws when approve token is missing", () => {
    expect(() =>
      service.encodeApprove({
        token: "",
        spender: "0x1111111111111111111111111111111111111111",
        amount: "1000000",
      }),
    ).toThrow("required")
  })
})
