import { describe, it, expect } from "vitest";
import {
  createSpendingLimit,
  createEthSpendingLimit,
  createUsdcSpendingLimit,
} from "../../policy/spending.js";
import type { Address } from "viem";

const MOCK_TOKEN: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("createSpendingLimit", () => {
  it("creates a spending limit with valid params", () => {
    const result = createSpendingLimit({
      tokenAddress: MOCK_TOKEN,
      maxPerTransaction: 100n,
      maxDaily: 1000n,
      maxWeekly: 10000n,
    });
    expect(result.type).toBe("spending");
    expect(result.maxPerTransaction).toBe(100n);
    expect(result.maxDaily).toBe(1000n);
    expect(result.maxWeekly).toBe(10000n);
    expect(result.tokenAddress).toBe(MOCK_TOKEN);
  });

  it("allows equal maxPerTransaction and maxDaily", () => {
    const result = createSpendingLimit({
      tokenAddress: MOCK_TOKEN,
      maxPerTransaction: 100n,
      maxDaily: 100n,
      maxWeekly: 200n,
    });
    expect(result.maxPerTransaction).toBe(100n);
    expect(result.maxDaily).toBe(100n);
  });

  it("allows equal maxDaily and maxWeekly", () => {
    const result = createSpendingLimit({
      tokenAddress: MOCK_TOKEN,
      maxPerTransaction: 50n,
      maxDaily: 100n,
      maxWeekly: 100n,
    });
    expect(result.maxDaily).toBe(100n);
    expect(result.maxWeekly).toBe(100n);
  });

  it("throws when maxPerTransaction exceeds maxDaily", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: MOCK_TOKEN,
        maxPerTransaction: 1001n,
        maxDaily: 1000n,
        maxWeekly: 10000n,
      })
    ).toThrow("maxPerTransaction cannot exceed maxDaily");
  });

  it("throws when maxDaily exceeds maxWeekly", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: MOCK_TOKEN,
        maxPerTransaction: 100n,
        maxDaily: 10001n,
        maxWeekly: 10000n,
      })
    ).toThrow("maxDaily cannot exceed maxWeekly");
  });

  it("throws for an invalid token address", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: "invalid" as Address,
        maxPerTransaction: 100n,
        maxDaily: 1000n,
        maxWeekly: 10000n,
      })
    ).toThrow("Invalid address");
  });

  it("throws for a negative maxPerTransaction", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: MOCK_TOKEN,
        maxPerTransaction: -1n,
        maxDaily: 1000n,
        maxWeekly: 10000n,
      })
    ).toThrow("must be non-negative");
  });

  it("throws for a negative maxDaily", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: MOCK_TOKEN,
        maxPerTransaction: 100n,
        maxDaily: -1n,
        maxWeekly: 10000n,
      })
    ).toThrow("must be non-negative");
  });

  it("throws for a negative maxWeekly", () => {
    expect(() =>
      createSpendingLimit({
        tokenAddress: MOCK_TOKEN,
        maxPerTransaction: 100n,
        maxDaily: 1000n,
        maxWeekly: -1n,
      })
    ).toThrow("must be non-negative");
  });

  it("accepts zero values for all limits", () => {
    const result = createSpendingLimit({
      tokenAddress: MOCK_TOKEN,
      maxPerTransaction: 0n,
      maxDaily: 0n,
      maxWeekly: 0n,
    });
    expect(result.maxPerTransaction).toBe(0n);
  });
});

describe("createEthSpendingLimit", () => {
  it("uses the ETH sentinel address", () => {
    const result = createEthSpendingLimit(100n, 1000n, 10000n);
    expect(result.tokenAddress).toBe("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    expect(result.type).toBe("spending");
  });

  it("passes amounts correctly", () => {
    const result = createEthSpendingLimit(1n, 2n, 3n);
    expect(result.maxPerTransaction).toBe(1n);
    expect(result.maxDaily).toBe(2n);
    expect(result.maxWeekly).toBe(3n);
  });

  it("throws when maxPerTransaction exceeds maxDaily", () => {
    expect(() => createEthSpendingLimit(200n, 100n, 300n)).toThrow(
      "maxPerTransaction cannot exceed maxDaily"
    );
  });
});

describe("createUsdcSpendingLimit", () => {
  it("uses the provided USDC address", () => {
    const result = createUsdcSpendingLimit(100n, 1000n, 10000n, MOCK_TOKEN);
    expect(result.tokenAddress).toBe(MOCK_TOKEN);
    expect(result.type).toBe("spending");
  });

  it("passes amounts correctly", () => {
    const result = createUsdcSpendingLimit(5n, 50n, 500n, MOCK_TOKEN);
    expect(result.maxPerTransaction).toBe(5n);
    expect(result.maxDaily).toBe(50n);
    expect(result.maxWeekly).toBe(500n);
  });
});
