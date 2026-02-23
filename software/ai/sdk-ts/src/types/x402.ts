import type { Address, Hex } from "viem";

export interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType?: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
  extra?: Record<string, unknown>;
}

export interface X402Config {
  maxPaymentPerRequest: bigint;
  maxTotalPayment: bigint;
  allowedDomains?: string[];
  allowedAssets?: Address[];
  autoApprove: boolean;
}

export interface PaymentRecord {
  id: Hex;
  url: string;
  amount: bigint;
  asset: Address;
  payTo: Address;
  timestamp: number;
  txHash?: Hex;
  authorization: Hex;
}

export interface X402Policy {
  maxPerRequest: bigint;
  maxDaily: bigint;
  allowedDomains: string[];
  allowedAssets: Address[];
}

export interface EIP3009Authorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}
