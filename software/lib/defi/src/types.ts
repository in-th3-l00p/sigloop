import type { Address, Hex } from "viem"

export type ActionType = "swap" | "supply" | "borrow" | "repay" | "stake" | "unstake"

export type DeFiAction = {
  actionType: ActionType
  target: Address
  data: Hex
  value: bigint
}

export type SwapParams = {
  router?: Address
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  minAmountOut: bigint
  recipient: Address
  fee?: number
  deadline?: number
}

export type SwapResult = {
  to: Address
  data: Hex
  value: bigint
}

export type LendingParams = {
  pool?: Address
  asset: Address
  amount: bigint
  onBehalfOf: Address
  interestRateMode?: number
}

export type LendingResult = {
  to: Address
  data: Hex
  value: bigint
}

export type StakeParams = {
  target: Address
  amount: bigint
  token?: Address
}

export type StakeResult = {
  to: Address
  data: Hex
  value: bigint
}

export type DeFiConfig = {
  chainId: number
}

export type DeFiActions = {
  encodeSwap: (params: SwapParams) => SwapResult
  encodeSupply: (params: LendingParams) => LendingResult
  encodeBorrow: (params: LendingParams) => LendingResult
  encodeRepay: (params: LendingParams) => LendingResult
  encodeStake: (params: StakeParams) => StakeResult
  encodeUnstake: (params: StakeParams) => StakeResult
  buildApprove: (token: Address, spender: Address, amount: bigint) => { to: Address; data: Hex }
}
