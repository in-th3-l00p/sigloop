import type { Address, Hex, LocalAccount } from "viem"
import type { AgentPolicy } from "@sigloop/policy"

export type SessionKey = {
  privateKey: Hex
  address: Address
  account: LocalAccount
  expiresAt: number
}

export type Agent = {
  address: Address
  sessionKey: SessionKey
  policy: AgentPolicy
  signUserOp: (userOpHash: Hex) => Promise<Hex>
}

export type CreateAgentConfig = {
  validatorAddress: Address
  policy?: Partial<AgentPolicy>
  sessionDuration?: number
}

export type LoadAgentConfig = {
  privateKey: Hex
  validatorAddress: Address
  walletAddress: Address
  sessionDuration?: number
}

export type RevokeAgentConfig = {
  validatorAddress: Address
  agentAddress: Address
}

export type SerializedSessionKey = {
  privateKey: Hex
  address: Address
  expiresAt: number
}
