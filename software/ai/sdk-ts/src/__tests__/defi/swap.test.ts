import { describe, it, expect, vi } from "vitest";
import {
  executeSwap,
  buildApproveCalldata,
  getSwapRouterAddress,
} from "../../defi/swap.js";
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

const TOKEN_IN: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const TOKEN_OUT: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const RECIPIENT: Address = "0x000000000000000000000000000000000000dEaD";
const NATIVE_TOKEN: Address = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

describe("executeSwap", () => {
  it("returns swap result for ERC20 swap", async () => {
    const result = await executeSwap({
      chainId: SupportedChain.Base,
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amountIn: 1000000n,
      minAmountOut: 900000n,
      recipient: RECIPIENT,
    });

    expect(result.calldata).toMatch(/^0x/);
    expect(result.to).toMatch(/^0x/);
    expect(result.value).toBe(0n);
    expect(result.amountOut).toBe(900000n);
  });

  it("sets value for native token input", async () => {
    const result = await executeSwap({
      chainId: SupportedChain.Base,
      tokenIn: NATIVE_TOKEN,
      tokenOut: TOKEN_OUT,
      amountIn: 1000000n,
      minAmountOut: 900000n,
      recipient: RECIPIENT,
    });

    expect(result.value).toBe(1000000n);
  });

  it("throws for invalid tokenIn address", async () => {
    await expect(
      executeSwap({
        chainId: SupportedChain.Base,
        tokenIn: "invalid" as Address,
        tokenOut: TOKEN_OUT,
        amountIn: 1000000n,
        minAmountOut: 900000n,
        recipient: RECIPIENT,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid tokenOut address", async () => {
    await expect(
      executeSwap({
        chainId: SupportedChain.Base,
        tokenIn: TOKEN_IN,
        tokenOut: "invalid" as Address,
        amountIn: 1000000n,
        minAmountOut: 900000n,
        recipient: RECIPIENT,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid recipient address", async () => {
    await expect(
      executeSwap({
        chainId: SupportedChain.Base,
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1000000n,
        minAmountOut: 900000n,
        recipient: "invalid" as Address,
      })
    ).rejects.toThrow("Invalid address");
  });

  it("throws for negative amountIn", async () => {
    await expect(
      executeSwap({
        chainId: SupportedChain.Base,
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: -1n,
        minAmountOut: 900000n,
        recipient: RECIPIENT,
      })
    ).rejects.toThrow("must be non-negative");
  });

  it("throws for negative minAmountOut", async () => {
    await expect(
      executeSwap({
        chainId: SupportedChain.Base,
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1000000n,
        minAmountOut: -1n,
        recipient: RECIPIENT,
      })
    ).rejects.toThrow("must be non-negative");
  });

  it("works for all supported chains", async () => {
    for (const chain of [
      SupportedChain.Base,
      SupportedChain.Arbitrum,
      SupportedChain.BaseSepolia,
      SupportedChain.ArbitrumSepolia,
    ]) {
      const result = await executeSwap({
        chainId: chain,
        tokenIn: TOKEN_IN,
        tokenOut: TOKEN_OUT,
        amountIn: 1000n,
        minAmountOut: 900n,
        recipient: RECIPIENT,
      });
      expect(result.calldata).toMatch(/^0x/);
    }
  });
});

describe("buildApproveCalldata", () => {
  it("returns calldata and target address", () => {
    const result = buildApproveCalldata(TOKEN_IN, RECIPIENT, 1000000n);
    expect(result.calldata).toMatch(/^0x/);
    expect(result.to).toBe(TOKEN_IN);
  });

  it("throws for invalid token address", () => {
    expect(() => buildApproveCalldata("invalid" as Address, RECIPIENT, 1000000n)).toThrow(
      "Invalid address"
    );
  });

  it("throws for invalid spender address", () => {
    expect(() => buildApproveCalldata(TOKEN_IN, "invalid" as Address, 1000000n)).toThrow(
      "Invalid address"
    );
  });
});

describe("getSwapRouterAddress", () => {
  it("returns addresses for all supported chains", () => {
    expect(getSwapRouterAddress(SupportedChain.Base)).toMatch(/^0x/);
    expect(getSwapRouterAddress(SupportedChain.Arbitrum)).toMatch(/^0x/);
    expect(getSwapRouterAddress(SupportedChain.BaseSepolia)).toMatch(/^0x/);
    expect(getSwapRouterAddress(SupportedChain.ArbitrumSepolia)).toMatch(/^0x/);
  });

  it("throws for unsupported chain", () => {
    expect(() => getSwapRouterAddress(999 as SupportedChain)).toThrow("No swap router");
  });
});
