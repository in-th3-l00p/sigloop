import { describe, it, expect, vi } from "vitest";
import { createAgent, buildEnableSessionKeyCalldata } from "../../agent/create.js";
import { SupportedChain } from "../../types/chain.js";
import type { Policy, PolicyRule } from "../../types/policy.js";
import type { Address, Hex } from "viem";

vi.mock("../../agent/session.js", () => ({
  generateSessionKey: vi.fn((duration: number = 86400) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as Hex,
      publicKey: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
      account: { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
      validAfter: now,
      validUntil: now + duration,
      nonce: BigInt(now),
    };
  }),
}));

const MOCK_WALLET: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const MOCK_OWNER = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  type: "local",
} as any;

const MOCK_RULE: PolicyRule = {
  type: "rate-limit",
  maxCalls: 10,
  intervalSeconds: 60,
};

const MOCK_POLICY: Policy = {
  id: "0xabc" as Hex,
  rules: [MOCK_RULE],
  composition: { operator: "AND", rules: [MOCK_RULE] },
  encoded: "0xdeadbeef" as Hex,
};

describe("createAgent", () => {
  it("creates an agent with valid params", async () => {
    const agent = await createAgent({
      walletAddress: MOCK_WALLET,
      owner: MOCK_OWNER,
      config: {
        name: "test-agent",
        policy: MOCK_POLICY,
      },
      chainId: SupportedChain.Base,
    });

    expect(agent.name).toBe("test-agent");
    expect(agent.walletAddress).toBe(MOCK_WALLET);
    expect(agent.chainId).toBe(SupportedChain.Base);
    expect(agent.isActive).toBe(true);
    expect(agent.id).toMatch(/^0x/);
    expect(agent.sessionKey).toBeDefined();
    expect(agent.policy).toBe(MOCK_POLICY);
    expect(agent.createdAt).toBeGreaterThan(0);
    expect(agent.expiresAt).toBeGreaterThan(agent.createdAt);
  });

  it("uses default session duration of 86400", async () => {
    const agent = await createAgent({
      walletAddress: MOCK_WALLET,
      owner: MOCK_OWNER,
      config: {
        name: "test",
        policy: MOCK_POLICY,
      },
      chainId: SupportedChain.Base,
    });

    expect(agent.expiresAt - agent.sessionKey.validAfter).toBe(86400);
  });

  it("uses custom session duration", async () => {
    const agent = await createAgent({
      walletAddress: MOCK_WALLET,
      owner: MOCK_OWNER,
      config: {
        name: "test",
        policy: MOCK_POLICY,
        sessionDurationSeconds: 3600,
      },
      chainId: SupportedChain.Base,
    });

    expect(agent.expiresAt - agent.sessionKey.validAfter).toBe(3600);
  });

  it("includes optional description", async () => {
    const agent = await createAgent({
      walletAddress: MOCK_WALLET,
      owner: MOCK_OWNER,
      config: {
        name: "test",
        description: "A test agent",
        policy: MOCK_POLICY,
      },
      chainId: SupportedChain.Base,
    });

    expect(agent.description).toBe("A test agent");
  });

  it("throws for invalid wallet address", async () => {
    await expect(
      createAgent({
        walletAddress: "invalid" as Address,
        owner: MOCK_OWNER,
        config: {
          name: "test",
          policy: MOCK_POLICY,
        },
        chainId: SupportedChain.Base,
      })
    ).rejects.toThrow("Invalid address");
  });
});

describe("buildEnableSessionKeyCalldata", () => {
  it("returns hex calldata", () => {
    const calldata = buildEnableSessionKeyCalldata(
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
      1000,
      2000,
      MOCK_POLICY
    );
    expect(calldata).toMatch(/^0x/);
    expect(calldata.length).toBeGreaterThan(10);
  });
});
