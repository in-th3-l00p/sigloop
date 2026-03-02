import { describe, it, expect, vi } from "vitest"
import { sepolia, mainnet } from "viem/chains"

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    createZeroDevPaymasterClient: vi.fn((params: any) => ({
      type: "paymasterClient",
      chain: params.chain,
      transport: params.transport,
      sponsorUserOperation: vi.fn(),
    })),
  }
})

import { createPaymaster } from "../src/paymaster.js"
import { createZeroDevPaymasterClient } from "@zerodev/sdk"

describe("createPaymaster", () => {
  it("creates a paymaster client with chain and rpc url", () => {
    const result = createPaymaster({
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
    })

    expect(createZeroDevPaymasterClient).toHaveBeenCalledWith({
      chain: sepolia,
      transport: expect.anything(),
    })
    expect(result).toBeDefined()
    expect(result.type).toBe("paymasterClient")
  })

  it("creates paymaster for different chains", () => {
    createPaymaster({
      chain: mainnet,
      rpcUrl: "https://rpc.zerodev.app/mainnet",
    })

    expect(createZeroDevPaymasterClient).toHaveBeenCalledWith({
      chain: mainnet,
      transport: expect.anything(),
    })
  })

  it("returns a client with sponsorUserOperation method", () => {
    const result = createPaymaster({
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
    })

    expect(typeof result.sponsorUserOperation).toBe("function")
  })
})
