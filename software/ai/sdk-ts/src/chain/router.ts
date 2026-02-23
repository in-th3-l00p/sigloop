import { createPublicClient, http, formatGwei } from "viem";
import { SupportedChain, type ChainConfig } from "../types/chain.js";
import { CHAIN_CONFIGS, getChainConfig } from "./config.js";

interface ChainScore {
  chainId: SupportedChain;
  gasPrice: bigint;
  latency: number;
  score: number;
}

async function measureChainLatency(config: ChainConfig): Promise<{ gasPrice: bigint; latency: number }> {
  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const start = Date.now();
  const gasPrice = await client.getGasPrice();
  const latency = Date.now() - start;

  return { gasPrice, latency };
}

export async function selectOptimalChain(
  candidates?: SupportedChain[],
  options?: { prioritize?: "cost" | "speed" | "balanced" }
): Promise<ChainConfig> {
  const chains = candidates ?? [
    SupportedChain.Base,
    SupportedChain.Arbitrum,
  ];

  const priority = options?.prioritize ?? "balanced";

  const scores: ChainScore[] = await Promise.all(
    chains.map(async (chainId) => {
      const config = getChainConfig(chainId);
      try {
        const { gasPrice, latency } = await measureChainLatency(config);
        const gasPriceNormalized = Number(formatGwei(gasPrice));
        const latencyNormalized = latency / 1000;

        let score: number;
        switch (priority) {
          case "cost":
            score = gasPriceNormalized * 0.9 + latencyNormalized * 0.1;
            break;
          case "speed":
            score = gasPriceNormalized * 0.1 + latencyNormalized * 0.9;
            break;
          case "balanced":
            score = gasPriceNormalized * 0.5 + latencyNormalized * 0.5;
            break;
        }

        return { chainId, gasPrice, latency, score };
      } catch {
        return { chainId, gasPrice: BigInt(Number.MAX_SAFE_INTEGER), latency: Number.MAX_SAFE_INTEGER, score: Number.MAX_SAFE_INTEGER };
      }
    })
  );

  scores.sort((a, b) => a.score - b.score);

  const best = scores[0];
  if (!best || best.score === Number.MAX_SAFE_INTEGER) {
    throw new Error("No reachable chains found");
  }

  return getChainConfig(best.chainId);
}

export async function getChainGasPrice(chainId: SupportedChain): Promise<bigint> {
  const config = getChainConfig(chainId);
  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
  return client.getGasPrice();
}

export async function isChainHealthy(chainId: SupportedChain): Promise<boolean> {
  const config = getChainConfig(chainId);
  try {
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
    await client.getBlockNumber();
    return true;
  } catch {
    return false;
  }
}
