import type { Address, Hex, LocalAccount } from "viem";
import type { Policy } from "./policy.js";
import type { SupportedChain } from "./chain.js";

export interface SessionKey {
  privateKey: Hex;
  publicKey: Address;
  account: LocalAccount;
  validAfter: number;
  validUntil: number;
  nonce: bigint;
}

export interface AgentConfig {
  name: string;
  description?: string;
  policy: Policy;
  sessionDurationSeconds?: number;
}

export interface CreateAgentParams {
  walletAddress: Address;
  owner: LocalAccount;
  config: AgentConfig;
  chainId: SupportedChain;
}

export interface Agent {
  id: Hex;
  name: string;
  description?: string;
  walletAddress: Address;
  sessionKey: SessionKey;
  policy: Policy;
  chainId: SupportedChain;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export interface SerializedSessionKey {
  privateKey: Hex;
  publicKey: Address;
  validAfter: number;
  validUntil: number;
  nonce: string;
}
