import { describe, it, expect, vi } from "vitest";
import { revokeAgent, buildRevokeCalldata, isAgentActive } from "../../agent/revoke.js";
import { SupportedChain } from "../../types/chain.js";
import type { Agent } from "../../types/agent.js";
import type { Address, Hex } from "viem";

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn().mockResolvedValue([
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        Math.floor(Date.now() / 1000) - 100,
        Math.floor(Date.now() / 1000) + 86400,
        true,
      ]),
    })),
  };
});

const MOCK_AGENT: Agent = {
  id: "0xabc123" as Hex,
  name: "test-agent",
  walletAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
  sessionKey: {
    privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as Hex,
    publicKey: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
    account: {} as any,
    validAfter: Math.floor(Date.now() / 1000) - 100,
    validUntil: Math.floor(Date.now() / 1000) + 86400,
    nonce: 1n,
  },
  policy: {
    id: "0x01" as Hex,
    rules: [{ type: "rate-limit", maxCalls: 10, intervalSeconds: 60 }],
    composition: { operator: "AND", rules: [] },
    encoded: "0x" as Hex,
  },
  chainId: SupportedChain.Base,
  createdAt: Math.floor(Date.now() / 1000) - 100,
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  isActive: true,
};

describe("revokeAgent", () => {
  it("returns calldata and sets isActive to false", async () => {
    const agent = { ...MOCK_AGENT, isActive: true, sessionKey: { ...MOCK_AGENT.sessionKey } };
    const calldata = await revokeAgent(agent);
    expect(calldata).toMatch(/^0x/);
    expect(agent.isActive).toBe(false);
  });

  it("returns valid hex calldata", async () => {
    const agent = { ...MOCK_AGENT, sessionKey: { ...MOCK_AGENT.sessionKey } };
    const calldata = await revokeAgent(agent);
    expect(calldata.length).toBeGreaterThan(10);
  });
});

describe("buildRevokeCalldata", () => {
  it("returns hex calldata", () => {
    const calldata = buildRevokeCalldata(
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address
    );
    expect(calldata).toMatch(/^0x/);
    expect(calldata.length).toBeGreaterThan(10);
  });

  it("throws for invalid address", () => {
    expect(() => buildRevokeCalldata("invalid" as Address)).toThrow("Invalid address");
  });
});

describe("isAgentActive", () => {
  it("returns true for an active agent", async () => {
    const result = await isAgentActive(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
      SupportedChain.Base
    );
    expect(result).toBe(true);
  });

  it("throws for invalid wallet address", async () => {
    await expect(
      isAgentActive("invalid" as Address, "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address, SupportedChain.Base)
    ).rejects.toThrow("Invalid address");
  });

  it("throws for invalid session key address", async () => {
    await expect(
      isAgentActive("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address, "invalid" as Address, SupportedChain.Base)
    ).rejects.toThrow("Invalid address");
  });
});
