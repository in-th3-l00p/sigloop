import { describe, it, expect } from "vitest"
import { createDeFiActions } from "../src/defi.js"

const RECIPIENT = "0x1234567890123456789012345678901234567890"
const ASSET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const TOKEN_B = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const STAKING_TARGET = "0x2222222222222222222222222222222222222222"

describe("createDeFiActions", () => {
  it("returns object with all methods", () => {
    const actions = createDeFiActions({ chainId: 1 })

    expect(actions.encodeSwap).toBeTypeOf("function")
    expect(actions.encodeSupply).toBeTypeOf("function")
    expect(actions.encodeBorrow).toBeTypeOf("function")
    expect(actions.encodeRepay).toBeTypeOf("function")
    expect(actions.encodeStake).toBeTypeOf("function")
    expect(actions.encodeUnstake).toBeTypeOf("function")
    expect(actions.buildApprove).toBeTypeOf("function")
  })

  it("encodeSwap uses chain router by default", () => {
    const actions = createDeFiActions({ chainId: 1 })
    const result = actions.encodeSwap({
      tokenIn: ASSET,
      tokenOut: TOKEN_B,
      amountIn: 1000000n,
      minAmountOut: 0n,
      recipient: RECIPIENT,
    })

    expect(result.to).toBe("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45")
    expect(result.data).toMatch(/^0x/)
  })

  it("encodeSupply uses chain pool by default", () => {
    const actions = createDeFiActions({ chainId: 1 })
    const result = actions.encodeSupply({
      asset: ASSET,
      amount: 1000000n,
      onBehalfOf: RECIPIENT,
    })

    expect(result.to).toBe("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2")
  })

  it("buildApprove returns correct calldata", () => {
    const actions = createDeFiActions({ chainId: 1 })
    const result = actions.buildApprove(ASSET, RECIPIENT, 1000000n)

    expect(result.to).toBe(ASSET)
    expect(result.data.slice(0, 10)).toBe("0x095ea7b3")
  })
})
