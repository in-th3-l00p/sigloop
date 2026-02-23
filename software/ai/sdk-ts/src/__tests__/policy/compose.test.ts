import { describe, it, expect } from "vitest";
import {
  composePolicy,
  extendPolicy,
  intersectPolicies,
  unionPolicies,
  removeRulesByType,
  getRulesByType,
} from "../../policy/compose.js";
import type { PolicyRule } from "../../types/policy.js";
import type { Address, Hex } from "viem";

const MOCK_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

const rateLimitRule: PolicyRule = {
  type: "rate-limit",
  maxCalls: 10,
  intervalSeconds: 60,
};

const timeWindowRule: PolicyRule = {
  type: "time-window",
  validAfter: 1000,
  validUntil: 9999999999,
};

const contractRule: PolicyRule = {
  type: "contract-allowlist",
  addresses: [MOCK_ADDRESS],
};

const spendingRule: PolicyRule = {
  type: "spending",
  maxPerTransaction: 100n,
  maxDaily: 1000n,
  maxWeekly: 10000n,
  tokenAddress: MOCK_ADDRESS,
};

describe("composePolicy", () => {
  it("creates a policy with AND composition by default", () => {
    const policy = composePolicy([rateLimitRule]);
    expect(policy.composition.operator).toBe("AND");
    expect(policy.rules).toHaveLength(1);
    expect(policy.id).toMatch(/^0x/);
    expect(policy.encoded).toMatch(/^0x/);
    expect(policy.encoded.length).toBeGreaterThan(2);
  });

  it("creates a policy with OR composition", () => {
    const policy = composePolicy([rateLimitRule], "OR");
    expect(policy.composition.operator).toBe("OR");
  });

  it("handles multiple rules", () => {
    const policy = composePolicy([rateLimitRule, timeWindowRule, contractRule]);
    expect(policy.rules).toHaveLength(3);
  });

  it("throws for empty rules array", () => {
    expect(() => composePolicy([])).toThrow("Cannot compose an empty policy");
  });

  it("encodes the policy and sets the encoded field", () => {
    const policy = composePolicy([rateLimitRule]);
    expect(policy.encoded).not.toBe("0x");
    expect(policy.encoded.length).toBeGreaterThan(10);
  });

  it("computes a deterministic id", () => {
    const a = composePolicy([rateLimitRule]);
    const b = composePolicy([rateLimitRule]);
    expect(a.id).toBe(b.id);
  });

  it("computes different ids for different rules", () => {
    const a = composePolicy([rateLimitRule]);
    const b = composePolicy([timeWindowRule]);
    expect(a.id).not.toBe(b.id);
  });
});

describe("extendPolicy", () => {
  it("adds rules to an existing policy", () => {
    const base = composePolicy([rateLimitRule]);
    const extended = extendPolicy(base, [timeWindowRule]);
    expect(extended.rules).toHaveLength(2);
  });

  it("preserves the original operator if none specified", () => {
    const base = composePolicy([rateLimitRule], "OR");
    const extended = extendPolicy(base, [contractRule]);
    expect(extended.composition.operator).toBe("OR");
  });

  it("overrides the operator when specified", () => {
    const base = composePolicy([rateLimitRule], "AND");
    const extended = extendPolicy(base, [contractRule], "OR");
    expect(extended.composition.operator).toBe("OR");
  });
});

describe("intersectPolicies", () => {
  it("combines rules from two policies with AND", () => {
    const a = composePolicy([rateLimitRule]);
    const b = composePolicy([timeWindowRule]);
    const result = intersectPolicies(a, b);
    expect(result.rules).toHaveLength(2);
    expect(result.composition.operator).toBe("AND");
  });
});

describe("unionPolicies", () => {
  it("combines rules from two policies with OR", () => {
    const a = composePolicy([rateLimitRule]);
    const b = composePolicy([timeWindowRule]);
    const result = unionPolicies(a, b);
    expect(result.rules).toHaveLength(2);
    expect(result.composition.operator).toBe("OR");
  });
});

describe("removeRulesByType", () => {
  it("removes rules of the specified type", () => {
    const policy = composePolicy([rateLimitRule, timeWindowRule, contractRule]);
    const result = removeRulesByType(policy, "rate-limit");
    expect(result.rules).toHaveLength(2);
    expect(result.rules.every((r) => r.type !== "rate-limit")).toBe(true);
  });

  it("throws when removing all rules", () => {
    const policy = composePolicy([rateLimitRule]);
    expect(() => removeRulesByType(policy, "rate-limit")).toThrow(
      "Cannot remove all rules from a policy"
    );
  });

  it("returns unchanged policy when type is not present", () => {
    const policy = composePolicy([rateLimitRule, contractRule]);
    const result = removeRulesByType(policy, "time-window");
    expect(result.rules).toHaveLength(2);
  });
});

describe("getRulesByType", () => {
  it("returns only rules of the specified type", () => {
    const policy = composePolicy([rateLimitRule, timeWindowRule, contractRule]);
    const result = getRulesByType(policy, "rate-limit");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("rate-limit");
  });

  it("returns empty array when no rules match", () => {
    const policy = composePolicy([rateLimitRule]);
    const result = getRulesByType(policy, "time-window");
    expect(result).toHaveLength(0);
  });

  it("returns multiple rules of same type", () => {
    const rule2: PolicyRule = { type: "rate-limit", maxCalls: 5, intervalSeconds: 120 };
    const policy = composePolicy([rateLimitRule, rule2, contractRule]);
    const result = getRulesByType(policy, "rate-limit");
    expect(result).toHaveLength(2);
  });
});
