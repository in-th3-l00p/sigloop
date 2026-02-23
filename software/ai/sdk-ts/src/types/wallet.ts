import type { Address, Hex, LocalAccount } from "viem";
import type { SmartAccount } from "viem/account-abstraction";
import type { SupportedChain } from "./chain.js";

export interface WalletConfig {
  chainId: SupportedChain;
  rpcUrl?: string;
  bundlerUrl?: string;
  paymasterUrl?: string;
  index?: bigint;
}

export interface CreateWalletParams {
  owner: LocalAccount;
  config: WalletConfig;
}

export interface SigloopWallet {
  address: Address;
  smartAccount: SmartAccount;
  owner: LocalAccount;
  chainId: SupportedChain;
  entryPointVersion: "0.7";
  deploymentHash?: Hex;
  guardians: Address[];
}
