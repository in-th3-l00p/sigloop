import type { Hex } from "viem";
import type { Policy, PolicyRule, PolicyComposition } from "../types/policy.js";
import { encodePolicy, computePolicyId } from "../utils/encoding.js";
import { validatePolicy } from "../utils/validation.js";

export function composePolicy(
  rules: PolicyRule[],
  operator: "AND" | "OR" = "AND"
): Policy {
  if (rules.length === 0) {
    throw new Error("Cannot compose an empty policy");
  }

  const composition: PolicyComposition = {
    operator,
    rules,
  };

  const id = computePolicyId(rules);

  const policy: Policy = {
    id,
    rules,
    composition,
    encoded: "0x" as Hex,
  };

  policy.encoded = encodePolicy(policy);

  validatePolicy(policy);

  return policy;
}

export function extendPolicy(
  existing: Policy,
  additionalRules: PolicyRule[],
  operator?: "AND" | "OR"
): Policy {
  const allRules = [...existing.rules, ...additionalRules];
  return composePolicy(allRules, operator ?? existing.composition.operator);
}

export function intersectPolicies(a: Policy, b: Policy): Policy {
  const combinedRules = [...a.rules, ...b.rules];
  return composePolicy(combinedRules, "AND");
}

export function unionPolicies(a: Policy, b: Policy): Policy {
  const combinedRules = [...a.rules, ...b.rules];
  return composePolicy(combinedRules, "OR");
}

export function removeRulesByType(
  policy: Policy,
  ruleType: PolicyRule["type"]
): Policy {
  const remaining = policy.rules.filter((r) => r.type !== ruleType);
  if (remaining.length === 0) {
    throw new Error("Cannot remove all rules from a policy");
  }
  return composePolicy(remaining, policy.composition.operator);
}

export function getRulesByType<T extends PolicyRule["type"]>(
  policy: Policy,
  ruleType: T
): Extract<PolicyRule, { type: T }>[] {
  return policy.rules.filter((r): r is Extract<PolicyRule, { type: T }> => r.type === ruleType);
}
