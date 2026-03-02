import { describe, it, expect, vi } from "vitest"
import { createAgent, loadAgent, getAgentPolicy, encodeRevokeAgent } from "../src/agent.js"
import { generatePrivateKey } from "viem/accounts"

const VALIDATOR = "0x1111111111111111111111111111111111111111"
const WALLET = "0x2222222222222222222222222222222222222222"

describe("createAgent", () => {
  it("returns agent with valid address and session key", () => {
    const agent = createAgent({ validatorAddress: VALIDATOR })

    expect(agent.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(agent.sessionKey.privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(agent.sessionKey.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(agent.policy).toBeDefined()
    expect(agent.policy.active).toBe(true)
    expect(agent.signUserOp).toBeTypeOf("function")
  })

  it("uses custom session duration", () => {
    const now = Math.floor(Date.now() / 1000)
    const agent = createAgent({
      validatorAddress: VALIDATOR,
      sessionDuration: 3600,
    })

    expect(agent.sessionKey.expiresAt).toBeGreaterThanOrEqual(now + 3600 - 1)
    expect(agent.sessionKey.expiresAt).toBeLessThanOrEqual(now + 3600 + 1)
  })

  it("applies policy overrides", () => {
    const agent = createAgent({
      validatorAddress: VALIDATOR,
      policy: {
        allowedTargets: ["0x3333333333333333333333333333333333333333"],
        maxAmountPerTx: 500n,
      },
    })

    expect(agent.policy.allowedTargets).toEqual([
      "0x3333333333333333333333333333333333333333",
    ])
    expect(agent.policy.maxAmountPerTx).toBe(500n)
  })

  it("signUserOp produces valid signature", async () => {
    const agent = createAgent({ validatorAddress: VALIDATOR })
    const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    const sig = await agent.signUserOp(hash)
    expect(sig).toMatch(/^0x/)
    expect(sig.slice(2).length).toBe(170)
  })
})

describe("loadAgent", () => {
  it("reconstructs agent from private key", () => {
    const privateKey = generatePrivateKey()
    const agent = loadAgent({
      privateKey,
      validatorAddress: VALIDATOR,
      walletAddress: WALLET,
    })

    expect(agent.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    expect(agent.sessionKey.privateKey).toBe(privateKey)
    expect(agent.signUserOp).toBeTypeOf("function")
  })
})

describe("getAgentPolicy", () => {
  it("calls readContract with correct args", async () => {
    const mockPublicClient = {
      readContract: vi.fn().mockResolvedValue({
        allowedTargets: [],
        allowedSelectors: [],
        maxAmountPerTx: 100n,
        dailyLimit: 1000n,
        weeklyLimit: 5000n,
        validAfter: 0,
        validUntil: 0,
        active: true,
      }),
    }

    const policy = await getAgentPolicy(
      mockPublicClient,
      VALIDATOR,
      WALLET,
      "0x3333333333333333333333333333333333333333",
    )

    expect(mockPublicClient.readContract).toHaveBeenCalledOnce()
    expect(mockPublicClient.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: VALIDATOR,
        functionName: "getPolicy",
        args: [WALLET, "0x3333333333333333333333333333333333333333"],
      }),
    )
    expect(policy.maxAmountPerTx).toBe(100n)
    expect(policy.active).toBe(true)
  })
})

describe("encodeRevokeAgent", () => {
  it("returns to address and data", () => {
    const result = encodeRevokeAgent({
      validatorAddress: VALIDATOR,
      agentAddress: "0x3333333333333333333333333333333333333333",
    })

    expect(result.to).toBe(VALIDATOR)
    expect(result.data).toMatch(/^0x/)
  })
})
