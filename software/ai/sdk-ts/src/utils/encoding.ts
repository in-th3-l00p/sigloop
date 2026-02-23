import {
  type Address,
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  decodeAbiParameters,
  keccak256,
  encodePacked,
  toHex,
} from "viem";
import type { Policy, PolicyRule, SpendingLimit, ContractAllowlist, FunctionAllowlist, TimeWindow, RateLimit } from "../types/policy.js";

function encodeSpendingLimit(rule: SpendingLimit): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint8 ruleType, uint256 maxPerTx, uint256 maxDaily, uint256 maxWeekly, address token"),
    [0, rule.maxPerTransaction, rule.maxDaily, rule.maxWeekly, rule.tokenAddress]
  );
}

function encodeContractAllowlist(rule: ContractAllowlist): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint8 ruleType, address[] contracts"),
    [1, rule.addresses]
  );
}

function encodeFunctionAllowlist(rule: FunctionAllowlist): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint8 ruleType, address contract, bytes4[] selectors"),
    [2, rule.contract, rule.selectors as readonly `0x${string}`[]]
  );
}

function encodeTimeWindow(rule: TimeWindow): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint8 ruleType, uint48 validAfter, uint48 validUntil"),
    [3, rule.validAfter, rule.validUntil]
  );
}

function encodeRateLimit(rule: RateLimit): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint8 ruleType, uint32 maxCalls, uint32 interval"),
    [4, rule.maxCalls, rule.intervalSeconds]
  );
}

function encodePolicyRule(rule: PolicyRule): Hex {
  switch (rule.type) {
    case "spending":
      return encodeSpendingLimit(rule);
    case "contract-allowlist":
      return encodeContractAllowlist(rule);
    case "function-allowlist":
      return encodeFunctionAllowlist(rule);
    case "time-window":
      return encodeTimeWindow(rule);
    case "rate-limit":
      return encodeRateLimit(rule);
  }
}

export function encodePolicy(policy: Policy): Hex {
  const encodedRules = policy.rules.map(encodePolicyRule);
  const compositionFlag = policy.composition.operator === "AND" ? 0 : 1;

  return encodeAbiParameters(
    parseAbiParameters("uint8 composition, bytes[] rules"),
    [compositionFlag, encodedRules]
  );
}

export function decodePolicy(encoded: Hex): { composition: "AND" | "OR"; rules: Hex[] } {
  const [compositionFlag, rules] = decodeAbiParameters(
    parseAbiParameters("uint8 composition, bytes[] rules"),
    encoded
  );

  return {
    composition: compositionFlag === 0 ? "AND" : "OR",
    rules: rules as Hex[],
  };
}

export function computePolicyId(rules: PolicyRule[]): Hex {
  const encodedRules = rules.map(encodePolicyRule);
  const packed = encodePacked(
    ["bytes[]"],
    [encodedRules]
  );
  return keccak256(packed);
}

export function encodeSessionKeyData(
  sessionPublicKey: Address,
  validAfter: number,
  validUntil: number,
  policyData: Hex
): Hex {
  return encodeAbiParameters(
    parseAbiParameters("address sessionKey, uint48 validAfter, uint48 validUntil, bytes policyData"),
    [sessionPublicKey, validAfter, validUntil, policyData]
  );
}

export function encodeGuardianData(guardians: Address[], threshold: number): Hex {
  return encodeAbiParameters(
    parseAbiParameters("address[] guardians, uint8 threshold"),
    [guardians, threshold]
  );
}

export function encodeBridgeData(
  sourceChain: number,
  destChain: number,
  token: Address,
  amount: bigint,
  recipient: Address
): Hex {
  return encodeAbiParameters(
    parseAbiParameters("uint32 sourceChain, uint32 destChain, address token, uint256 amount, address recipient"),
    [sourceChain, destChain, token, amount, recipient]
  );
}

export function generateNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}
