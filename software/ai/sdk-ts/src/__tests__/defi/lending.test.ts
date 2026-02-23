import { describe, it, expect, vi } from "vitest";
import {
  supply,
  borrow,
  repay,
  withdraw,
  getLendingPoolAddress,
} from "../../defi/lending.js";
import { SupportedChain } from "../../types/chain.js";
import type { Address } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockResolvedValue([100n, 50n, 200n, 80n, 75n, 150n]),
    })),
  };
});

const MOCK_ASSET: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_ON_BEHALF_OF: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const MOCK_TO: Address = "0x000000000000000000000000000000000000dEaD";

describe("supply", () => {
  it("returns lending result with calldata", async () => {
    const result = await supply({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 1000000n,
      onBehalfOf: MOCK_ON_BEHALF_OF,
    });
    expect(result.calldata).toMatch(/^0x/);
    expect(result.to).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("throws for invalid asset address", async () => {
    await expect(
      supply({
        chainId: SupportedChain.Base,
        asset: "invalid" as Address,
        amount: 1000000n,
        onBehalfOf: MOCK_ON_BEHALF_OF,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for negative amount", async () => {
    await expect(
      supply({
        chainId: SupportedChain.Base,
        asset: MOCK_ASSET,
        amount: -1n,
        onBehalfOf: MOCK_ON_BEHALF_OF,
      })
    ).rejects.toThrow("must be non-negative");
  });
});

describe("borrow", () => {
  it("returns lending result with calldata", async () => {
    const result = await borrow({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 500000n,
      onBehalfOf: MOCK_ON_BEHALF_OF,
    });
    expect(result.calldata).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("uses default interest rate mode 2", async () => {
    const result = await borrow({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 500000n,
      onBehalfOf: MOCK_ON_BEHALF_OF,
    });
    expect(result.calldata).toBeDefined();
  });

  it("accepts custom interest rate mode", async () => {
    const result = await borrow({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 500000n,
      onBehalfOf: MOCK_ON_BEHALF_OF,
      interestRateMode: 1,
    });
    expect(result.calldata).toBeDefined();
  });

  it("throws for invalid asset", async () => {
    await expect(
      borrow({
        chainId: SupportedChain.Base,
        asset: "invalid" as Address,
        amount: 500000n,
        onBehalfOf: MOCK_ON_BEHALF_OF,
      })
    ).rejects.toThrow("Invalid address");
  });
});

describe("repay", () => {
  it("returns lending result with calldata", async () => {
    const result = await repay({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 500000n,
      onBehalfOf: MOCK_ON_BEHALF_OF,
    });
    expect(result.calldata).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("throws for invalid onBehalfOf", async () => {
    await expect(
      repay({
        chainId: SupportedChain.Base,
        asset: MOCK_ASSET,
        amount: 500000n,
        onBehalfOf: "invalid" as Address,
      })
    ).rejects.toThrow("Invalid address");
  });
});

describe("withdraw", () => {
  it("returns lending result with calldata", async () => {
    const result = await withdraw(SupportedChain.Base, MOCK_ASSET, 500000n, MOCK_TO);
    expect(result.calldata).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("throws for invalid asset", async () => {
    await expect(
      withdraw(SupportedChain.Base, "invalid" as Address, 500000n, MOCK_TO)
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid recipient", async () => {
    await expect(
      withdraw(SupportedChain.Base, MOCK_ASSET, 500000n, "invalid" as Address)
    ).rejects.toThrow("Invalid address");
  });

  it("throws for negative amount", async () => {
    await expect(
      withdraw(SupportedChain.Base, MOCK_ASSET, -1n, MOCK_TO)
    ).rejects.toThrow("must be non-negative");
  });
});

describe("getLendingPoolAddress", () => {
  it("returns addresses for supported chains", () => {
    expect(getLendingPoolAddress(SupportedChain.Base)).toMatch(/^0x/);
    expect(getLendingPoolAddress(SupportedChain.Arbitrum)).toMatch(/^0x/);
  });

  it("throws for unsupported chain", () => {
    expect(() => getLendingPoolAddress(999 as SupportedChain)).toThrow("No lending pool");
  });
});
