import { randomUUID } from "node:crypto"
import type { Hex, Address } from "viem"
import {
  createAgentPolicy,
  createX402Policy,
  createSpendingPolicy,
  encodeAgentPolicy,
  encodeX402Budget,
  validateAgentPolicy,
} from "@sigloop/policy"
import { createPolicyFromRules } from "@sigloop/policy/advanced"
import type { PoliciesStore } from "../stores/policies.js"
import type {
  PolicyRecord,
  CreatePolicyRequest,
  AgentPolicyConfig,
  X402PolicyConfig,
  SpendingPolicyConfig,
} from "../types.js"

export type PolicyService = {
  create: (request: CreatePolicyRequest) => PolicyRecord
  get: (id: string) => PolicyRecord
  list: () => PolicyRecord[]
  update: (id: string, request: Partial<CreatePolicyRequest>) => PolicyRecord
  delete: (id: string) => void
  encode: (id: string) => Hex
  compose: (policyIds: string[]) => PolicyRecord
}

export type PolicyServiceDeps = {
  policiesStore: PoliciesStore
}

export function createPolicyService(deps: PolicyServiceDeps): PolicyService {
  const { policiesStore } = deps

  function validateConfig(type: string, config: any) {
    if (type === "agent") {
      const c = config as AgentPolicyConfig
      if (!c.validUntil && c.validUntil !== 0) throw new Error("validUntil is required for agent policy")
    } else if (type === "x402") {
      const c = config as X402PolicyConfig
      if (!c.maxPerRequest) throw new Error("maxPerRequest is required for x402 policy")
      if (!c.dailyBudget) throw new Error("dailyBudget is required for x402 policy")
      if (!c.totalBudget) throw new Error("totalBudget is required for x402 policy")
    } else if (type === "spending") {
      const c = config as SpendingPolicyConfig
      if (!c.token) throw new Error("token is required for spending policy")
      if (!c.dailyLimit) throw new Error("dailyLimit is required for spending policy")
    } else {
      throw new Error("Invalid policy type")
    }
  }

  return {
    create(request) {
      if (!request.name) throw new Error("Name is required")
      if (!request.type) throw new Error("Type is required")
      if (!request.config) throw new Error("Config is required")

      validateConfig(request.type, request.config)

      const id = randomUUID()
      const now = new Date().toISOString()

      const policy: PolicyRecord = {
        id,
        name: request.name,
        type: request.type,
        config: request.config,
        createdAt: now,
        updatedAt: now,
      }

      policiesStore.create(policy)
      return policy
    },

    get(id) {
      const policy = policiesStore.get(id)
      if (!policy) throw new Error("Policy not found")
      return policy
    },

    list() {
      return policiesStore.list()
    },

    update(id, request) {
      const existing = policiesStore.get(id)
      if (!existing) throw new Error("Policy not found")

      if (request.config) {
        validateConfig(request.type || existing.type, request.config)
      }

      const updated = policiesStore.update(id, {
        ...(request.name ? { name: request.name } : {}),
        ...(request.type ? { type: request.type } : {}),
        ...(request.config ? { config: request.config } : {}),
      })

      return updated!
    },

    delete(id) {
      const policy = policiesStore.get(id)
      if (!policy) throw new Error("Policy not found")
      policiesStore.delete(id)
    },

    encode(id) {
      const policy = policiesStore.get(id)
      if (!policy) throw new Error("Policy not found")

      if (policy.type === "agent") {
        const c = policy.config as AgentPolicyConfig
        const agentPolicy = createAgentPolicy({
          allowedTargets: c.allowedTargets as Address[],
          allowedSelectors: c.allowedSelectors as Hex[],
          maxAmountPerTx: BigInt(c.maxAmountPerTx || "0"),
          dailyLimit: BigInt(c.dailyLimit || "0"),
          weeklyLimit: BigInt(c.weeklyLimit || "0"),
          validAfter: c.validAfter || 0,
          validUntil: c.validUntil,
        })
        return encodeAgentPolicy(agentPolicy)
      }

      if (policy.type === "x402") {
        const c = policy.config as X402PolicyConfig
        const x402Budget = createX402Policy({
          maxPerRequest: BigInt(c.maxPerRequest),
          dailyBudget: BigInt(c.dailyBudget),
          totalBudget: BigInt(c.totalBudget),
          allowedDomains: c.allowedDomains,
        })
        return encodeX402Budget(x402Budget)
      }

      throw new Error("Spending policies cannot be encoded directly")
    },

    compose(policyIds) {
      if (!policyIds.length) throw new Error("At least one policy ID is required")

      const policies = policyIds.map((pid) => {
        const p = policiesStore.get(pid)
        if (!p) throw new Error(`Policy ${pid} not found`)
        return p
      })

      const allTargets: Address[] = []
      const allSelectors: Hex[] = []
      let maxAmount = 0n
      let dailyLimit = 0n
      let weeklyLimit = 0n
      let validAfter = 0
      let validUntil = Math.floor(Date.now() / 1000) + 86400 * 365

      for (const p of policies) {
        if (p.type === "agent") {
          const c = p.config as AgentPolicyConfig
          allTargets.push(...(c.allowedTargets as Address[]))
          allSelectors.push(...(c.allowedSelectors as Hex[]))
          const amt = BigInt(c.maxAmountPerTx || "0")
          if (amt > maxAmount) maxAmount = amt
          const dl = BigInt(c.dailyLimit || "0")
          if (dl > dailyLimit) dailyLimit = dl
          const wl = BigInt(c.weeklyLimit || "0")
          if (wl > weeklyLimit) weeklyLimit = wl
          if (c.validAfter > validAfter) validAfter = c.validAfter
          if (c.validUntil < validUntil) validUntil = c.validUntil
        }
      }

      const targets = [...new Set(allTargets)]
      const selectors = [...new Set(allSelectors)]

      const id = randomUUID()
      const now = new Date().toISOString()
      const composed: PolicyRecord = {
        id,
        name: `Composed from ${policyIds.join(", ")}`,
        type: "agent",
        config: {
          allowedTargets: targets,
          allowedSelectors: selectors,
          maxAmountPerTx: maxAmount.toString(),
          dailyLimit: dailyLimit.toString(),
          weeklyLimit: weeklyLimit.toString(),
          validAfter,
          validUntil,
        } as AgentPolicyConfig,
        createdAt: now,
        updatedAt: now,
      }

      policiesStore.create(composed)
      return composed
    },
  }
}
