import { randomUUID } from "node:crypto"
import type { Hex, Address } from "viem"
import { generateSessionKey, isSessionKeyActive, signUserOpAsAgent } from "@sigloop/agent"
import { encodeRevokeAgent } from "@sigloop/agent/advanced"
import type { AgentsStore } from "../stores/agents.js"
import type { WalletsStore } from "../stores/wallets.js"
import type { PoliciesStore } from "../stores/policies.js"
import type { KeysService } from "./keys.js"
import type { EventsStore } from "../stores/events.js"
import type {
  AgentRecord,
  AgentResponse,
  CreateAgentRequest,
  AgentPolicyConfig,
} from "../types.js"

export type AgentService = {
  create: (walletId: string, request: CreateAgentRequest) => { agent: AgentResponse; sessionKey: string }
  get: (id: string) => AgentResponse
  list: (walletId?: string) => AgentResponse[]
  delete: (id: string) => void
  revoke: (id: string) => AgentResponse
  signUserOp: (agentId: string, userOpHash: Hex) => Promise<Hex>
  getPolicy: (agentId: string) => AgentPolicyConfig | null
  getSession: (agentId: string) => { active: boolean; expiresAt: number; remainingSeconds: number }
}

export type AgentServiceDeps = {
  agentsStore: AgentsStore
  walletsStore: WalletsStore
  policiesStore: PoliciesStore
  keysService: KeysService
  eventsStore: EventsStore
}

function stripPrivateKey(agent: AgentRecord): AgentResponse {
  const { sessionPrivateKey: _, ...rest } = agent
  return rest
}

export function createAgentService(deps: AgentServiceDeps): AgentService {
  const { agentsStore, walletsStore, policiesStore, keysService, eventsStore } = deps

  return {
    create(walletId, request) {
      const wallet = walletsStore.get(walletId)
      if (!wallet) throw new Error("Wallet not found")
      if (!request.name) throw new Error("Name is required")

      const duration = request.sessionDuration || 86400
      const sessionKey = generateSessionKey(duration)
      const id = randomUUID()
      const now = new Date().toISOString()

      if (request.policyId) {
        const policy = policiesStore.get(request.policyId)
        if (!policy) throw new Error("Policy not found")
      }

      const agent: AgentRecord = {
        id,
        walletId,
        name: request.name,
        address: sessionKey.address as Address,
        sessionPrivateKey: sessionKey.privateKey,
        policyId: request.policyId || null,
        status: "active",
        expiresAt: sessionKey.expiresAt,
        createdAt: now,
        updatedAt: now,
        revokedAt: null,
      }

      keysService.storeKey(id, sessionKey.address, sessionKey.privateKey)
      agentsStore.create(agent)

      eventsStore.broadcast({
        type: "agent:created",
        timestamp: now,
        data: { agentId: id, walletId, name: request.name, address: sessionKey.address },
      })

      return {
        agent: stripPrivateKey(agent),
        sessionKey: sessionKey.privateKey,
      }
    },

    get(id) {
      const agent = agentsStore.get(id)
      if (!agent) throw new Error("Agent not found")
      return stripPrivateKey(agent)
    },

    list(walletId) {
      const agents = walletId ? agentsStore.listByWallet(walletId) : agentsStore.list()
      return agents.map(stripPrivateKey)
    },

    delete(id) {
      const agent = agentsStore.get(id)
      if (!agent) throw new Error("Agent not found")
      agentsStore.delete(id)
      keysService.deleteKey(id)
    },

    revoke(id) {
      const agent = agentsStore.get(id)
      if (!agent) throw new Error("Agent not found")
      if (agent.status === "revoked") throw new Error("Agent already revoked")

      const now = new Date().toISOString()
      const updated = agentsStore.update(id, {
        status: "revoked",
        revokedAt: now,
      })

      keysService.deleteKey(id)

      eventsStore.broadcast({
        type: "agent:revoked",
        timestamp: now,
        data: { agentId: id, walletId: agent.walletId },
      })

      return stripPrivateKey(updated!)
    },

    async signUserOp(agentId, userOpHash) {
      const agent = agentsStore.get(agentId)
      if (!agent) throw new Error("Agent not found")
      if (agent.status !== "active") throw new Error("Agent is not active")

      const privateKey = keysService.retrievePrivateKey(agentId)
      if (!privateKey) throw new Error("Agent key not found")

      return signUserOpAsAgent(agent.address, privateKey, userOpHash)
    },

    getPolicy(agentId) {
      const agent = agentsStore.get(agentId)
      if (!agent) throw new Error("Agent not found")
      if (!agent.policyId) return null

      const policy = policiesStore.get(agent.policyId)
      if (!policy) return null

      return policy.config as AgentPolicyConfig
    },

    getSession(agentId) {
      const agent = agentsStore.get(agentId)
      if (!agent) throw new Error("Agent not found")

      const now = Math.floor(Date.now() / 1000)
      const remaining = Math.max(0, agent.expiresAt - now)

      return {
        active: agent.status === "active" && remaining > 0,
        expiresAt: agent.expiresAt,
        remainingSeconds: remaining,
      }
    },
  }
}
