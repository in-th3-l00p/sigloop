import {
  type Hex,
  type Address,
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
} from "viem";
import type { Agent } from "../types/agent.js";
import type { SupportedChain } from "../types/chain.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress } from "../utils/validation.js";

const SESSION_KEY_VALIDATOR_ABI = parseAbi([
  "function disableSessionKey(address sessionKey) external",
  "function getSessionKeyData(address sessionKey) external view returns (address, uint48, uint48, bool)",
]);

export async function revokeAgent(agent: Agent): Promise<Hex> {
  const calldata = encodeFunctionData({
    abi: SESSION_KEY_VALIDATOR_ABI,
    functionName: "disableSessionKey",
    args: [agent.sessionKey.publicKey],
  });

  agent.isActive = false;

  return calldata;
}

export function buildRevokeCalldata(sessionKeyAddress: Address): Hex {
  validateAddress(sessionKeyAddress);

  return encodeFunctionData({
    abi: SESSION_KEY_VALIDATOR_ABI,
    functionName: "disableSessionKey",
    args: [sessionKeyAddress],
  });
}

export async function isAgentActive(
  walletAddress: Address,
  sessionKeyAddress: Address,
  chainId: SupportedChain
): Promise<boolean> {
  validateAddress(walletAddress);
  validateAddress(sessionKeyAddress);

  const chainConfig = getChainConfig(chainId);
  const client = createPublicClient({
    chain: chainConfig.chain,
    transport: http(chainConfig.rpcUrl),
  });

  try {
    const [owner, validAfter, validUntil, active] = await client.readContract({
      address: walletAddress,
      abi: SESSION_KEY_VALIDATOR_ABI,
      functionName: "getSessionKeyData",
      args: [sessionKeyAddress],
    });

    const now = Math.floor(Date.now() / 1000);
    return active && now >= validAfter && now < validUntil;
  } catch {
    return false;
  }
}
