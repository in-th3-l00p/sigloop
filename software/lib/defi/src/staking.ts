import { encodeFunctionData } from "viem"
import type { Address, Hex } from "viem"
import type { StakeParams, StakeResult } from "./types.js"
import { ERC20_APPROVE_ABI } from "./constants.js"

const STAKE_ABI = [
  {
    type: "function" as const,
    name: "stake" as const,
    inputs: [{ name: "amount", type: "uint256" as const, internalType: "uint256" as const }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
]

const UNSTAKE_ABI = [
  {
    type: "function" as const,
    name: "unstake" as const,
    inputs: [{ name: "amount", type: "uint256" as const, internalType: "uint256" as const }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
]

export function encodeStake(params: StakeParams): StakeResult {
  if (params.token) {
    const data = encodeFunctionData({
      abi: STAKE_ABI,
      functionName: "stake",
      args: [params.amount],
    })

    return {
      to: params.target,
      data,
      value: 0n,
    }
  }

  const data = encodeFunctionData({
    abi: STAKE_ABI,
    functionName: "stake",
    args: [params.amount],
  })

  return {
    to: params.target,
    data,
    value: params.amount,
  }
}

export function encodeUnstake(params: StakeParams): StakeResult {
  const data = encodeFunctionData({
    abi: UNSTAKE_ABI,
    functionName: "unstake",
    args: [params.amount],
  })

  return {
    to: params.target,
    data,
    value: 0n,
  }
}
