import { describe, it, expect, vi } from "vitest";
import { SupportedChain } from "../../types/chain.js";
import type { Address } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({})),
    http: vi.fn(() => ({})),
  };
});

vi.mock("viem/account-abstraction", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem/account-abstraction")>();
  return {
    ...actual,
    createBundlerClient: vi.fn(() => ({})),
  };
});

vi.mock("permissionless/accounts", () => ({
  toKernelSmartAccount: vi.fn().mockResolvedValue({
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    type: "smart",
  }),
}));

vi.mock("permissionless/clients", () => ({
  createSmartAccountClient: vi.fn(() => ({})),
}));

const MOCK_OWNER = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  type: "local",
} as any;

import { createWallet, getWalletAddress } from "../../wallet/create.js";

describe("createWallet", () => {
  it("creates a wallet with valid params", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.Base,
      },
    });

    expect(wallet.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(wallet.owner).toBe(MOCK_OWNER);
    expect(wallet.chainId).toBe(SupportedChain.Base);
    expect(wallet.entryPointVersion).toBe("0.7");
    expect(wallet.guardians).toEqual([]);
  });

  it("creates a wallet with custom rpcUrl", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.Base,
        rpcUrl: "https://custom.rpc.io",
      },
    });
    expect(wallet.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("creates a wallet with custom index", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.Base,
        index: 5n,
      },
    });
    expect(wallet.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("creates a wallet on Arbitrum", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.Arbitrum,
      },
    });
    expect(wallet.chainId).toBe(SupportedChain.Arbitrum);
  });

  it("creates a wallet with paymaster url", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.Base,
        paymasterUrl: "https://paymaster.io",
      },
    });
    expect(wallet.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("creates a wallet on BaseSepolia", async () => {
    const wallet = await createWallet({
      owner: MOCK_OWNER,
      config: {
        chainId: SupportedChain.BaseSepolia,
      },
    });
    expect(wallet.chainId).toBe(SupportedChain.BaseSepolia);
  });
});

describe("getWalletAddress", () => {
  it("returns the computed wallet address", async () => {
    const address = await getWalletAddress(MOCK_OWNER, {
      chainId: SupportedChain.Base,
    });
    expect(address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("returns address for Arbitrum", async () => {
    const address = await getWalletAddress(MOCK_OWNER, {
      chainId: SupportedChain.Arbitrum,
    });
    expect(address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("returns address with custom config", async () => {
    const address = await getWalletAddress(MOCK_OWNER, {
      chainId: SupportedChain.Base,
      rpcUrl: "https://custom.rpc.io",
      bundlerUrl: "https://custom.bundler.io",
    });
    expect(address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });
});
