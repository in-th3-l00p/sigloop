import { encodeFunctionData } from "viem"
import type { Address, Hex } from "viem"
import type { SwapParams, SwapResult } from "./types.js"
import { UNISWAP_V3_ROUTER_ABI, ERC20_APPROVE_ABI, DEFAULT_POOL_FEE, DEFAULT_DEADLINE_OFFSET } from "./constants.js"

export function encodeSwap(params: SwapParams): SwapResult {
  const data = encodeFunctionData({
    abi: UNISWAP_V3_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee ?? DEFAULT_POOL_FEE,
        recipient: params.recipient,
        amountIn: params.amountIn,
        amountOutMinimum: params.minAmountOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })

  return {
    to: params.router!,
    data,
    value: 0n,
  }
}

export function buildApproveCalldata(
  token: Address,
  spender: Address,
  amount: bigint,
): { to: Address; data: Hex } {
  const data = encodeFunctionData({
    abi: ERC20_APPROVE_ABI,
    functionName: "approve",
    args: [spender, amount],
  })

  return { to: token, data }
}
