import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  encodeAbiParameters,
  parseAbiParameters,
  getAddress,
  encodePacked,
  keccak256,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Server } from "http";
import { AgentPermissionValidatorAbi } from "../abis/AgentPermissionValidator.js";
import { SpendingLimitHookAbi } from "../abis/SpendingLimitHook.js";
import { X402PaymentPolicyAbi } from "../abis/X402PaymentPolicy.js";
import { DeFiExecutorAbi } from "../abis/DeFiExecutor.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer, walletOwner, agent, unauthorized } from "../helpers/accounts.js";
import { deployAll, type DeployedContracts } from "../deploy.js";
import { createMockX402Server, closeMockX402Server } from "../x402/mock-server.js";
import { x402Fetch } from "../x402/client.js";

describe("Full Flow Integration", () => {
  let contracts: DeployedContracts;
  let mockServer: Server;
  const mockPort = 18403;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);
  const ownerClient = getWalletClient(walletOwner.privateKey);
  const agentClient = getWalletClient(agent.privateKey);

  const tokenAddress = getAddress("0x0000000000000000000000000000000000000042");

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
    mockServer = await createMockX402Server(mockPort);
  });

  afterAll(async () => {
    if (mockServer) {
      await closeMockX402Server(mockServer);
    }
  });

  it("should complete end-to-end: deploy -> add agent -> set policy -> x402 payment -> check budget", async () => {
    const code = await publicClient.getCode({
      address: contracts.agentPermissionValidator,
    });
    expect(code!.length).toBeGreaterThan(2);

    const policy = {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: 5000000000000000000n,
      dailyLimit: 20000000000000000000n,
      weeklyLimit: 100000000000000000000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    } as const;

    let hash = await ownerClient.writeContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "addAgent",
      args: [getAddress(agent.address), policy],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const storedPolicy = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "getPolicy",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });
    expect(storedPolicy.active).toBe(true);

    hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), tokenAddress, 10000000n, 50000000n],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const x402Budget = {
      maxPerRequest: 2000000n,
      dailyBudget: 10000000n,
      totalBudget: 50000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: ["api.example.com"],
    };

    hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), x402Budget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const url = `http://127.0.0.1:${mockPort}/api/data`;
    const paymentResult = await x402Fetch(url, agentClient);

    expect(paymentResult.paymentMade).toBe(true);
    expect(paymentResult.response.status).toBe(200);

    const responseBody = await paymentResult.response.json();
    expect(responseBody.paymentVerified).toBe(true);

    const paymentAmount = BigInt(paymentResult.amountPaid);
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

    const budget = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });
    expect(budget.spent).toBe(paymentAmount);

    const remaining = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getRemainingBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });
    expect(remaining).toBe(50000000n - paymentAmount);
  });

  it("should validate agent signature in full flow", async () => {
    const agentAccount = privateKeyToAccount(agent.privateKey);
    const userOpHash = keccak256(encodePacked(["string"], ["full-flow-test"]));

    const signature = await agentAccount.signMessage({
      message: { raw: userOpHash as `0x${string}` },
    });

    const agentAddrBytes = agent.address.toLowerCase().replace("0x", "");
    const sigBytes = signature.replace("0x", "");
    const combinedSig = `0x${agentAddrBytes}${sigBytes}` as `0x${string}`;

    const callData = "0x" as `0x${string}`;

    const userOp = {
      sender: getAddress(walletOwner.address),
      nonce: 0n,
      initCode: "0x" as `0x${string}`,
      callData,
      accountGasLimits: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      preVerificationGas: 0n,
      gasFees: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      paymasterAndData: "0x" as `0x${string}`,
      signature: combinedSig,
    };

    const result = await publicClient.simulateContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "validateUserOp",
      args: [userOp, userOpHash],
      account: getAddress(walletOwner.address),
    });

    expect(result.result).toBe(0n);
  });

  it("should reject unauthorized agent in full flow", async () => {
    const unauthorizedAccount = privateKeyToAccount(unauthorized.privateKey);
    const userOpHash = keccak256(encodePacked(["string"], ["unauthorized-flow"]));

    const signature = await unauthorizedAccount.signMessage({
      message: { raw: userOpHash as `0x${string}` },
    });

    const agentAddrBytes = unauthorized.address.toLowerCase().replace("0x", "");
    const sigBytes = signature.replace("0x", "");
    const combinedSig = `0x${agentAddrBytes}${sigBytes}` as `0x${string}`;

    const userOp = {
      sender: getAddress(walletOwner.address),
      nonce: 0n,
      initCode: "0x" as `0x${string}`,
      callData: "0x" as `0x${string}`,
      accountGasLimits: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      preVerificationGas: 0n,
      gasFees: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
      paymasterAndData: "0x" as `0x${string}`,
      signature: combinedSig,
    };

    const result = await publicClient.simulateContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "validateUserOp",
      args: [userOp, userOpHash],
      account: getAddress(walletOwner.address),
    });

    expect(result.result).toBe(1n);
  });

  it("should enforce x402 budget limits after multiple payments", async () => {
    const tightBudget = {
      maxPerRequest: 1500000n,
      dailyBudget: 5000000n,
      totalBudget: 3000000n,
      spent: 0n,
      dailySpent: 0n,
      lastReset: 0n,
      allowedDomains: [],
    };

    let hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "configureAgent",
      args: [getAddress(agent.address), tightBudget],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const firstPayment = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 1500000n]
    );

    hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, firstPayment],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const secondPayment = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 1500000n]
    );

    hash = await ownerClient.writeContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, secondPayment],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const thirdPayment = encodeAbiParameters(
      parseAbiParameters("address, uint256"),
      [getAddress(agent.address), 1000000n]
    );

    await expect(
      ownerClient.writeContract({
        address: contracts.x402PaymentPolicy,
        abi: X402PaymentPolicyAbi,
        functionName: "preCheck",
        args: [getAddress(agent.address), 0n, thirdPayment],
      })
    ).rejects.toThrow();

    const remaining = await publicClient.readContract({
      address: contracts.x402PaymentPolicy,
      abi: X402PaymentPolicyAbi,
      functionName: "getRemainingBudget",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });

    expect(remaining).toBe(0n);
  });

  it("should track spending through spending limit hook", async () => {
    const spendAmount = 2000000n;
    const msgData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), tokenAddress, spendAmount]
    );

    const hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, msgData],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const spending = await publicClient.readContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "getSpending",
      args: [getAddress(walletOwner.address), getAddress(agent.address), tokenAddress],
    });

    expect(spending.dailySpent).toBe(spendAmount);
    expect(spending.weeklySpent).toBe(spendAmount);
  });

  it("should encode and validate DeFi executor actions", async () => {
    const router = getAddress("0x0000000000000000000000000000000000000099");
    const tokenIn = getAddress("0x0000000000000000000000000000000000000011");
    const tokenOut = getAddress("0x0000000000000000000000000000000000000012");

    const encoded = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "encodeSwap",
      args: [router, tokenIn, tokenOut, 1000000n, 950000n],
    });

    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(2);

    const isExecutor = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "isModuleType",
      args: [2n],
    });
    expect(isExecutor).toBe(true);
  });
});
