import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
import { getEntryPoint } from "@zerodev/sdk/constants"
import type { ValidatorConfig } from "./types.js"
import { DEFAULT_ENTRY_POINT_VERSION, DEFAULT_KERNEL_VERSION } from "./constants.js"

export async function createEcdsaValidator(
  publicClient: any,
  config: ValidatorConfig,
) {
  const entryPoint = getEntryPoint(config.entryPointVersion ?? DEFAULT_ENTRY_POINT_VERSION)
  const kernelVersion = config.kernelVersion ?? DEFAULT_KERNEL_VERSION

  return signerToEcdsaValidator(publicClient, {
    signer: config.signer,
    entryPoint,
    kernelVersion,
    validatorAddress: config.validatorAddress,
  })
}

export { signerToEcdsaValidator } from "@zerodev/ecdsa-validator"
export { getKernelAddressFromECDSA } from "@zerodev/ecdsa-validator"
