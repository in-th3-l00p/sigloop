import { http } from "viem"
import { createZeroDevPaymasterClient } from "@zerodev/sdk"
import type { PaymasterConfig } from "./types.js"

export function createPaymaster(config: PaymasterConfig) {
  return createZeroDevPaymasterClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  })
}

export { createZeroDevPaymasterClient } from "@zerodev/sdk"
