import { describe, it, expect, vi } from "vitest"
import { parseEther } from "viem"
import { getEntryPoint } from "@zerodev/sdk/constants"

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    gasTokenAddresses: {
      11155111: {
        "USDC": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        "6TEST": "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B",
      },
      1: {
        "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
    },
    getERC20PaymasterApproveCall: vi.fn().mockResolvedValue({
      to: "0xPaymaster",
      data: "0xapproveCallData",
      value: 0n,
    }),
  }
})

import { getGasTokenAddress, getGasTokens, getERC20ApproveCall } from "../src/gas.js"
import { getERC20PaymasterApproveCall } from "@zerodev/sdk"

describe("getGasTokenAddress", () => {
  it("returns token address for valid chain and symbol", () => {
    const address = getGasTokenAddress(11155111, "USDC")

    expect(address).toBe("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238")
  })

  it("returns undefined for unknown symbol", () => {
    const address = getGasTokenAddress(11155111, "UNKNOWN")

    expect(address).toBeUndefined()
  })

  it("returns undefined for unknown chain", () => {
    const address = getGasTokenAddress(99999, "USDC")

    expect(address).toBeUndefined()
  })

  it("returns correct token for mainnet", () => {
    const address = getGasTokenAddress(1, "USDT")

    expect(address).toBe("0xdAC17F958D2ee523a2206206994597C13D831ec7")
  })
})

describe("getGasTokens", () => {
  it("returns all tokens for a chain", () => {
    const tokens = getGasTokens(11155111)

    expect(tokens).toEqual({
      "USDC": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      "6TEST": "0x3870419Ba2BBf0127060bCB37f69A1b1C090992B",
    })
  })

  it("returns undefined for unknown chain", () => {
    const tokens = getGasTokens(99999)

    expect(tokens).toBeUndefined()
  })

  it("returns mainnet tokens", () => {
    const tokens = getGasTokens(1)

    expect(tokens).toBeDefined()
    expect(tokens!["USDC"]).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
  })
})

describe("getERC20ApproveCall", () => {
  const mockPaymasterClient = { type: "paymaster" }
  const gasToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const

  it("calls getERC20PaymasterApproveCall with defaults", async () => {
    const result = await getERC20ApproveCall(mockPaymasterClient, {
      gasToken,
    })

    expect(getERC20PaymasterApproveCall).toHaveBeenCalledWith(mockPaymasterClient, {
      gasToken,
      approveAmount: parseEther("1"),
      entryPoint: getEntryPoint("0.7"),
    })
    expect(result).toBeDefined()
    expect(result.to).toBe("0xPaymaster")
  })

  it("uses custom amount", async () => {
    await getERC20ApproveCall(mockPaymasterClient, {
      gasToken,
      amount: 5000000n,
    })

    expect(getERC20PaymasterApproveCall).toHaveBeenCalledWith(mockPaymasterClient, {
      gasToken,
      approveAmount: 5000000n,
      entryPoint: getEntryPoint("0.7"),
    })
  })

  it("uses custom entry point version", async () => {
    await getERC20ApproveCall(mockPaymasterClient, {
      gasToken,
      entryPointVersion: "0.6",
    })

    expect(getERC20PaymasterApproveCall).toHaveBeenCalledWith(mockPaymasterClient, {
      gasToken,
      approveAmount: parseEther("1"),
      entryPoint: getEntryPoint("0.6"),
    })
  })
})
