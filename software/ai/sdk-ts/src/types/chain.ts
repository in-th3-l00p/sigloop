import type { Address, Chain } from "viem";

export enum SupportedChain {
  Base = 8453,
  Arbitrum = 42161,
  BaseSepolia = 84532,
  ArbitrumSepolia = 421614,
}

export interface ChainConfig {
  chain: Chain;
  chainId: SupportedChain;
  rpcUrl: string;
  bundlerUrl: string;
  entryPointAddress: Address;
  paymasterUrl?: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  averageBlockTime: number;
  averageGasPrice: bigint;
}
