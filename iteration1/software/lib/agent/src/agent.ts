import type { Address, Hex } from "viem"
import { createAgentPolicy } from "@sigloop/policy"
import type { AgentPolicy } from "@sigloop/policy"
import { AGENT_PERMISSION_VALIDATOR_ABI } from "@sigloop/policy/advanced"
import type { Agent, CreateAgentConfig, LoadAgentConfig, RevokeAgentConfig } from "./types.js"
import { generateSessionKey, sessionKeyFromPrivateKey } from "./session.js"
import { signUserOpAsAgent } from "./signing.js"
import { encodeRemoveAgent } from "./module.js"

export function createAgent(config: CreateAgentConfig): Agent {
  const sessionKey = generateSessionKey(config.sessionDuration)
  const policy = createAgentPolicy({
    ...config.policy,
    validUntil: config.policy?.validUntil ?? sessionKey.expiresAt,
  })

  return {
    address: sessionKey.address,
    sessionKey,
    policy,
    signUserOp: (userOpHash: Hex) =>
      signUserOpAsAgent(sessionKey.address, sessionKey.privateKey, userOpHash),
  }
}

export function loadAgent(config: LoadAgentConfig): Agent {
  const sessionKey = sessionKeyFromPrivateKey(config.privateKey, config.sessionDuration)
  const policy = createAgentPolicy({})

  return {
    address: sessionKey.address,
    sessionKey,
    policy,
    signUserOp: (userOpHash: Hex) =>
      signUserOpAsAgent(sessionKey.address, sessionKey.privateKey, userOpHash),
  }
}

export async function getAgentPolicy(
  publicClient: any,
  validatorAddress: Address,
  walletAddress: Address,
  agentAddress: Address,
): Promise<AgentPolicy> {
  const result = await publicClient.readContract({
    address: validatorAddress,
    abi: AGENT_PERMISSION_VALIDATOR_ABI,
    functionName: "getPolicy",
    args: [walletAddress, agentAddress],
  })

  return {
    allowedTargets: [...result.allowedTargets] as Address[],
    allowedSelectors: [...result.allowedSelectors] as Hex[],
    maxAmountPerTx: result.maxAmountPerTx,
    dailyLimit: result.dailyLimit,
    weeklyLimit: result.weeklyLimit,
    validAfter: result.validAfter,
    validUntil: result.validUntil,
    active: result.active,
  }
}

export function encodeRevokeAgent(config: RevokeAgentConfig): { to: Address; data: Hex } {
  return encodeRemoveAgent(config.validatorAddress, config.agentAddress)
}
