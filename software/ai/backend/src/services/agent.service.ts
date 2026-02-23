import { agentsStore } from "../store/agents.store.js";
import { walletsStore } from "../store/wallets.store.js";
import { policiesStore } from "../store/policies.store.js";
import { keyManagerService } from "./keymanager.service.js";
import type { Agent, CreateAgentRequest } from "../types/agent.js";
import { AgentStatus } from "../types/agent.js";

export class AgentService {
  create(walletId: string, request: CreateAgentRequest): { agent: Agent; sessionKey: string } {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("Agent name is required");
    }

    const wallet = walletsStore.get(walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    if (request.policyId) {
      const policy = policiesStore.get(request.policyId);
      if (!policy) {
        throw new Error(`Policy not found: ${request.policyId}`);
      }
    }

    const { publicKey, privateKey } = keyManagerService.generateKeyPair();
    const now = new Date().toISOString();
    const agentId = crypto.randomUUID();

    keyManagerService.storeKey(agentId, publicKey, privateKey);

    const agent: Agent = {
      id: agentId,
      walletId,
      name: request.name.trim(),
      publicKey,
      policyId: request.policyId ?? null,
      status: AgentStatus.ACTIVE,
      permissions: request.permissions ?? [],
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
    };

    agentsStore.create(agent);

    return { agent, sessionKey: privateKey };
  }

  get(id: string): Agent {
    const agent = agentsStore.get(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
    return agent;
  }

  list(): Agent[] {
    return agentsStore.list();
  }

  listByWallet(walletId: string): Agent[] {
    return agentsStore.listByWallet(walletId);
  }

  revoke(id: string): Agent {
    const agent = agentsStore.get(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    if (agent.status === AgentStatus.REVOKED) {
      throw new Error(`Agent is already revoked: ${id}`);
    }

    const now = new Date().toISOString();
    const updated = agentsStore.update(id, {
      status: AgentStatus.REVOKED,
      revokedAt: now,
    });

    keyManagerService.deleteKey(id);

    return updated!;
  }

  delete(id: string): void {
    const agent = agentsStore.get(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
    keyManagerService.deleteKey(id);
    agentsStore.delete(id);
  }
}

export const agentService = new AgentService();
