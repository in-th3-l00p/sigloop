import { describe, it, expect } from "vitest"
import { encodeInstallAgent, encodeAddAgent, encodeRemoveAgent } from "../src/module.js"
import type { AgentPolicy } from "@sigloop/policy"

const VALIDATOR = "0x1111111111111111111111111111111111111111"
const AGENT = "0x2222222222222222222222222222222222222222"

const SAMPLE_POLICY: AgentPolicy = {
  allowedTargets: ["0x3333333333333333333333333333333333333333"],
  allowedSelectors: ["0xa9059cbb"],
  maxAmountPerTx: 1000000n,
  dailyLimit: 5000000n,
  weeklyLimit: 20000000n,
  validAfter: 0,
  validUntil: 0,
  active: true,
}

describe("encodeInstallAgent", () => {
  it("produces valid hex", () => {
    const encoded = encodeInstallAgent(AGENT, SAMPLE_POLICY)
    expect(encoded).toMatch(/^0x/)
    expect(encoded.length).toBeGreaterThan(66)
  })
})

describe("encodeAddAgent", () => {
  it("encodes addAgent calldata", () => {
    const result = encodeAddAgent(VALIDATOR, AGENT, SAMPLE_POLICY)

    expect(result.to).toBe(VALIDATOR)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.length).toBeGreaterThan(10)
  })
})

describe("encodeRemoveAgent", () => {
  it("encodes removeAgent calldata", () => {
    const result = encodeRemoveAgent(VALIDATOR, AGENT)

    expect(result.to).toBe(VALIDATOR)
    expect(result.data).toMatch(/^0x/)
    expect(result.data.length).toBeGreaterThan(10)
  })
})
