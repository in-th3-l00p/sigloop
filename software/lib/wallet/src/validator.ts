import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants"
import type { ValidatorConfig } from "./types.js"

export async function createEcdsaValidator(
  publicClient: any,
  config: ValidatorConfig,
) {
  const entryPoint = getEntryPoint(config.entryPointVersion ?? "0.7")
  const kernelVersion = config.kernelVersion ?? KERNEL_V3_1

  return signerToEcdsaValidator(publicClient, {
    signer: config.signer,
    entryPoint,
    kernelVersion: kernelVersion as typeof KERNEL_V3_1,
    validatorAddress: config.validatorAddress,
  })
}

export { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
export { getKernelAddressFromECDSA } from "@zerodev/ecdsa-validator"
