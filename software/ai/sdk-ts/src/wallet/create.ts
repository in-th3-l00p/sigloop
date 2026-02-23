import {
  createPublicClient,
  http,
  type LocalAccount,
} from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { toKernelSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless/clients";
import type { SigloopWallet, CreateWalletParams } from "../types/wallet.js";
import { getChainConfigWithOverrides } from "../chain/config.js";

export async function createWallet(params: CreateWalletParams): Promise<SigloopWallet> {
  const chainConfig = getChainConfigWithOverrides(params.config.chainId, {
    rpcUrl: params.config.rpcUrl,
    bundlerUrl: params.config.bundlerUrl,
    paymasterUrl: params.config.paymasterUrl,
  });

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const kernelAccount = await toKernelSmartAccount({
    client: publicClient,
    owners: [params.owner],
    version: "0.3.1",
    entryPoint: {
      address: chainConfig.entryPointAddress,
      version: "0.7",
    },
    index: params.config.index ?? 0n,
  });

  const bundlerClient = createBundlerClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.bundlerUrl),
  });

  const smartAccountClient = createSmartAccountClient({
    account: kernelAccount,
    chain: chainConfig.chain,
    bundlerTransport: http(chainConfig.bundlerUrl),
    client: publicClient,
    ...(chainConfig.paymasterUrl
      ? { paymaster: true }
      : {}),
  });

  return {
    address: kernelAccount.address,
    smartAccount: kernelAccount,
    owner: params.owner,
    chainId: params.config.chainId,
    entryPointVersion: "0.7",
    guardians: [],
  };
}

export async function getWalletAddress(
  owner: LocalAccount,
  config: CreateWalletParams["config"]
): Promise<`0x${string}`> {
  const chainConfig = getChainConfigWithOverrides(config.chainId, {
    rpcUrl: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
  });

  const publicClient = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const kernelAccount = await toKernelSmartAccount({
    client: publicClient,
    owners: [owner],
    version: "0.3.1",
    entryPoint: {
      address: chainConfig.entryPointAddress,
      version: "0.7",
    },
    index: config.index ?? 0n,
  });

  return kernelAccount.address;
}
