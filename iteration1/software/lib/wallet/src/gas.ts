import type { Address } from "viem"
import { parseEther } from "viem"
import {
  getERC20PaymasterApproveCall,
  gasTokenAddresses,
} from "@zerodev/sdk"
import { getEntryPoint } from "@zerodev/sdk/constants"
import type { EntryPointVersion } from "./types.js"

export function getGasTokenAddress(
  chainId: number,
  symbol: string,
): Address | undefined {
  const chainTokens = (gasTokenAddresses as Record<number, Record<string, Address>>)[chainId]
  if (!chainTokens) return undefined
  return chainTokens[symbol]
}

export function getGasTokens(chainId: number): Record<string, Address> | undefined {
  return (gasTokenAddresses as Record<number, Record<string, Address>>)[chainId]
}

export async function getERC20ApproveCall(
  paymasterClient: any,
  params: {
    gasToken: Address
    amount?: bigint
    entryPointVersion?: EntryPointVersion
  },
) {
  const entryPoint = getEntryPoint(params.entryPointVersion ?? "0.7")

  return getERC20PaymasterApproveCall(paymasterClient, {
    gasToken: params.gasToken,
    approveAmount: params.amount ?? parseEther("1"),
    entryPoint,
  })
}

export { gasTokenAddresses, getERC20PaymasterApproveCall } from "@zerodev/sdk"
