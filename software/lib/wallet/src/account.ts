import { createKernelAccount } from "@zerodev/sdk"
import { getEntryPoint, KERNEL_V3_1 } from "@zerodev/sdk/constants"
import type { AccountConfig } from "./types.js"

export async function createSmartAccount(
  publicClient: any,
  config: AccountConfig,
) {
  const entryPoint = getEntryPoint(config.entryPointVersion ?? "0.7")
  const kernelVersion = config.kernelVersion ?? KERNEL_V3_1

  return createKernelAccount(publicClient, {
    plugins: {
      sudo: config.validator,
    },
    entryPoint,
    kernelVersion: kernelVersion as typeof KERNEL_V3_1,
    index: config.index,
    address: config.address,
  })
}

export { createKernelAccount } from "@zerodev/sdk"
