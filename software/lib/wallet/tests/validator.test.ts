import { describe, it, expect, vi } from "vitest"
import { getEntryPoint, KERNEL_V3_1, KERNEL_V3_0 } from "@zerodev/sdk/constants"
import { createSigner, generatePrivateKey } from "../src/signer.js"

vi.mock("@zerodev/ecdsa-validator", () => ({
  signerToEcdsaValidator: vi.fn(async (_client: any, params: any) => ({
    type: "kernel-validator",
    signer: params.signer,
    entryPoint: params.entryPoint,
    kernelVersion: params.kernelVersion,
    validatorAddress: params.validatorAddress,
  })),
  getKernelAddressFromECDSA: vi.fn(),
}))

import { createEcdsaValidator } from "../src/validator.js"
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"

describe("createEcdsaValidator", () => {
  const mockClient = { type: "publicClient" }
  const signer = createSigner(generatePrivateKey())

  it("creates a validator with default entry point and kernel version", async () => {
    const result = await createEcdsaValidator(mockClient, { signer })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(mockClient, {
      signer,
      entryPoint: getEntryPoint("0.7"),
      kernelVersion: KERNEL_V3_1,
      validatorAddress: undefined,
    })
    expect(result).toBeDefined()
    expect(result.entryPoint).toEqual(getEntryPoint("0.7"))
  })

  it("uses custom entry point version", async () => {
    await createEcdsaValidator(mockClient, {
      signer,
      entryPointVersion: "0.6",
    })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(mockClient, {
      signer,
      entryPoint: getEntryPoint("0.6"),
      kernelVersion: KERNEL_V3_1,
      validatorAddress: undefined,
    })
  })

  it("uses custom kernel version", async () => {
    await createEcdsaValidator(mockClient, {
      signer,
      kernelVersion: "0.3.0",
    })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(mockClient, {
      signer,
      entryPoint: getEntryPoint("0.7"),
      kernelVersion: "0.3.0",
      validatorAddress: undefined,
    })
  })

  it("passes custom validator address", async () => {
    const validatorAddress = "0x1234567890123456789012345678901234567890" as const
    await createEcdsaValidator(mockClient, {
      signer,
      validatorAddress,
    })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(mockClient, {
      signer,
      entryPoint: getEntryPoint("0.7"),
      kernelVersion: KERNEL_V3_1,
      validatorAddress,
    })
  })

  it("combines custom entry point and kernel version", async () => {
    await createEcdsaValidator(mockClient, {
      signer,
      entryPointVersion: "0.6",
      kernelVersion: "0.2.4",
    })

    expect(signerToEcdsaValidator).toHaveBeenCalledWith(mockClient, {
      signer,
      entryPoint: getEntryPoint("0.6"),
      kernelVersion: "0.2.4",
      validatorAddress: undefined,
    })
  })
})
