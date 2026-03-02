import { encodeFunctionData } from "viem"
import type { Address, Hex } from "viem"
import type { AgentPolicy } from "@sigloop/policy"
import { encodeInstallAgentValidator, AGENT_PERMISSION_VALIDATOR_ABI } from "@sigloop/policy/advanced"

export function encodeInstallAgent(agentAddress: Address, policy: AgentPolicy): Hex {
  return encodeInstallAgentValidator(agentAddress, policy)
}

export function encodeAddAgent(
  validatorAddress: Address,
  agentAddress: Address,
  policy: AgentPolicy,
): { to: Address; data: Hex } {
  const data = encodeFunctionData({
    abi: AGENT_PERMISSION_VALIDATOR_ABI,
    functionName: "addAgent",
    args: [
      agentAddress,
      {
        allowedTargets: policy.allowedTargets,
        allowedSelectors: policy.allowedSelectors.map((s) => s.slice(0, 10) as Hex),
        maxAmountPerTx: policy.maxAmountPerTx,
        dailyLimit: policy.dailyLimit,
        weeklyLimit: policy.weeklyLimit,
        validAfter: policy.validAfter,
        validUntil: policy.validUntil,
        active: policy.active,
      },
    ],
  })

  return { to: validatorAddress, data }
}

export function encodeRemoveAgent(
  validatorAddress: Address,
  agentAddress: Address,
): { to: Address; data: Hex } {
  const data = encodeFunctionData({
    abi: AGENT_PERMISSION_VALIDATOR_ABI,
    functionName: "removeAgent",
    args: [agentAddress],
  })

  return { to: validatorAddress, data }
}
