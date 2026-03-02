import { createKernelAccount } from "@zerodev/sdk"
import { getEntryPoint } from "@zerodev/sdk/constants"
import type { AccountConfig } from "./types.js"
import { DEFAULT_ENTRY_POINT_VERSION, DEFAULT_KERNEL_VERSION } from "./constants.js"

export async function createSmartAccount(
  publicClient: any,
  config: AccountConfig,
) {
  const entryPoint = getEntryPoint(config.entryPointVersion ?? DEFAULT_ENTRY_POINT_VERSION)
  const kernelVersion = config.kernelVersion ?? DEFAULT_KERNEL_VERSION

  return createKernelAccount(publicClient, {
    plugins: {
      sudo: config.validator,
    },
    entryPoint,
    kernelVersion,
    index: config.index,
    address: config.address,
  })
}

export { createKernelAccount } from "@zerodev/sdk"
