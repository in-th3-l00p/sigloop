import {
  type Address,
  type Hex,
  encodeFunctionData,
  parseAbi,
  createPublicClient,
  http,
} from "viem";
import type { LendingParams, LendingResult } from "../types/defi.js";
import { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress, validateAmount } from "../utils/validation.js";

const AAVE_POOL_ABI = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external",
  "function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256)",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
]);

const AAVE_POOL_ADDRESSES: Record<SupportedChain, Address> = {
  [SupportedChain.Base]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  [SupportedChain.Arbitrum]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [SupportedChain.BaseSepolia]: "0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b",
  [SupportedChain.ArbitrumSepolia]: "0xBfC91D59fdAA134A4ED45f7B0142c56EDB324T12" as Address,
};

export async function supply(params: LendingParams): Promise<LendingResult> {
  validateAddress(params.asset);
  validateAddress(params.onBehalfOf);
  validateAmount(params.amount, "supply amount");

  const poolAddress = AAVE_POOL_ADDRESSES[params.chainId];
  if (!poolAddress) {
    throw new Error(`No lending pool for chain ${params.chainId}`);
  }

  const calldata = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: "supply",
    args: [params.asset, params.amount, params.onBehalfOf, 0],
  });

  return {
    calldata,
    to: poolAddress,
    value: 0n,
  };
}

export async function borrow(params: LendingParams): Promise<LendingResult> {
  validateAddress(params.asset);
  validateAddress(params.onBehalfOf);
  validateAmount(params.amount, "borrow amount");

  const poolAddress = AAVE_POOL_ADDRESSES[params.chainId];
  if (!poolAddress) {
    throw new Error(`No lending pool for chain ${params.chainId}`);
  }

  const interestRateMode = params.interestRateMode ?? 2;

  const calldata = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: "borrow",
    args: [params.asset, params.amount, BigInt(interestRateMode), 0, params.onBehalfOf],
  });

  return {
    calldata,
    to: poolAddress,
    value: 0n,
  };
}

export async function repay(params: LendingParams): Promise<LendingResult> {
  validateAddress(params.asset);
  validateAddress(params.onBehalfOf);
  validateAmount(params.amount, "repay amount");

  const poolAddress = AAVE_POOL_ADDRESSES[params.chainId];
  if (!poolAddress) {
    throw new Error(`No lending pool for chain ${params.chainId}`);
  }

  const interestRateMode = params.interestRateMode ?? 2;

  const calldata = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: "repay",
    args: [params.asset, params.amount, BigInt(interestRateMode), params.onBehalfOf],
  });

  return {
    calldata,
    to: poolAddress,
    value: 0n,
  };
}

export async function withdraw(
  chainId: SupportedChain,
  asset: Address,
  amount: bigint,
  to: Address
): Promise<LendingResult> {
  validateAddress(asset);
  validateAddress(to);
  validateAmount(amount, "withdraw amount");

  const poolAddress = AAVE_POOL_ADDRESSES[chainId];
  if (!poolAddress) {
    throw new Error(`No lending pool for chain ${chainId}`);
  }

  const calldata = encodeFunctionData({
    abi: AAVE_POOL_ABI,
    functionName: "withdraw",
    args: [asset, amount, to],
  });

  return {
    calldata,
    to: poolAddress,
    value: 0n,
  };
}

export interface UserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export async function getUserAccountData(
  user: Address,
  chainId: SupportedChain
): Promise<UserAccountData> {
  validateAddress(user);

  const chainConfig = getChainConfig(chainId);
  const poolAddress = AAVE_POOL_ADDRESSES[chainId];
  if (!poolAddress) {
    throw new Error(`No lending pool for chain ${chainId}`);
  }

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
  ] = await client.readContract({
    address: poolAddress,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: [user],
  });

  return {
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ltv,
    healthFactor,
  };
}

export function getLendingPoolAddress(chainId: SupportedChain): Address {
  const address = AAVE_POOL_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`No lending pool for chain ${chainId}`);
  }
  return address;
}
