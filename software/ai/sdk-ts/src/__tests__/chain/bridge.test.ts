import { describe, it, expect, vi } from "vitest";
import { bridgeTokens, estimateBridgeFee } from "../../chain/bridge.js";
import { SupportedChain } from "../../types/chain.js";
import type { Address } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockRejectedValue(new Error("mock")),
    })),
  };
});

const MOCK_TOKEN: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_RECIPIENT: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const NATIVE_TOKEN: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

describe("bridgeTokens", () => {
  it("returns bridge result for ERC20 token", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
    });

    expect(result.calldata).toMatch(/^0x/);
    expect(result.to).toMatch(/^0x/);
    expect(typeof result.value).toBe("bigint");
    expect(result.estimatedTime).toBeGreaterThan(0);
    expect(result.bridgeData).toMatch(/^0x/);
  });

  it("sets value to include amount for native token", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: NATIVE_TOKEN,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
    });

    expect(result.value).toBeGreaterThan(1000000n - 1n);
  });

  it("sets value to only fee for ERC20 token", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 1000000n,
      recipient: MOCK_RECIPIENT,
    });

    expect(result.value).toBeLessThan(1000000n);
  });

  it("throws when source and destination chains are the same", async () => {
    await expect(
      bridgeTokens({
        sourceChain: SupportedChain.Base,
        destinationChain: SupportedChain.Base,
        token: MOCK_TOKEN,
        amount: 1000000n,
        recipient: MOCK_RECIPIENT,
      })
    ).rejects.toThrow("Source and destination chains must be different");
  });

  it("throws for invalid token address", async () => {
    await expect(
      bridgeTokens({
        sourceChain: SupportedChain.Base,
        destinationChain: SupportedChain.Arbitrum,
        token: "invalid" as Address,
        amount: 1000000n,
        recipient: MOCK_RECIPIENT,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid recipient address", async () => {
    await expect(
      bridgeTokens({
        sourceChain: SupportedChain.Base,
        destinationChain: SupportedChain.Arbitrum,
        token: MOCK_TOKEN,
        amount: 1000000n,
        recipient: "invalid" as Address,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for negative amount", async () => {
    await expect(
      bridgeTokens({
        sourceChain: SupportedChain.Base,
        destinationChain: SupportedChain.Arbitrum,
        token: MOCK_TOKEN,
        amount: -1n,
        recipient: MOCK_RECIPIENT,
      })
    ).rejects.toThrow("must be non-negative");
  });

  it("uses default slippage of 50bps", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 10000n,
      recipient: MOCK_RECIPIENT,
    });
    expect(result.calldata).toBeDefined();
  });

  it("uses custom slippage", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 10000n,
      recipient: MOCK_RECIPIENT,
      maxSlippageBps: 100,
    });
    expect(result.calldata).toBeDefined();
  });

  it("estimates bridge time for testnet", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.BaseSepolia,
      destinationChain: SupportedChain.ArbitrumSepolia,
      token: MOCK_TOKEN,
      amount: 10000n,
      recipient: MOCK_RECIPIENT,
    });
    expect(result.estimatedTime).toBe(300);
  });

  it("estimates bridge time for mainnet Base to Arbitrum", async () => {
    const result = await bridgeTokens({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 10000n,
      recipient: MOCK_RECIPIENT,
    });
    expect(result.estimatedTime).toBe(120);
  });
});

describe("estimateBridgeFee", () => {
  it("returns a fallback fee when contract call fails", async () => {
    const fee = await estimateBridgeFee({
      sourceChain: SupportedChain.Base,
      destinationChain: SupportedChain.Arbitrum,
      token: MOCK_TOKEN,
      amount: 1000000n,
    });
    expect(fee).toBe(1000n);
  });
});
