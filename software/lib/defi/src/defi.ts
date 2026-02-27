import type { Address, Hex } from "viem"
import type { DeFiConfig, DeFiActions, SwapParams, LendingParams, StakeParams } from "./types.js"
import { UNISWAP_V3_ROUTER, AAVE_V3_POOL } from "./constants.js"
import { encodeSwap, buildApproveCalldata } from "./swap.js"
import { encodeSupply, encodeBorrow, encodeRepay } from "./lending.js"
import { encodeStake, encodeUnstake } from "./staking.js"

export function createDeFiActions(config: DeFiConfig): DeFiActions {
  const router = UNISWAP_V3_ROUTER[config.chainId]
  const pool = AAVE_V3_POOL[config.chainId]

  return {
    encodeSwap: (params: SwapParams) =>
      encodeSwap({ ...params, router: params.router ?? router }),

    encodeSupply: (params: LendingParams) =>
      encodeSupply({ ...params, pool: params.pool ?? pool }),

    encodeBorrow: (params: LendingParams) =>
      encodeBorrow({ ...params, pool: params.pool ?? pool }),

    encodeRepay: (params: LendingParams) =>
      encodeRepay({ ...params, pool: params.pool ?? pool }),

    encodeStake: (params: StakeParams) => encodeStake(params),

    encodeUnstake: (params: StakeParams) => encodeUnstake(params),

    buildApprove: (token: Address, spender: Address, amount: bigint) =>
      buildApproveCalldata(token, spender, amount),
  }
}
