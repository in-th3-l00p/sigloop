import { describe, it, expect } from "vitest"
import { encodeDeFiAction, encodeExecutorSwap, encodeExecutorLending } from "../src/executor.js"
import type { DeFiAction } from "../src/types.js"

const TARGET = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"

describe("encodeDeFiAction", () => {
  it("encodes executeFromExecutor calldata", () => {
    const action: DeFiAction = {
      actionType: "swap",
      target: TARGET,
      data: "0xabcdef",
      value: 0n,
    }

    const encoded = encodeDeFiAction(action)
    expect(encoded).toMatch(/^0x/)
    expect(encoded.length).toBeGreaterThan(10)
  })
})

describe("encodeExecutorSwap", () => {
  it("encodes swap through executor", () => {
    const encoded = encodeExecutorSwap(TARGET, "0xabcdef")
    expect(encoded).toMatch(/^0x/)
  })
})

describe("encodeExecutorLending", () => {
  it("encodes lending through executor", () => {
    const pool = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
    const encoded = encodeExecutorLending(pool, "0xabcdef")
    expect(encoded).toMatch(/^0x/)
  })
})
