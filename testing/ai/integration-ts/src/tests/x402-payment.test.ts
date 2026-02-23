import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encodeAbiParameters, parseAbiParameters, getAddress } from "viem";
import type { Server } from "http";
import { X402PaymentPolicyAbi } from "../abis/X402PaymentPolicy.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer, walletOwner, agent } from "../helpers/accounts.js";
import { deployAll, type DeployedContracts } from "../deploy.js";
import { createMockX402Server, closeMockX402Server } from "../x402/mock-server.js";
import { x402Fetch } from "../x402/client.js";

describe("X402PaymentPolicy", () => {
  let contracts: DeployedContracts;
  let mockServer: Server;
  const mockPort = 18402;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);
  const ownerClient = getWalletClient(walletOwner.privateKey);
  const agentClient = getWalletClient(agent.privateKey);

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
    mockServer = await createMockX402Server(mockPort);
  });

  afterAll(async () => {
    if (mockServer) {
      await closeMockX402Server(mockServer);
    }
  });

  it("should deploy successfully", async () => {
    const code = await publicClient.getCode({
      address: contracts.x402PaymentPolicy,
    });
    expect(code).toBeDefined();
    expect(code!.length).toBeGreaterThan(2);
  });

  it("should report correct module type", async () => {
    const isHook = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "isModuleType",
      args: [4n],
    });
    expect(isHook).toBe(true);
  });

  it("should configure agent budget", async () => {
    const budget = {
      maxPerRequest: 2000000n,
      dailyBudget: 10000000n,
      totalBudget: 50000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: ["api.example.com"],
    };

    const hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const stored = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });

    expect(stored.maxPerRequest).toBe(2000000n);
    expect(stored.dailyBudget).toBe(10000000n);
    expect(stored.totalBudget).toBe(50000000n);
    expect(stored.spent).toBe(0n);
    expect(stored.allowedDomains.length).toBe(1);
  });

  it("should track spending via preCheck", async () => {
    const budget = {
      maxPerRequest: 2000000n,
      dailyBudget: 10000000n,
      totalBudget: 50000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: ["api.example.com"],
    };

    let hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const paymentAmount = 1000000n;
    const msgData = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), paymentAmount]
    );

    hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, msgData],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const stored = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });

    expect(stored.spent).toBe(paymentAmount);
    expect(stored.dailySpent).toBe(paymentAmount);
  });

  it("should reject payment exceeding max per request", async () => {
    const budget = {
      maxPerRequest: 500000n,
      dailyBudget: 10000000n,
      totalBudget: 50000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    };

    let hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 1000000n]
    );

    await expect(
      ownerClient.writeContract({
        address: contracts.x402PaymentPolicy,
        abi: X402PaymentPolicyAbi,
        functionName: "preCheck",
        args: [getAddress(agent.address), 0n, msgData],
      })
    ).rejects.toThrow();
  });

  it("should reject payment exceeding total budget", async () => {
    const budget = {
      maxPerRequest: 5000000n,
      dailyBudget: 10000000n,
      totalBudget: 2000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    };

    let hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 3000000n]
    );

    await expect(
      ownerClient.writeContract({
        address: contracts.x402PaymentPolicy,
        abi: X402PaymentPolicyAbi,
        functionName: "preCheck",
        args: [getAddress(agent.address), 0n, msgData],
      })
    ).rejects.toThrow();
  });

  it("should return remaining budget", async () => {
    const budget = {
      maxPerRequest: 2000000n,
      dailyBudget: 10000000n,
      totalBudget: 50000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    };

    let hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 1500000n]
    );

    hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, msgData],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const remaining = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getRemainingBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });

    expect(remaining).toBe(48500000n);
  });

  it("should handle x402 payment flow with mock server", async () => {
    const url = `http://127.0.0.1:${mockPort}/api/data`;

    const result = await x402Fetch(url, agentClient);

    expect(result.paymentMade).toBe(true);
    expect(result.amountPaid).toBe("1000000");
    expect(result.response.status).toBe(200);

    const body = await result.response.json();
    expect(body.paymentVerified).toBe(true);
  });

  it("should emit PaymentRecorded on postCheck", async () => {
    const hookData = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 500000n]
    );

    const hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "postCheck",
      args: [hookData],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    expect(receipt.logs.length).toBeGreaterThan(0);
  });
});
