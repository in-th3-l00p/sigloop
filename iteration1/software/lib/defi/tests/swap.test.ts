import { describe, it, expect } from "vitest"
import { encodeSwap, buildApproveCalldata } from "../src/swap.js"

const ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
const TOKEN_A = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const TOKEN_B = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const RECIPIENT = "0x1234567890123456789012345678901234567890"

describe("encodeSwap", () => {
  it("encodes exactInputSingle calldata", () => {
    const result = encodeSwap({
      router: ROUTER,
      tokenIn: TOKEN_A,
      tokenOut: TOKEN_B,
      amountIn: 1000000n,
      minAmountOut: 500000000000000000n,
      recipient: RECIPIENT,
    })

    expect(result.to).toBe(ROUTER)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.slice(0, 10)).toBe("0x04e45aaf")
    expect(result.value).toBe(0n)
  })

  it("uses custom pool fee", () => {
    const result = encodeSwap({
      router: ROUTER,
      tokenIn: TOKEN_A,
      tokenOut: TOKEN_B,
      amountIn: 1000000n,
      minAmountOut: 0n,
      recipient: RECIPIENT,
      fee: 500,
    })

    expect(result.data).toMatch(/^0x/)
    expect(result.data.length).toBeGreaterThan(10)
  })
})

describe("buildApproveCalldata", () => {
  it("encodes ERC20 approve calldata", () => {
    const result = buildApproveCalldata(TOKEN_A, ROUTER, 1000000n)

    expect(result.to).toBe(TOKEN_A)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.slice(0, 10)).toBe("0x095ea7b3")
  })
})
