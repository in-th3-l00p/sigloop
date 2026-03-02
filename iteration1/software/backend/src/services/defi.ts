import type { Address, Hex } from "viem"
import { createDeFiActions, buildApproveCalldata } from "@sigloop/defi"
import type {
  SwapEncodeRequest,
  LendingEncodeRequest,
  ApproveEncodeRequest,
  EncodedCallResult,
} from "../types.js"

export type DeFiService = {
  encodeSwap: (request: SwapEncodeRequest) => EncodedCallResult
  encodeSupply: (request: LendingEncodeRequest) => EncodedCallResult
  encodeBorrow: (request: LendingEncodeRequest) => EncodedCallResult
  encodeRepay: (request: LendingEncodeRequest) => EncodedCallResult
  encodeApprove: (request: ApproveEncodeRequest) => { to: string; data: string }
}

export function createDeFiService(): DeFiService {
  function toResult(r: { to: Address; data: Hex; value: bigint }): EncodedCallResult {
    return { to: r.to, data: r.data, value: r.value.toString() }
  }

  return {
    encodeSwap(request) {
      if (!request.tokenIn) throw new Error("tokenIn is required")
      if (!request.tokenOut) throw new Error("tokenOut is required")
      if (!request.amountIn) throw new Error("amountIn is required")
      if (!request.recipient) throw new Error("recipient is required")

      const actions = createDeFiActions({ chainId: request.chainId })
      const result = actions.encodeSwap({
        router: request.router as Address | undefined,
        tokenIn: request.tokenIn as Address,
        tokenOut: request.tokenOut as Address,
        amountIn: BigInt(request.amountIn),
        minAmountOut: BigInt(request.minAmountOut || "0"),
        recipient: request.recipient as Address,
        fee: request.fee,
      })

      return toResult(result)
    },

    encodeSupply(request) {
      if (!request.asset) throw new Error("asset is required")
      if (!request.amount) throw new Error("amount is required")
      if (!request.onBehalfOf) throw new Error("onBehalfOf is required")

      const actions = createDeFiActions({ chainId: request.chainId })
      const result = actions.encodeSupply({
        pool: request.pool as Address | undefined,
        asset: request.asset as Address,
        amount: BigInt(request.amount),
        onBehalfOf: request.onBehalfOf as Address,
      })

      return toResult(result)
    },

    encodeBorrow(request) {
      if (!request.asset) throw new Error("asset is required")
      if (!request.amount) throw new Error("amount is required")
      if (!request.onBehalfOf) throw new Error("onBehalfOf is required")

      const actions = createDeFiActions({ chainId: request.chainId })
      const result = actions.encodeBorrow({
        pool: request.pool as Address | undefined,
        asset: request.asset as Address,
        amount: BigInt(request.amount),
        onBehalfOf: request.onBehalfOf as Address,
        interestRateMode: request.interestRateMode,
      })

      return toResult(result)
    },

    encodeRepay(request) {
      if (!request.asset) throw new Error("asset is required")
      if (!request.amount) throw new Error("amount is required")
      if (!request.onBehalfOf) throw new Error("onBehalfOf is required")

      const actions = createDeFiActions({ chainId: request.chainId })
      const result = actions.encodeRepay({
        pool: request.pool as Address | undefined,
        asset: request.asset as Address,
        amount: BigInt(request.amount),
        onBehalfOf: request.onBehalfOf as Address,
        interestRateMode: request.interestRateMode,
      })

      return toResult(result)
    },

    encodeApprove(request) {
      if (!request.token) throw new Error("token is required")
      if (!request.spender) throw new Error("spender is required")
      if (!request.amount) throw new Error("amount is required")

      const result = buildApproveCalldata(
        request.token as Address,
        request.spender as Address,
        BigInt(request.amount),
      )

      return { to: result.to, data: result.data }
    },
  }
}
