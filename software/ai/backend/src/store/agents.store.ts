import type { Agent } from "../types/agent.js";

const agents = new Map<string, Agent>();

export const agentsStore = {
  create(agent: Agent): Agent {
    agents.set(agent.id, agent);
    return agent;
  },

  get(id: string): Agent | undefined {
    return agents.get(id);
  },

  list(): Agent[] {
    return Array.from(agents.values());
  },

  listByWallet(walletId: string): Agent[] {
    return Array.from(agents.values()).filter((a) => a.walletId === walletId);
  },

  update(id: string, data: Partial<Agent>): Agent | undefined {
    const existing = agents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    agents.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return agents.delete(id);
  },

  deleteByWallet(walletId: string): number {
    let count = 0;
    for (const [id, agent] of agents) {
      if (agent.walletId === walletId) {
        agents.delete(id);
        count++;
      }
    }
    return count;
  },

  clear(): void {
    agents.clear();
  },
};
