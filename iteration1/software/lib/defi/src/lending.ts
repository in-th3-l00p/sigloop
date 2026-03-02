import { encodeFunctionData } from "viem"
import type { LendingParams, LendingResult } from "./types.js"
import { AAVE_V3_POOL_ABI } from "./constants.js"

export function encodeSupply(params: LendingParams): LendingResult {
  const data = encodeFunctionData({
    abi: AAVE_V3_POOL_ABI,
    functionName: "supply",
    args: [params.asset, params.amount, params.onBehalfOf, 0],
  })

  return {
    to: params.pool!,
    data,
    value: 0n,
  }
}

export function encodeBorrow(params: LendingParams): LendingResult {
  const data = encodeFunctionData({
    abi: AAVE_V3_POOL_ABI,
    functionName: "borrow",
    args: [
      params.asset,
      params.amount,
      BigInt(params.interestRateMode ?? 2),
      0,
      params.onBehalfOf,
    ],
  })

  return {
    to: params.pool!,
    data,
    value: 0n,
  }
}

export function encodeRepay(params: LendingParams): LendingResult {
  const data = encodeFunctionData({
    abi: AAVE_V3_POOL_ABI,
    functionName: "repay",
    args: [
      params.asset,
      params.amount,
      BigInt(params.interestRateMode ?? 2),
      params.onBehalfOf,
    ],
  })

  return {
    to: params.pool!,
    data,
    value: 0n,
  }
}
