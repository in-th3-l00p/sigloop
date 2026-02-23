import {
  type Hex,
  type Address,
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  keccak256,
  encodePacked,
  toHex,
} from "viem";
import type { Agent, CreateAgentParams } from "../types/agent.js";
import type { Policy } from "../types/policy.js";
import { generateSessionKey } from "./session.js";
import { encodeSessionKeyData, encodePolicy } from "../utils/encoding.js";
import { getChainConfig } from "../chain/config.js";
import { validateAddress } from "../utils/validation.js";

const SESSION_KEY_VALIDATOR_ABI = parseAbi([
  "function enableSessionKey(address sessionKey, uint48 validAfter, uint48 validUntil, bytes calldata policyData) external",
  "function disableSessionKey(address sessionKey) external",
  "function getSessionKeyData(address sessionKey) external view returns (address, uint48, uint48, bool)",
]);

export async function createAgent(params: CreateAgentParams): Promise<Agent> {
  validateAddress(params.walletAddress);

  const durationSeconds = params.config.sessionDurationSeconds ?? 86400;
  const sessionKey = generateSessionKey(durationSeconds);

  const chainConfig = getChainConfig(params.chainId);

  const policyData = encodePolicy(params.config.policy);

  const enableCalldata = encodeFunctionData({
    abi: SESSION_KEY_VALIDATOR_ABI,
    functionName: "enableSessionKey",
    args: [
      sessionKey.publicKey,
      sessionKey.validAfter,
      sessionKey.validUntil,
      policyData,
    ],
  });

  const agentId = keccak256(
    encodePacked(
      ["address", "address", "uint256"],
      [params.walletAddress, sessionKey.publicKey, sessionKey.nonce]
    )
  );

  return {
    id: agentId,
    name: params.config.name,
    description: params.config.description,
    walletAddress: params.walletAddress,
    sessionKey,
    policy: params.config.policy,
    chainId: params.chainId,
    createdAt: Math.floor(Date.now() / 1000),
    expiresAt: sessionKey.validUntil,
    isActive: true,
  };
}

export function buildEnableSessionKeyCalldata(
  sessionKeyAddress: Address,
  validAfter: number,
  validUntil: number,
  policy: Policy
): Hex {
  const policyData = encodePolicy(policy);

  return encodeFunctionData({
    abi: SESSION_KEY_VALIDATOR_ABI,
    functionName: "enableSessionKey",
    args: [sessionKeyAddress, validAfter, validUntil, policyData],
  });
}
