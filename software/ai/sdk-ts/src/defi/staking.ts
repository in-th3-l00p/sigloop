import {
  type Address,
  type Hex,
  encodeFunctionData,
  parseAbi,
  createPublicClient,
  http,
} from "viem";
import type { StakeParams, StakeResult } from "../types/defi.js";
import { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress, validateAmount } from "../utils/validation.js";

const STAKING_ABI = parseAbi([
  "function stake(uint256 amount) external",
  "function stakeFor(address recipient, uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimRewards() external",
  "function claimRewardsFor(address recipient) external",
  "function getStakedBalance(address account) external view returns (uint256)",
  "function getPendingRewards(address account) external view returns (uint256)",
  "function getTotalStaked() external view returns (uint256)",
]);

const STAKING_ADDRESSES: Record<SupportedChain, Record<string, Address>> = {
  [SupportedChain.Base]: {
    default: "0x0000000000000000000000000000000000000000" as Address,
  },
  [SupportedChain.Arbitrum]: {
    default: "0x0000000000000000000000000000000000000000" as Address,
  },
  [SupportedChain.BaseSepolia]: {
    default: "0x0000000000000000000000000000000000000000" as Address,
  },
  [SupportedChain.ArbitrumSepolia]: {
    default: "0x0000000000000000000000000000000000000000" as Address,
  },
};

function getStakingAddress(chainId: SupportedChain, validator?: Address): Address {
  if (validator) {
    return validator;
  }
  const addresses = STAKING_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`No staking contracts for chain ${chainId}`);
  }
  return addresses["default"]!;
}

export async function stake(params: StakeParams): Promise<StakeResult> {
  validateAddress(params.asset);
  validateAddress(params.recipient);
  validateAmount(params.amount, "stake amount");

  const stakingAddress = getStakingAddress(params.chainId, params.validator);

  const useDelegated = params.recipient !== params.asset;
  const calldata = useDelegated
    ? encodeFunctionData({
        abi: STAKING_ABI,
        functionName: "stakeFor",
        args: [params.recipient, params.amount],
      })
    : encodeFunctionData({
        abi: STAKING_ABI,
        functionName: "stake",
        args: [params.amount],
      });

  return {
    calldata,
    to: stakingAddress,
    value: 0n,
  };
}

export async function unstake(
  chainId: SupportedChain,
  amount: bigint,
  validator?: Address
): Promise<StakeResult> {
  validateAmount(amount, "unstake amount");

  const stakingAddress = getStakingAddress(chainId, validator);

  const calldata = encodeFunctionData({
    abi: STAKING_ABI,
    functionName: "unstake",
    args: [amount],
  });

  return {
    calldata,
    to: stakingAddress,
    value: 0n,
  };
}

export async function claimRewards(
  chainId: SupportedChain,
  recipient?: Address,
  validator?: Address
): Promise<StakeResult> {
  const stakingAddress = getStakingAddress(chainId, validator);

  const calldata = recipient
    ? encodeFunctionData({
        abi: STAKING_ABI,
        functionName: "claimRewardsFor",
        args: [recipient],
      })
    : encodeFunctionData({
        abi: STAKING_ABI,
        functionName: "claimRewards",
      });

  return {
    calldata,
    to: stakingAddress,
    value: 0n,
  };
}

export async function getStakedBalance(
  account: Address,
  chainId: SupportedChain,
  validator?: Address
): Promise<bigint> {
  validateAddress(account);

  const chainConfig = getChainConfig(chainId);
  const stakingAddress = getStakingAddress(chainId, validator);

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  return client.readContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: "getStakedBalance",
    args: [account],
  });
}

export async function getPendingRewards(
  account: Address,
  chainId: SupportedChain,
  validator?: Address
): Promise<bigint> {
  validateAddress(account);

  const chainConfig = getChainConfig(chainId);
  const stakingAddress = getStakingAddress(chainId, validator);

  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  return client.readContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: "getPendingRewards",
    args: [account],
  });
}
