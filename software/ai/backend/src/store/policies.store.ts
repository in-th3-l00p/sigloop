import type { Policy } from "../types/policy.js";

const policies = new Map<string, Policy>();

export const policiesStore = {
  create(policy: Policy): Policy {
    policies.set(policy.id, policy);
    return policy;
  },

  get(id: string): Policy | undefined {
    return policies.get(id);
  },

  list(): Policy[] {
    return Array.from(policies.values());
  },

  update(id: string, data: Partial<Policy>): Policy | undefined {
    const existing = policies.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    policies.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return policies.delete(id);
  },

  clear(): void {
    policies.clear();
  },
};
