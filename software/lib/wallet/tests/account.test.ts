import { describe, it, expect, vi } from "vitest"
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants"

vi.mock("@zerodev/sdk", async (importOriginal) => {
  const original = await importOriginal<typeof import("@zerodev/sdk")>()
  return {
    ...original,
    createKernelAccount: vi.fn(async (_client: any, params: any) => ({
      address: "0xSmartAccountAddress",
      entryPoint: params.entryPoint,
      kernelVersion: params.kernelVersion,
      plugins: params.plugins,
      index: params.index,
    })),
  }
})

import { createSmartAccount } from "../src/account.js"
import { createKernelAccount } from "@zerodev/sdk"

describe("createSmartAccount", () => {
  const mockClient = { type: "publicClient" }
  const mockValidator = { type: "ecdsaValidator" }

  it("creates an account with defaults", async () => {
    const result = await createSmartAccount(mockClient, {
      validator: mockValidator,
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, {
      plugins: { sudo: mockValidator },
      entryPoint: getEntryPoint("0.7"),
      kernelVersion: KERNEL_V3_1,
      index: undefined,
      address: undefined,
    })
    expect(result.address).toBe("0xSmartAccountAddress")
  })

  it("passes custom index for counterfactual address", async () => {
    await createSmartAccount(mockClient, {
      validator: mockValidator,
      index: 5n,
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      index: 5n,
    }))
  })

  it("uses custom entry point version", async () => {
    await createSmartAccount(mockClient, {
      validator: mockValidator,
      entryPointVersion: "0.6",
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      entryPoint: getEntryPoint("0.6"),
    }))
  })

  it("uses custom kernel version", async () => {
    await createSmartAccount(mockClient, {
      validator: mockValidator,
      kernelVersion: "0.3.2",
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      kernelVersion: "0.3.2",
    }))
  })

  it("passes pre-computed address", async () => {
    const address = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01" as const
    await createSmartAccount(mockClient, {
      validator: mockValidator,
      address,
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      address,
    }))
  })

  it("always sets validator as sudo plugin", async () => {
    await createSmartAccount(mockClient, {
      validator: mockValidator,
    })

    expect(createKernelAccount).toHaveBeenCalledWith(mockClient, expect.objectContaining({
      plugins: { sudo: mockValidator },
    }))
  })
})
