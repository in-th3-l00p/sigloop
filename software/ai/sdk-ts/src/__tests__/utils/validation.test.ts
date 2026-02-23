import { describe, it, expect } from "vitest";
import {
  validateAddress,
  validateAmount,
  validateHex,
  validatePolicy,
  validateChainId,
  validateUrl,
} from "../../utils/validation.js";
import type { Policy } from "../../types/policy.js";

describe("validateAddress", () => {
  it("accepts a valid checksummed address", () => {
    expect(validateAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")).toBe(true);
  });

  it("accepts a valid lowercase address", () => {
    expect(validateAddress("0x000000000000000000000000000000000000dead")).toBe(true);
  });

  it("throws for an empty string", () => {
    expect(() => validateAddress("")).toThrow("Invalid address");
  });

  it("throws for a non-hex string", () => {
    expect(() => validateAddress("not-an-address")).toThrow("Invalid address");
  });

  it("throws for an address that is too short", () => {
    expect(() => validateAddress("0x1234")).toThrow("Invalid address");
  });

  it("throws for an address that is too long", () => {
    expect(() => validateAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045FF")).toThrow("Invalid address");
  });
});

describe("validateAmount", () => {
  it("accepts zero", () => {
    expect(() => validateAmount(0n)).not.toThrow();
  });

  it("accepts a positive amount", () => {
    expect(() => validateAmount(1000000n)).not.toThrow();
  });

  it("throws for a negative amount", () => {
    expect(() => validateAmount(-1n)).toThrow("must be non-negative");
  });

  it("includes the label in the error message", () => {
    expect(() => validateAmount(-5n, "transfer")).toThrow("transfer must be non-negative");
  });

  it("uses default label when none provided", () => {
    expect(() => validateAmount(-1n)).toThrow("amount must be non-negative");
  });
});

describe("validateHex", () => {
  it("accepts a valid hex string", () => {
    expect(validateHex("0xdeadbeef")).toBe(true);
  });

  it("accepts 0x alone", () => {
    expect(validateHex("0x")).toBe(true);
  });

  it("throws for a non-hex string", () => {
    expect(() => validateHex("hello")).toThrow("Invalid hex value");
  });

  it("throws for a missing 0x prefix", () => {
    expect(() => validateHex("deadbeef")).toThrow("Invalid hex value");
  });
});

describe("validatePolicy", () => {
  const validPolicy: Policy = {
    id: "0xabc123" as `0x${string}`,
    rules: [
      {
        type: "rate-limit",
        maxCalls: 10,
        intervalSeconds: 60,
      },
    ],
    composition: {
      operator: "AND",
      rules: [
        {
          type: "rate-limit",
          maxCalls: 10,
          intervalSeconds: 60,
        },
      ],
    },
    encoded: "0x" as `0x${string}`,
  };

  it("accepts a valid policy", () => {
    expect(() => validatePolicy(validPolicy)).not.toThrow();
  });

  it("throws when rules array is empty", () => {
    expect(() =>
      validatePolicy({ ...validPolicy, rules: [] })
    ).toThrow("Policy must have at least one rule");
  });

  it("throws when composition is missing", () => {
    expect(() =>
      validatePolicy({ ...validPolicy, composition: undefined as any })
    ).toThrow("Policy must have a composition");
  });

  it("throws when composition operator is invalid", () => {
    expect(() =>
      validatePolicy({
        ...validPolicy,
        composition: { ...validPolicy.composition, operator: "XOR" as any },
      })
    ).toThrow("Invalid composition operator");
  });

  it("validates each rule in the policy", () => {
    const badPolicy: Policy = {
      ...validPolicy,
      rules: [
        {
          type: "rate-limit",
          maxCalls: -1,
          intervalSeconds: 60,
        },
      ],
    };
    expect(() => validatePolicy(badPolicy)).toThrow("maxCalls must be positive");
  });

  it("validates spending rule addresses", () => {
    const badPolicy: Policy = {
      ...validPolicy,
      rules: [
        {
          type: "spending",
          maxPerTransaction: 100n,
          maxDaily: 1000n,
          maxWeekly: 10000n,
          tokenAddress: "invalid" as any,
        },
      ],
    };
    expect(() => validatePolicy(badPolicy)).toThrow("Invalid address");
  });

  it("validates contract-allowlist has addresses", () => {
    const badPolicy: Policy = {
      ...validPolicy,
      rules: [
        {
          type: "contract-allowlist",
          addresses: [],
        },
      ],
    };
    expect(() => validatePolicy(badPolicy)).toThrow("at least one address");
  });

  it("validates function-allowlist has selectors", () => {
    const badPolicy: Policy = {
      ...validPolicy,
      rules: [
        {
          type: "function-allowlist",
          contract: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          selectors: [],
        },
      ],
    };
    expect(() => validatePolicy(badPolicy)).toThrow("at least one selector");
  });

  it("validates time-window ordering", () => {
    const badPolicy: Policy = {
      ...validPolicy,
      rules: [
        {
          type: "time-window",
          validAfter: 2000,
          validUntil: 1000,
        },
      ],
    };
    expect(() => validatePolicy(badPolicy)).toThrow("validAfter must be before validUntil");
  });
});

describe("validateChainId", () => {
  it("accepts Base chain id", () => {
    expect(() => validateChainId(8453)).not.toThrow();
  });

  it("accepts Arbitrum chain id", () => {
    expect(() => validateChainId(42161)).not.toThrow();
  });

  it("accepts BaseSepolia chain id", () => {
    expect(() => validateChainId(84532)).not.toThrow();
  });

  it("accepts ArbitrumSepolia chain id", () => {
    expect(() => validateChainId(421614)).not.toThrow();
  });

  it("throws for an unsupported chain id", () => {
    expect(() => validateChainId(1)).toThrow("Unsupported chain ID: 1");
  });

  it("throws for chain id zero", () => {
    expect(() => validateChainId(0)).toThrow("Unsupported chain ID");
  });
});

describe("validateUrl", () => {
  it("accepts a valid https URL", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
  });

  it("accepts a valid http URL", () => {
    expect(() => validateUrl("http://localhost:3000")).not.toThrow();
  });

  it("throws for an invalid URL", () => {
    expect(() => validateUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("throws for an empty string", () => {
    expect(() => validateUrl("")).toThrow("Invalid URL");
  });
});
