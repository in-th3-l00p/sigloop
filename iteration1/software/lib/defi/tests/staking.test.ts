import { describe, it, expect } from "vitest"
import { encodeStake, encodeUnstake } from "../src/staking.js"

const TARGET = "0x1234567890123456789012345678901234567890"
const TOKEN = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"

describe("encodeStake", () => {
  it("encodes token staking with zero value", () => {
    const result = encodeStake({
      target: TARGET,
      amount: 1000000n,
      token: TOKEN,
    })

    expect(result.to).toBe(TARGET)
    expect(result.data).toMatch(/^0x/)
    expect(result.value).toBe(0n)
  })

  it("encodes native staking with value", () => {
    const result = encodeStake({
      target: TARGET,
      amount: 1000000000000000000n,
    })

    expect(result.to).toBe(TARGET)
    expect(result.data).toMatch(/^0x/)
    expect(result.value).toBe(1000000000000000000n)
  })
})

describe("encodeUnstake", () => {
  it("encodes unstaking with zero value", () => {
    const result = encodeUnstake({
      target: TARGET,
      amount: 1000000n,
    })

    expect(result.to).toBe(TARGET)
    expect(result.data).toMatch(/^0x/)
    expect(result.value).toBe(0n)
  })
})
