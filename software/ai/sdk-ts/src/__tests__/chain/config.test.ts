import { describe, it, expect } from "vitest";
import {
  CHAIN_CONFIGS,
  getChainConfig,
  getChainConfigWithOverrides,
} from "../../chain/config.js";
import { SupportedChain } from "../../types/chain.js";

describe("CHAIN_CONFIGS", () => {
  it("contains Base config", () => {
    const config = CHAIN_CONFIGS[SupportedChain.Base];
    expect(config).toBeDefined();
    expect(config.chainId).toBe(SupportedChain.Base);
    expect(config.rpcUrl).toBe("https://mainnet.base.org");
    expect(config.explorerUrl).toBe("https://basescan.org");
    expect(config.nativeCurrency.symbol).toBe("ETH");
  });

  it("contains Arbitrum config", () => {
    const config = CHAIN_CONFIGS[SupportedChain.Arbitrum];
    expect(config).toBeDefined();
    expect(config.chainId).toBe(SupportedChain.Arbitrum);
    expect(config.rpcUrl).toBe("https://arb1.arbitrum.io/rpc");
  });

  it("contains BaseSepolia config", () => {
    const config = CHAIN_CONFIGS[SupportedChain.BaseSepolia];
    expect(config).toBeDefined();
    expect(config.chainId).toBe(SupportedChain.BaseSepolia);
  });

  it("contains ArbitrumSepolia config", () => {
    const config = CHAIN_CONFIGS[SupportedChain.ArbitrumSepolia];
    expect(config).toBeDefined();
    expect(config.chainId).toBe(SupportedChain.ArbitrumSepolia);
  });

  it("all configs have required fields", () => {
    for (const key of Object.values(SupportedChain).filter((v) => typeof v === "number")) {
      const config = CHAIN_CONFIGS[key as SupportedChain];
      expect(config.chain).toBeDefined();
      expect(config.rpcUrl).toBeTruthy();
      expect(config.bundlerUrl).toBeTruthy();
      expect(config.entryPointAddress).toBeTruthy();
      expect(config.explorerUrl).toBeTruthy();
      expect(config.nativeCurrency).toBeDefined();
      expect(config.averageBlockTime).toBeGreaterThan(0);
      expect(config.averageGasPrice).toBeGreaterThan(0n);
    }
  });
});

describe("getChainConfig", () => {
  it("returns the config for Base", () => {
    const config = getChainConfig(SupportedChain.Base);
    expect(config.chainId).toBe(SupportedChain.Base);
  });

  it("returns the config for Arbitrum", () => {
    const config = getChainConfig(SupportedChain.Arbitrum);
    expect(config.chainId).toBe(SupportedChain.Arbitrum);
  });

  it("throws for an unsupported chain", () => {
    expect(() => getChainConfig(999 as SupportedChain)).toThrow("Unsupported chain");
  });
});

describe("getChainConfigWithOverrides", () => {
  it("returns default config when no overrides provided", () => {
    const config = getChainConfigWithOverrides(SupportedChain.Base);
    expect(config.rpcUrl).toBe("https://mainnet.base.org");
  });

  it("overrides rpcUrl", () => {
    const config = getChainConfigWithOverrides(SupportedChain.Base, {
      rpcUrl: "https://custom.rpc.io",
    });
    expect(config.rpcUrl).toBe("https://custom.rpc.io");
    expect(config.bundlerUrl).toBe("https://bundler.base.org");
  });

  it("overrides bundlerUrl", () => {
    const config = getChainConfigWithOverrides(SupportedChain.Base, {
      bundlerUrl: "https://custom.bundler.io",
    });
    expect(config.bundlerUrl).toBe("https://custom.bundler.io");
    expect(config.rpcUrl).toBe("https://mainnet.base.org");
  });

  it("overrides paymasterUrl", () => {
    const config = getChainConfigWithOverrides(SupportedChain.Base, {
      paymasterUrl: "https://paymaster.io",
    });
    expect(config.paymasterUrl).toBe("https://paymaster.io");
  });

  it("overrides multiple fields", () => {
    const config = getChainConfigWithOverrides(SupportedChain.Base, {
      rpcUrl: "https://rpc.io",
      bundlerUrl: "https://bundler.io",
      paymasterUrl: "https://pay.io",
    });
    expect(config.rpcUrl).toBe("https://rpc.io");
    expect(config.bundlerUrl).toBe("https://bundler.io");
    expect(config.paymasterUrl).toBe("https://pay.io");
  });

  it("preserves non-overridden fields", () => {
    const original = getChainConfig(SupportedChain.Base);
    const overridden = getChainConfigWithOverrides(SupportedChain.Base, {
      rpcUrl: "https://custom.rpc.io",
    });
    expect(overridden.chainId).toBe(original.chainId);
    expect(overridden.chain).toBe(original.chain);
    expect(overridden.entryPointAddress).toBe(original.entryPointAddress);
    expect(overridden.explorerUrl).toBe(original.explorerUrl);
  });

  it("throws for unsupported chain even with overrides", () => {
    expect(() =>
      getChainConfigWithOverrides(999 as SupportedChain, { rpcUrl: "https://rpc.io" })
    ).toThrow("Unsupported chain");
  });
});
