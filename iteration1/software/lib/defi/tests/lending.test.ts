import { describe, it, expect } from "vitest"
import { encodeSupply, encodeBorrow, encodeRepay } from "../src/lending.js"

const POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
const ASSET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const ON_BEHALF_OF = "0x1234567890123456789012345678901234567890"

describe("encodeSupply", () => {
  it("encodes Aave V3 supply calldata", () => {
    const result = encodeSupply({
      pool: POOL,
      asset: ASSET,
      amount: 1000000n,
      onBehalfOf: ON_BEHALF_OF,
    })

    expect(result.to).toBe(POOL)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.slice(0, 10)).toBe("0x617ba037")
    expect(result.value).toBe(0n)
  })
})

describe("encodeBorrow", () => {
  it("encodes Aave V3 borrow calldata with default variable rate", () => {
    const result = encodeBorrow({
      pool: POOL,
      asset: ASSET,
      amount: 500000n,
      onBehalfOf: ON_BEHALF_OF,
    })

    expect(result.to).toBe(POOL)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.slice(0, 10)).toBe("0xa415bcad")
    expect(result.value).toBe(0n)
  })

  it("accepts custom interest rate mode", () => {
    const result = encodeBorrow({
      pool: POOL,
      asset: ASSET,
      amount: 500000n,
      onBehalfOf: ON_BEHALF_OF,
      interestRateMode: 1,
    })

    expect(result.data).toMatch(/^0x/)
  })
})

describe("encodeRepay", () => {
  it("encodes Aave V3 repay calldata", () => {
    const result = encodeRepay({
      pool: POOL,
      asset: ASSET,
      amount: 500000n,
      onBehalfOf: ON_BEHALF_OF,
    })

    expect(result.to).toBe(POOL)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.slice(0, 10)).toBe("0x573ade81")
    expect(result.value).toBe(0n)
  })
})
