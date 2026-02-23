import { describe, it, expect, beforeAll } from "vitest";
import { encodeAbiParameters, parseAbiParameters, getAddress, zeroAddress } from "viem";
import { SpendingLimitHookAbi } from "../abis/SpendingLimitHook.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer, walletOwner, agent } from "../helpers/accounts.js";
import { deployAll, type DeployedContracts } from "../deploy.js";

describe("SpendingLimitHook", () => {
  let contracts: DeployedContracts;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);
  const ownerClient = getWalletClient(walletOwner.privateKey);

  const tokenAddress = getAddress("0x0000000000000000000000000000000000000001");

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
  });

  it("should deploy successfully", async () => {
    const code = await publicClient.getCode({
      address: contracts.spendingLimitHook,
    });
    expect(code).toBeDefined();
    expect(code!.length).toBeGreaterThan(2);
  });

  it("should report correct module type", async () => {
    const isHook = await publicClient.readContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "isModuleType",
      args: [4n],
    });
    expect(isHook).toBe(true);

    const isNotValidator = await publicClient.readContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "isModuleType",
      args: [1n],
    });
    expect(isNotValidator).toBe(false);
  });

  it("should set spending limits", async () => {
    const dailyLimit = 10000000n;
    const weeklyLimit = 50000000n;

    const hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), tokenAddress, dailyLimit, weeklyLimit],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const spending = await publicClient.readContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "getSpending",
      args: [getAddress(walletOwner.address), getAddress(agent.address), tokenAddress],
    });

    expect(spending.dailySpent).toBe(0n);
    expect(spending.weeklySpent).toBe(0n);
  });

  it("should track spending via preCheck", async () => {
    const dailyLimit = 10000000n;
    const weeklyLimit = 50000000n;

    let hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), tokenAddress, dailyLimit, weeklyLimit],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const spendAmount = 3000000n;
    const msgData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), tokenAddress, spendAmount]
    );

    hash = await ownerClient.writeContract({
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

  it("should enforce daily spending limit", async () => {
    const newToken = getAddress("0x0000000000000000000000000000000000000002");
    const dailyLimit = 5000000n;
    const weeklyLimit = 50000000n;

    let hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), newToken, dailyLimit, weeklyLimit],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), newToken, dailyLimit + 1n]
    );

    await expect(
      ownerClient.writeContract({
        address: contracts.spendingLimitHook,
        abi: SpendingLimitHookAbi,
        functionName: "preCheck",
        args: [getAddress(agent.address), 0n, msgData],
      })
    ).rejects.toThrow();
  });

  it("should enforce weekly spending limit", async () => {
    const newToken = getAddress("0x0000000000000000000000000000000000000003");
    const dailyLimit = 50000000n;
    const weeklyLimit = 5000000n;

    let hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), newToken, dailyLimit, weeklyLimit],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), newToken, weeklyLimit + 1n]
    );

    await expect(
      ownerClient.writeContract({
        address: contracts.spendingLimitHook,
        abi: SpendingLimitHookAbi,
        functionName: "preCheck",
        args: [getAddress(agent.address), 0n, msgData],
      })
    ).rejects.toThrow();
  });

  it("should reset spending", async () => {
    const newToken = getAddress("0x0000000000000000000000000000000000000004");
    const dailyLimit = 10000000n;
    const weeklyLimit = 50000000n;

    let hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "setLimits",
      args: [getAddress(agent.address), newToken, dailyLimit, weeklyLimit],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const msgData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), newToken, 5000000n]
    );

    hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "preCheck",
      args: [getAddress(agent.address), 0n, msgData],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "resetSpending",
      args: [getAddress(agent.address), newToken],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const spending = await publicClient.readContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "getSpending",
      args: [getAddress(walletOwner.address), getAddress(agent.address), newToken],
    });

    expect(spending.dailySpent).toBe(0n);
    expect(spending.weeklySpent).toBe(0n);
  });

  it("should emit SpendingRecorded on postCheck", async () => {
    const hookData = encodeAbiParameters(
      parseAbiParameters("address, address, uint256"),
      [getAddress(agent.address), tokenAddress, 1000000n]
    );

    const hash = await ownerClient.writeContract({
      address: contracts.spendingLimitHook,
      abi: SpendingLimitHookAbi,
      functionName: "postCheck",
      args: [hookData],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    expect(receipt.logs.length).toBeGreaterThan(0);
  });
});
