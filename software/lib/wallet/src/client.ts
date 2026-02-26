import { http } from "viem"
import { createKernelAccountClient } from "@zerodev/sdk"
import type { ClientConfig } from "./types.js"

export function createAccountClient(config: ClientConfig) {
  const paymasterConfig = resolvePaymaster(config)

  return createKernelAccountClient({
    account: config.account,
    chain: config.chain,
    bundlerTransport: http(config.rpcUrl),
    client: config.publicClient,
    ...paymasterConfig,
  })
}

function resolvePaymaster(config: ClientConfig) {
  if (!config.paymaster || config.paymaster.type === "none") {
    return {}
  }

  if (config.paymaster.type === "sponsor") {
    return {
      paymaster: {
        getPaymasterData: (userOperation: any) => {
          return config.paymaster!.type === "sponsor"
            ? (config.paymaster as any).paymasterClient.sponsorUserOperation({ userOperation })
            : undefined
        },
      },
    }
  }

  if (config.paymaster.type === "erc20") {
    const pm = config.paymaster
    return {
      paymaster: {
        getPaymasterData: (userOperation: any) => {
          return pm.paymasterClient.sponsorUserOperation({
            userOperation,
            gasToken: pm.gasToken,
          })
        },
      },
      paymasterContext: {
        token: pm.gasToken,
      },
    }
  }

  return {}
}

export { createKernelAccountClient } from "@zerodev/sdk"
