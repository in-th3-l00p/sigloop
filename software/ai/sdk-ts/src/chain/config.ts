import { base, arbitrum, baseSepolia, arbitrumSepolia } from "viem/chains";
import { entryPoint07Address } from "viem/account-abstraction";
import { SupportedChain, type ChainConfig } from "../types/chain.js";

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  [SupportedChain.Base]: {
    chain: base,
    chainId: SupportedChain.Base,
    rpcUrl: "https://mainnet.base.org",
    bundlerUrl: "https://bundler.base.org",
    entryPointAddress: entryPoint07Address,
    explorerUrl: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    averageBlockTime: 2000,
    averageGasPrice: 1000000n,
  },
  [SupportedChain.Arbitrum]: {
    chain: arbitrum,
    chainId: SupportedChain.Arbitrum,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    bundlerUrl: "https://bundler.arbitrum.io",
    entryPointAddress: entryPoint07Address,
    explorerUrl: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    averageBlockTime: 250,
    averageGasPrice: 100000000n,
  },
  [SupportedChain.BaseSepolia]: {
    chain: baseSepolia,
    chainId: SupportedChain.BaseSepolia,
    rpcUrl: "https://sepolia.base.org",
    bundlerUrl: "https://bundler.sepolia.base.org",
    entryPointAddress: entryPoint07Address,
    explorerUrl: "https://sepolia.basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    averageBlockTime: 2000,
    averageGasPrice: 1000000n,
  },
  [SupportedChain.ArbitrumSepolia]: {
    chain: arbitrumSepolia,
    chainId: SupportedChain.ArbitrumSepolia,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    bundlerUrl: "https://bundler.sepolia.arbitrum.io",
    entryPointAddress: entryPoint07Address,
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    averageBlockTime: 250,
    averageGasPrice: 100000000n,
  },
};

export function getChainConfig(chainId: SupportedChain): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return config;
}

export function getChainConfigWithOverrides(
  chainId: SupportedChain,
  overrides?: { rpcUrl?: string; bundlerUrl?: string; paymasterUrl?: string }
): ChainConfig {
  const config = getChainConfig(chainId);
  return {
    ...config,
    rpcUrl: overrides?.rpcUrl ?? config.rpcUrl,
    bundlerUrl: overrides?.bundlerUrl ?? config.bundlerUrl,
    paymasterUrl: overrides?.paymasterUrl ?? config.paymasterUrl,
  };
}
