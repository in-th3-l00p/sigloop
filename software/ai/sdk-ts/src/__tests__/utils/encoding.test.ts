import { describe, it, expect } from "vitest";
import {
  encodePolicy,
  decodePolicy,
  computePolicyId,
  encodeSessionKeyData,
  encodeGuardianData,
  encodeBridgeData,
  generateNonce,
} from "../../utils/encoding.js";
import type { Policy, PolicyRule } from "../../types/policy.js";
import type { Address, Hex } from "viem";

const MOCK_ADDRESS: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const MOCK_ADDRESS_2: Address = "0x000000000000000000000000000000000000dEaD";

describe("encodePolicy", () => {
  it("encodes a policy with AND composition", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
    expect(encoded.length).toBeGreaterThan(2);
  });

  it("encodes a policy with OR composition", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
      ],
      composition: { operator: "OR", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });

  it("encodes a spending limit rule", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        {
          type: "spending",
          maxPerTransaction: 100n,
          maxDaily: 1000n,
          maxWeekly: 10000n,
          tokenAddress: MOCK_ADDRESS,
        },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });

  it("encodes a contract-allowlist rule", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "contract-allowlist", addresses: [MOCK_ADDRESS] },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });

  it("encodes a function-allowlist rule", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        {
          type: "function-allowlist",
          contract: MOCK_ADDRESS,
          selectors: ["0xdeadbeef" as Hex],
        },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });

  it("encodes a time-window rule", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "time-window", validAfter: 1000, validUntil: 2000 },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });

  it("encodes multiple rules", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
        { type: "time-window", validAfter: 1000, validUntil: 2000 },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    expect(encoded).toMatch(/^0x/);
  });
});

describe("decodePolicy", () => {
  it("roundtrips encode and decode for AND composition", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    const decoded = decodePolicy(encoded);
    expect(decoded.composition).toBe("AND");
    expect(decoded.rules).toHaveLength(1);
  });

  it("roundtrips encode and decode for OR composition", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
      ],
      composition: { operator: "OR", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    const decoded = decodePolicy(encoded);
    expect(decoded.composition).toBe("OR");
  });

  it("preserves the number of rules through encode/decode", () => {
    const policy: Policy = {
      id: "0x01" as Hex,
      rules: [
        { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
        { type: "time-window", validAfter: 1000, validUntil: 2000 },
        { type: "contract-allowlist", addresses: [MOCK_ADDRESS] },
      ],
      composition: { operator: "AND", rules: [] },
      encoded: "0x" as Hex,
    };
    const encoded = encodePolicy(policy);
    const decoded = decodePolicy(encoded);
    expect(decoded.rules).toHaveLength(3);
  });
});

describe("computePolicyId", () => {
  it("returns a hex string", () => {
    const rules: PolicyRule[] = [
      { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
    ];
    const id = computePolicyId(rules);
    expect(id).toMatch(/^0x/);
    expect(id.length).toBe(66);
  });

  it("returns deterministic ids for the same rules", () => {
    const rules: PolicyRule[] = [
      { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
    ];
    expect(computePolicyId(rules)).toBe(computePolicyId(rules));
  });

  it("returns different ids for different rules", () => {
    const rules1: PolicyRule[] = [
      { type: "rate-limit", maxCalls: 5, intervalSeconds: 60 },
    ];
    const rules2: PolicyRule[] = [
      { type: "rate-limit", maxCalls: 10, intervalSeconds: 60 },
    ];
    expect(computePolicyId(rules1)).not.toBe(computePolicyId(rules2));
  });
});

describe("encodeSessionKeyData", () => {
  it("returns a hex-encoded string", () => {
    const result = encodeSessionKeyData(
      MOCK_ADDRESS,
      1000,
      2000,
      "0xdeadbeef" as Hex
    );
    expect(result).toMatch(/^0x/);
    expect(result.length).toBeGreaterThan(2);
  });
});

describe("encodeGuardianData", () => {
  it("encodes guardians and threshold", () => {
    const result = encodeGuardianData([MOCK_ADDRESS, MOCK_ADDRESS_2], 2);
    expect(result).toMatch(/^0x/);
    expect(result.length).toBeGreaterThan(2);
  });

  it("encodes a single guardian", () => {
    const result = encodeGuardianData([MOCK_ADDRESS], 1);
    expect(result).toMatch(/^0x/);
  });
});

describe("encodeBridgeData", () => {
  it("encodes bridge parameters", () => {
    const result = encodeBridgeData(
      8453,
      42161,
      MOCK_ADDRESS,
      1000000n,
      MOCK_ADDRESS_2
    );
    expect(result).toMatch(/^0x/);
    expect(result.length).toBeGreaterThan(2);
  });
});

describe("generateNonce", () => {
  it("returns a 32-byte hex string", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^0x/);
    expect(nonce.length).toBe(66);
  });

  it("returns unique values on successive calls", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});
