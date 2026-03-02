import { encodeFunctionData, encodeAbiParameters } from "viem"
import type { Address, Hex } from "viem"
import type { DeFiAction } from "./types.js"
import { DEFI_EXECUTOR_ABI, ACTION_TYPE_MAP } from "./constants.js"

export function encodeDeFiAction(action: DeFiAction): Hex {
  return encodeFunctionData({
    abi: DEFI_EXECUTOR_ABI,
    functionName: "executeFromExecutor",
    args: [action.target, action.value, action.data],
  })
}

export function encodeExecutorSwap(
  router: Address,
  swapCalldata: Hex,
): Hex {
  return encodeFunctionData({
    abi: DEFI_EXECUTOR_ABI,
    functionName: "executeFromExecutor",
    args: [router, 0n, swapCalldata],
  })
}

export function encodeExecutorLending(
  pool: Address,
  lendingCalldata: Hex,
): Hex {
  return encodeFunctionData({
    abi: DEFI_EXECUTOR_ABI,
    functionName: "executeFromExecutor",
    args: [pool, 0n, lendingCalldata],
  })
}
