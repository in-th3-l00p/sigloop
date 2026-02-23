import type { Address, Hex } from "viem";

export interface SpendingLimit {
  type: "spending";
  maxPerTransaction: bigint;
  maxDaily: bigint;
  maxWeekly: bigint;
  tokenAddress: Address;
}

export interface ContractAllowlist {
  type: "contract-allowlist";
  addresses: Address[];
}

export interface FunctionAllowlist {
  type: "function-allowlist";
  contract: Address;
  selectors: Hex[];
}

export interface TimeWindow {
  type: "time-window";
  validAfter: number;
  validUntil: number;
}

export interface RateLimit {
  type: "rate-limit";
  maxCalls: number;
  intervalSeconds: number;
}

export type PolicyRule =
  | SpendingLimit
  | ContractAllowlist
  | FunctionAllowlist
  | TimeWindow
  | RateLimit;

export interface PolicyComposition {
  operator: "AND" | "OR";
  rules: PolicyRule[];
}

export interface Policy {
  id: Hex;
  rules: PolicyRule[];
  composition: PolicyComposition;
  encoded: Hex;
}
