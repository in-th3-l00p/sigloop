import { describe, it, expect, vi } from "vitest";
import { selectOptimalChain, getChainGasPrice, isChainHealthy } from "../../chain/router.js";
import { SupportedChain } from "../../types/chain.js";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getGasPrice: vi.fn().mockResolvedValue(1000000000n),
      getBlockNumber: vi.fn().mockResolvedValue(12345678n),
    })),
  };
});

describe("selectOptimalChain", () => {
  it("returns a chain config for default candidates", async () => {
    const config = await selectOptimalChain();
    expect(config).toBeDefined();
    expect(config.chainId).toBeDefined();
  });

  it("selects from provided candidates", async () => {
    const config = await selectOptimalChain([SupportedChain.Base]);
    expect(config.chainId).toBe(SupportedChain.Base);
  });

  it("accepts cost priority", async () => {
    const config = await selectOptimalChain(undefined, { prioritize: "cost" });
    expect(config).toBeDefined();
  });

  it("accepts speed priority", async () => {
    const config = await selectOptimalChain(undefined, { prioritize: "speed" });
    expect(config).toBeDefined();
  });

  it("accepts balanced priority", async () => {
    const config = await selectOptimalChain(undefined, { prioritize: "balanced" });
    expect(config).toBeDefined();
  });
});

describe("getChainGasPrice", () => {
  it("returns a gas price", async () => {
    const price = await getChainGasPrice(SupportedChain.Base);
    expect(price).toBe(1000000000n);
  });
});

describe("isChainHealthy", () => {
  it("returns true for a healthy chain", async () => {
    const healthy = await isChainHealthy(SupportedChain.Base);
    expect(healthy).toBe(true);
  });
});
