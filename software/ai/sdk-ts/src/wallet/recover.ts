import {
  type Address,
  type Hex,
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  keccak256,
  encodePacked,
} from "viem";
import type { SigloopWallet } from "../types/wallet.js";
import { validateAddress } from "../utils/validation.js";
import { encodeGuardianData } from "../utils/encoding.js";
import { getChainConfig } from "../chain/config.js";

const RECOVERY_ABI = parseAbi([
  "function addGuardian(address guardian) external",
  "function removeGuardian(address guardian) external",
  "function initiateRecovery(address newOwner, bytes[] signatures) external",
  "function executeRecovery(address newOwner) external",
  "function getGuardians() external view returns (address[])",
  "function getRecoveryRequest() external view returns (address newOwner, uint256 executeAfter, uint256 guardiansApproved)",
  "function cancelRecovery() external",
]);

const RECOVERY_MODULE_ADDRESS: Address = "0x000000000000000000000000000000000000dEaD";

export async function addGuardian(
  wallet: SigloopWallet,
  guardian: Address
): Promise<Hex> {
  validateAddress(guardian);

  if (wallet.guardians.includes(guardian)) {
    throw new Error("Guardian already exists");
  }

  const calldata = encodeFunctionData({
    abi: RECOVERY_ABI,
    functionName: "addGuardian",
    args: [guardian],
  });

  const chainConfig = getChainConfig(wallet.chainId);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  const hash = keccak256(
    encodePacked(
      ["address", "address", "string"],
      [wallet.address, guardian, "addGuardian"]
    )
  );

  wallet.guardians.push(guardian);

  return calldata;
}

export async function removeGuardian(
  wallet: SigloopWallet,
  guardian: Address
): Promise<Hex> {
  validateAddress(guardian);

  const index = wallet.guardians.indexOf(guardian);
  if (index === -1) {
    throw new Error("Guardian not found");
  }

  if (wallet.guardians.length <= 1) {
    throw new Error("Cannot remove the last guardian");
  }

  const calldata = encodeFunctionData({
    abi: RECOVERY_ABI,
    functionName: "removeGuardian",
    args: [guardian],
  });

  wallet.guardians.splice(index, 1);

  return calldata;
}

export interface RecoveryRequest {
  newOwner: Address;
  executeAfter: bigint;
  guardiansApproved: bigint;
}

export async function initiateRecovery(
  walletAddress: Address,
  newOwner: Address,
  guardianSignatures: Hex[],
  chainId: number
): Promise<Hex> {
  validateAddress(walletAddress);
  validateAddress(newOwner);

  if (guardianSignatures.length === 0) {
    throw new Error("At least one guardian signature is required");
  }

  const calldata = encodeFunctionData({
    abi: RECOVERY_ABI,
    functionName: "initiateRecovery",
    args: [newOwner, guardianSignatures],
  });

  return calldata;
}

export async function executeRecovery(
  walletAddress: Address,
  newOwner: Address,
  chainId: number
): Promise<Hex> {
  validateAddress(walletAddress);
  validateAddress(newOwner);

  const calldata = encodeFunctionData({
    abi: RECOVERY_ABI,
    functionName: "executeRecovery",
    args: [newOwner],
  });

  return calldata;
}

export async function getRecoveryRequest(
  walletAddress: Address,
  chainId: number
): Promise<RecoveryRequest | null> {
  validateAddress(walletAddress);

  const chainConfig = getChainConfig(chainId as any);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  try {
    const [newOwner, executeAfter, guardiansApproved] = await client.readContract({
      address: walletAddress,
      abi: RECOVERY_ABI,
      functionName: "getRecoveryRequest",
    });

    if (newOwner === "0x0000000000000000000000000000000000000000") {
      return null;
    }

    return {
      newOwner: newOwner as Address,
      executeAfter,
      guardiansApproved,
    };
  } catch {
    return null;
  }
}

export async function cancelRecovery(walletAddress: Address): Promise<Hex> {
  validateAddress(walletAddress);

  return encodeFunctionData({
    abi: RECOVERY_ABI,
    functionName: "cancelRecovery",
  });
}
