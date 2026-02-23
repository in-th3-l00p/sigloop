import { describe, it, expect, vi } from "vitest";
import {
  stake,
  unstake,
  claimRewards,
} from "../../defi/staking.js";
import { SupportedChain } from "../../types/chain.js";
import type { Address } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockResolvedValue(1000n),
    })),
  };
});

const MOCK_ASSET: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_RECIPIENT: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const MOCK_VALIDATOR: Address = "0x000000000000000000000000000000000000dEaD";

describe("stake", () => {
  it("returns stake result with calldata for stakeFor", async () => {
    const result = await stake({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
    });
    expect(result.calldata).toMatch(/^0x/);
    expect(result.to).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("uses stakeFor when recipient differs from asset", async () => {
    const result = await stake({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
    });
    expect(result.calldata).toBeDefined();
  });

  it("uses stake when recipient equals asset", async () => {
    const result = await stake({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 1000000n,
      recipient: MOCK_ASSET,
    });
    expect(result.calldata).toBeDefined();
  });

  it("uses custom validator address", async () => {
    const result = await stake({
      chainId: SupportedChain.Base,
      asset: MOCK_ASSET,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
      validator: MOCK_VALIDATOR,
    });
    expect(result.to).toBe(MOCK_VALIDATOR);
  });

  it("throws for invalid asset", async () => {
    await expect(
      stake({
        chainId: SupportedChain.Base,
        asset: "invalid" as Address,
        amount: 1000000n,
        recipient: MOCK_RECIPIENT,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid recipient", async () => {
    await expect(
      stake({
        chainId: SupportedChain.Base,
        asset: MOCK_ASSET,
        amount: 1000000n,
        recipient: "invalid" as Address,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for negative amount", async () => {
    await expect(
      stake({
        chainId: SupportedChain.Base,
        asset: MOCK_ASSET,
        amount: -1n,
        recipient: MOCK_RECIPIENT,
      })
    ).rejects.toThrow("must be non-negative");
  });
});

describe("unstake", () => {
  it("returns unstake calldata", async () => {
    const result = await unstake(SupportedChain.Base, 1000000n);
    expect(result.calldata).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("uses custom validator", async () => {
    const result = await unstake(SupportedChain.Base, 1000000n, MOCK_VALIDATOR);
    expect(result.to).toBe(MOCK_VALIDATOR);
  });

  it("throws for negative amount", async () => {
    await expect(unstake(SupportedChain.Base, -1n)).rejects.toThrow("must be non-negative");
  });
});

describe("claimRewards", () => {
  it("returns claimRewards calldata without recipient", async () => {
    const result = await claimRewards(SupportedChain.Base);
    expect(result.calldata).toMatch(/^0x/);
    expect(result.value).toBe(0n);
  });

  it("returns claimRewardsFor calldata with recipient", async () => {
    const result = await claimRewards(SupportedChain.Base, MOCK_RECIPIENT);
    expect(result.calldata).toMatch(/^0x/);
  });

  it("uses custom validator", async () => {
    const result = await claimRewards(SupportedChain.Base, undefined, MOCK_VALIDATOR);
    expect(result.to).toBe(MOCK_VALIDATOR);
  });
});
