import { type Address, type Hex, isAddress, isHex } from "viem";
import type { Policy, PolicyRule } from "../types/policy.js";

export function validateAddress(address: string): address is Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return true;
}

export function validateAmount(amount: bigint, label: string = "amount"): void {
  if (amount < 0n) {
    throw new Error(`${label} must be non-negative, got ${amount}`);
  }
}

export function validateHex(value: string): value is Hex {
  if (!isHex(value)) {
    throw new Error(`Invalid hex value: ${value}`);
  }
  return true;
}

export function validatePolicy(policy: Policy): void {
  if (!policy.rules || policy.rules.length === 0) {
    throw new Error("Policy must have at least one rule");
  }

  if (!policy.composition) {
    throw new Error("Policy must have a composition");
  }

  if (!["AND", "OR"].includes(policy.composition.operator)) {
    throw new Error(`Invalid composition operator: ${policy.composition.operator}`);
  }

  for (const rule of policy.rules) {
    validatePolicyRule(rule);
  }
}

function validatePolicyRule(rule: PolicyRule): void {
  switch (rule.type) {
    case "spending":
      validateAmount(rule.maxPerTransaction, "maxPerTransaction");
      validateAmount(rule.maxDaily, "maxDaily");
      validateAmount(rule.maxWeekly, "maxWeekly");
      validateAddress(rule.tokenAddress);
      break;
    case "contract-allowlist":
      if (rule.addresses.length === 0) {
        throw new Error("Contract allowlist must have at least one address");
      }
      rule.addresses.forEach(validateAddress);
      break;
    case "function-allowlist":
      validateAddress(rule.contract);
      if (rule.selectors.length === 0) {
        throw new Error("Function allowlist must have at least one selector");
      }
      rule.selectors.forEach(validateHex);
      break;
    case "time-window":
      if (rule.validAfter >= rule.validUntil) {
        throw new Error("validAfter must be before validUntil");
      }
      break;
    case "rate-limit":
      if (rule.maxCalls <= 0) {
        throw new Error("maxCalls must be positive");
      }
      if (rule.intervalSeconds <= 0) {
        throw new Error("intervalSeconds must be positive");
      }
      break;
    default:
      throw new Error(`Unknown policy rule type: ${(rule as PolicyRule).type}`);
  }
}

export function validateChainId(chainId: number): void {
  const validChains = [8453, 42161, 84532, 421614];
  if (!validChains.includes(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${validChains.join(", ")}`);
  }
}

export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}
