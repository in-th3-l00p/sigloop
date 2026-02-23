import type { Address } from "viem";
import type { SupportedChain } from "./chain.js";

export interface SwapParams {
  chainId: SupportedChain;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  recipient: Address;
  deadline?: number;
  slippageBps?: number;
}

export interface LiquidityParams {
  chainId: SupportedChain;
  tokenA: Address;
  tokenB: Address;
  amountA: bigint;
  amountB: bigint;
  recipient: Address;
  deadline?: number;
}

export interface LendingParams {
  chainId: SupportedChain;
  asset: Address;
  amount: bigint;
  onBehalfOf: Address;
  interestRateMode?: number;
}

export interface StakeParams {
  chainId: SupportedChain;
  asset: Address;
  amount: bigint;
  validator?: Address;
  recipient: Address;
}

export interface SwapResult {
  amountOut: bigint;
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}

export interface LendingResult {
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}

export interface StakeResult {
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}
