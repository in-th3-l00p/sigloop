import { describe, it, expect, vi } from "vitest"
import { sepolia } from "viem/chains"

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    createKernelAccountClient: vi.fn((params: any) => ({
      type: "kernelAccountClient",
      account: params.account,
      chain: params.chain,
      paymaster: params.paymaster,
      paymasterContext: params.paymasterContext,
    })),
  }
})

import { createAccountClient } from "../src/client.js"
import { createKernelAccountClient } from "@zerodev/sdk"

describe("createAccountClient", () => {
  const mockAccount = { address: "0x1234" }
  const mockPublicClient = { type: "publicClient" }

  it("creates client without paymaster", () => {
    const result = createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      publicClient: mockPublicClient,
    })

    expect(createKernelAccountClient).toHaveBeenCalledWith({
      account: mockAccount,
      chain: sepolia,
      bundlerTransport: expect.anything(),
      client: mockPublicClient,
    })
    expect(result).toBeDefined()
  })

  it("creates client with paymaster type none", () => {
    createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      paymaster: { type: "none" },
    })

    expect(createKernelAccountClient).toHaveBeenCalledWith({
      account: mockAccount,
      chain: sepolia,
      bundlerTransport: expect.anything(),
      client: undefined,
    })
  })

  it("creates client with sponsor paymaster", () => {
    const mockPaymasterClient = {
      sponsorUserOperation: vi.fn().mockResolvedValue({ paymasterData: "0x" }),
    }

    const result = createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      paymaster: {
        type: "sponsor",
        paymasterClient: mockPaymasterClient,
      },
    })

    expect(createKernelAccountClient).toHaveBeenCalledWith(expect.objectContaining({
      account: mockAccount,
      chain: sepolia,
      paymaster: expect.objectContaining({
        getPaymasterData: expect.any(Function),
      }),
    }))
  })

  it("sponsor paymaster calls sponsorUserOperation", async () => {
    const mockPaymasterClient = {
      sponsorUserOperation: vi.fn().mockResolvedValue({ paymasterData: "0x" }),
    }

    createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      paymaster: {
        type: "sponsor",
        paymasterClient: mockPaymasterClient,
      },
    })

    const call = vi.mocked(createKernelAccountClient).mock.calls.at(-1)![0] as any
    const mockUserOp = { sender: "0x1234" }
    await call.paymaster.getPaymasterData(mockUserOp)

    expect(mockPaymasterClient.sponsorUserOperation).toHaveBeenCalledWith({
      userOperation: mockUserOp,
    })
  })

  it("creates client with erc20 paymaster", () => {
    const gasToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const
    const mockPaymasterClient = {
      sponsorUserOperation: vi.fn().mockResolvedValue({ paymasterData: "0x" }),
    }

    createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      paymaster: {
        type: "erc20",
        paymasterClient: mockPaymasterClient,
        gasToken,
      },
    })

    expect(createKernelAccountClient).toHaveBeenCalledWith(expect.objectContaining({
      paymaster: expect.objectContaining({
        getPaymasterData: expect.any(Function),
      }),
      paymasterContext: { token: gasToken },
    }))
  })

  it("erc20 paymaster passes gas token to sponsorUserOperation", async () => {
    const gasToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const
    const mockPaymasterClient = {
      sponsorUserOperation: vi.fn().mockResolvedValue({ paymasterData: "0x" }),
    }

    createAccountClient({
      account: mockAccount,
      chain: sepolia,
      rpcUrl: "https://rpc.zerodev.app/test",
      paymaster: {
        type: "erc20",
        paymasterClient: mockPaymasterClient,
        gasToken,
      },
    })

    const call = vi.mocked(createKernelAccountClient).mock.calls.at(-1)![0] as any
    const mockUserOp = { sender: "0x1234" }
    await call.paymaster.getPaymasterData(mockUserOp)

    expect(mockPaymasterClient.sponsorUserOperation).toHaveBeenCalledWith({
      userOperation: mockUserOp,
      gasToken,
    })
  })
})
