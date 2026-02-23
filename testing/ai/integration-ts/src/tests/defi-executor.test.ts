import { describe, it, expect, beforeAll } from "vitest";
import {
  getAddress,
  zeroAddress,
  encodeAbiParameters,
  encodeFunctionData,
  decodeFunctionResult,
  parseAbi,
} from "viem";
import { DeFiExecutorAbi } from "../abis/DeFiExecutor.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer, walletOwner } from "../helpers/accounts.js";
import { deployAll, type DeployedContracts } from "../deploy.js";

const defiActionAbiParams = [
  {
    type: "tuple",
    components: [
      { name: "actionType", type: "uint8" },
      { name: "target", type: "address" },
      { name: "data", type: "bytes" },
      { name: "value", type: "uint256" },
    ],
  },
] as const;

describe("DeFiExecutor", () => {
  let contracts: DeployedContracts;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);
  const ownerClient = getWalletClient(walletOwner.privateKey);

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
  });

  it("should deploy successfully", async () => {
    const code = await publicClient.getCode({
      address: contracts.deFiExecutor,
    });
    expect(code).toBeDefined();
    expect(code!.length).toBeGreaterThan(2);
  });

  it("should report correct module type", async () => {
    const isExecutor = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "isModuleType",
      args: [2n],
    });
    expect(isExecutor).toBe(true);

    const isNotValidator = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "isModuleType",
      args: [1n],
    });
    expect(isNotValidator).toBe(false);
  });

  it("should encode swap action", async () => {
    const router = getAddress("0x0000000000000000000000000000000000000010");
    const tokenIn = getAddress("0x0000000000000000000000000000000000000011");
    const tokenOut = getAddress("0x0000000000000000000000000000000000000012");
    const amountIn = 1000000n;
    const minOut = 950000n;

    const encoded = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "encodeSwap",
      args: [router, tokenIn, tokenOut, amountIn, minOut],
    });

    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(2);
  });

  it("should encode lending supply action", async () => {
    const pool = getAddress("0x0000000000000000000000000000000000000020");
    const asset = getAddress("0x0000000000000000000000000000000000000021");
    const amount = 5000000n;

    const encoded = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "encodeLending",
      args: [pool, asset, amount, true],
    });

    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(2);
  });

  it("should encode lending borrow action", async () => {
    const pool = getAddress("0x0000000000000000000000000000000000000020");
    const asset = getAddress("0x0000000000000000000000000000000000000021");
    const amount = 3000000n;

    const encoded = await publicClient.readContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "encodeLending",
      args: [pool, asset, amount, false],
    });

    expect(encoded).toBeDefined();
    expect(encoded.length).toBeGreaterThan(2);
  });

  it("should reject execution with zero target", async () => {
    const actionData = encodeAbiParameters(defiActionAbiParams, [
      {
        actionType: 0,
        target: zeroAddress,
        data: "0x",
        value: 0n,
      },
    ]);

    await expect(
      ownerClient.writeContract({
        address: contracts.deFiExecutor,
        abi: DeFiExecutorAbi,
        functionName: "executeFromExecutor",
        args: [getAddress(walletOwner.address), actionData],
      })
    ).rejects.toThrow();
  });

  it("should execute action against a target that accepts calls", async () => {
    const targetAddress = contracts.deFiExecutor;

    const innerCallData = encodeFunctionData({
      abi: DeFiExecutorAbi,
      functionName: "isModuleType",
      args: [2n],
    });

    const actionData = encodeAbiParameters(defiActionAbiParams, [
      {
        actionType: 0,
        target: targetAddress,
        data: innerCallData,
        value: 0n,
      },
    ]);

    const result = await publicClient.simulateContract({
      address: contracts.deFiExecutor,
      abi: DeFiExecutorAbi,
      functionName: "executeFromExecutor",
      args: [getAddress(walletOwner.address), actionData],
      account: getAddress(walletOwner.address),
    });

    expect(result.result).toBeDefined();

    const decoded = decodeFunctionResult({
      abi: parseAbi(["function isModuleType(uint256) pure returns (bool)"]),
      functionName: "isModuleType",
      data: result.result as `0x${string}`,
    });

    expect(decoded).toBe(true);
  });
});
