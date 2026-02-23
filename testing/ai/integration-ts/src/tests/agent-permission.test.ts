import { describe, it, expect, beforeAll } from "vitest";
import { encodePacked, keccak256, encodeAbiParameters, parseAbiParameters, getAddress, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AgentPermissionValidatorAbi } from "../abis/AgentPermissionValidator.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer, walletOwner, agent, unauthorized } from "../helpers/accounts.js";
import { deployAll, type DeployedContracts } from "../deploy.js";

describe("AgentPermissionValidator", () => {
  let contracts: DeployedContracts;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);
  const ownerClient = getWalletClient(walletOwner.privateKey);

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
  });

  it("should deploy successfully", async () => {
    const code = await publicClient.getCode({
      address: contracts.agentPermissionValidator,
    });
    expect(code).toBeDefined();
    expect(code!.length).toBeGreaterThan(2);
  });

  it("should report correct module type", async () => {
    const isValidator = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "isModuleType",
      args: [1n],
    });
    expect(isValidator).toBe(true);

    const isNotHook = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "isModuleType",
      args: [4n],
    });
    expect(isNotHook).toBe(false);
  });

  it("should add an agent with policy", async () => {
    const policy = {
      allowedTargets: [getAddress(zeroAddress)],
      allowedSelectors: ["0xa9059cbb" as `0x${string}`],
      maxAmountPerTx: 1000000000000000000n,
      dailyLimit: 5000000000000000000n,
      weeklyLimit: 20000000000000000000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    } as const;

    const hash = await ownerClient.writeContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "addAgent",
      args: [getAddress(agent.address), policy],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const stored = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "getPolicy",
      args: [getAddress(walletOwner.address), getAddress(agent.address)],
    });

    expect(stored.active).toBe(true);
    expect(stored.maxAmountPerTx).toBe(1000000000000000000n);
    expect(stored.allowedTargets.length).toBe(1);
    expect(stored.allowedSelectors.length).toBe(1);
  });

  it("should return inactive policy for unregistered agent", async () => {
    const stored = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "getPolicy",
      args: [getAddress(walletOwner.address), getAddress(unauthorized.address)],
    });

    expect(stored.active).toBe(false);
    expect(stored.maxAmountPerTx).toBe(0n);
  });

  it("should remove an agent", async () => {
    const policy = {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: 500000000000000000n,
      dailyLimit: 2000000000000000000n,
      weeklyLimit: 10000000000000000000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    } as const;

    let hash = await ownerClient.writeContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "addAgent",
      args: [getAddress(unauthorized.address), policy],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    hash = await ownerClient.writeContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "removeAgent",
      args: [getAddress(unauthorized.address)],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const stored = await publicClient.readContract({
      address: contracts.agentPermissionValidator,
      abi: AgentPermissionValidatorAbi,
      functionName: "getPolicy",
      args: [getAddress(walletOwner.address), getAddress(unauthorized.address)],
    });

    expect(stored.active).toBe(false);
  });

  it("should validate user operation with correct agent signature", async () => {
    const policy = {
      allowedTargets: [],
      allowedSelectors: [],
      maxAmountPerTx: 1000000000000000000n,
      dailyLimit: 5000000000000000000n,
      weeklyLimit: 20000000000000000000n,
      validAfter: 0,
      validUntil: 0,
      active: true,
    } as const;

    const validatorAddr = contracts.agentPermissionValidator;

    const hash = await ownerClient.writeContract({
      address: validatorAddr,
      abi: AgentPermissionValidatorAbi,
      functionName: "addAgent",
      args: [getAddress(agent.address), policy],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    const agentAccount = privateKeyToAccount(agent.privateKey);
    const userOpHash = keccak256(encodePacked(["string"], ["test-op"]));

    const signature = await agentAccount.signMessage({
      message: { raw: userOpHash as `0x${string}` },
    });

    const agentAddrBytes = agent.address.toLowerCase().replace("0x", "");
    const sigBytes = signature.replace("0x", "");
    const combinedSig = `0x${agentAddrBytes}${sigBytes}` as `0x${string}`;

    const target = zeroAddress;
    const value = 500000000000000000n;
    const callData = encodeAbiParameters(
      parseAbiParameters("bytes4, address, uint256"),
      ["0xa9059cbb", getAddress(target), value]
    );

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
      address: validatorAddr,
      abi: AgentPermissionValidatorAbi,
      functionName: "validateUserOp",
      args: [userOp, userOpHash],
      account: getAddress(walletOwner.address),
    });

    expect(result.result).toBe(0n);
  });

  it("should reject user operation with wrong signer", async () => {
    const validatorAddr = contracts.agentPermissionValidator;

    const unauthorizedAccount = privateKeyToAccount(unauthorized.privateKey);
    const userOpHash = keccak256(encodePacked(["string"], ["test-op-bad"]));

    const signature = await unauthorizedAccount.signMessage({
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
      address: validatorAddr,
      abi: AgentPermissionValidatorAbi,
      functionName: "validateUserOp",
      args: [userOp, userOpHash],
      account: getAddress(walletOwner.address),
    });

    expect(result.result).toBe(1n);
  });
});
