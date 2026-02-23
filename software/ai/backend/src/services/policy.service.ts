import { policiesStore } from "../store/policies.store.js";
import type { Policy, CreatePolicyRequest, PolicyRule } from "../types/policy.js";

export class PolicyService {
  create(request: CreatePolicyRequest): Policy {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("Policy name is required");
    }

    if (!request.rules || request.rules.length === 0) {
      throw new Error("At least one policy rule is required");
    }

    for (const rule of request.rules) {
      this.validateRule(rule);
    }

    const now = new Date().toISOString();

    const policy: Policy = {
      id: crypto.randomUUID(),
      name: request.name.trim(),
      description: request.description?.trim() ?? "",
      rules: request.rules,
      createdAt: now,
      updatedAt: now,
    };

    return policiesStore.create(policy);
  }

  get(id: string): Policy {
    const policy = policiesStore.get(id);
    if (!policy) {
      throw new Error(`Policy not found: ${id}`);
    }
    return policy;
  }

  list(): Policy[] {
    return policiesStore.list();
  }

  update(id: string, request: Partial<CreatePolicyRequest>): Policy {
    const existing = policiesStore.get(id);
    if (!existing) {
      throw new Error(`Policy not found: ${id}`);
    }

    if (request.rules) {
      if (request.rules.length === 0) {
        throw new Error("At least one policy rule is required");
      }
      for (const rule of request.rules) {
        this.validateRule(rule);
      }
    }

    const updated = policiesStore.update(id, {
      ...(request.name !== undefined ? { name: request.name.trim() } : {}),
      ...(request.description !== undefined ? { description: request.description.trim() } : {}),
      ...(request.rules !== undefined ? { rules: request.rules } : {}),
    });

    return updated!;
  }

  delete(id: string): void {
    const policy = policiesStore.get(id);
    if (!policy) {
      throw new Error(`Policy not found: ${id}`);
    }
    policiesStore.delete(id);
  }

  compose(policyIds: string[]): PolicyRule[] {
    const allRules: PolicyRule[] = [];
    for (const id of policyIds) {
      const policy = policiesStore.get(id);
      if (!policy) {
        throw new Error(`Policy not found: ${id}`);
      }
      allRules.push(...policy.rules);
    }
    return allRules;
  }

  private validateRule(rule: PolicyRule): void {
    const validTypes = ["spending_limit", "allowlist", "time_window"];
    if (!validTypes.includes(rule.type)) {
      throw new Error(`Invalid rule type: ${rule.type}`);
    }

    if (rule.type === "spending_limit") {
      if (!rule.spendingLimit) {
        throw new Error("spending_limit rule requires spendingLimit configuration");
      }
      const amount = parseFloat(rule.spendingLimit.maxAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("spendingLimit.maxAmount must be a positive number");
      }
      const validPeriods = ["hourly", "daily", "weekly", "monthly"];
      if (!validPeriods.includes(rule.spendingLimit.period)) {
        throw new Error(`Invalid period: ${rule.spendingLimit.period}`);
      }
    }

    if (rule.type === "allowlist") {
      if (!rule.allowlist) {
        throw new Error("allowlist rule requires allowlist configuration");
      }
      if (rule.allowlist.addresses.length === 0 && rule.allowlist.domains.length === 0) {
        throw new Error("Allowlist must contain at least one address or domain");
      }
    }

    if (rule.type === "time_window") {
      if (!rule.timeWindow) {
        throw new Error("time_window rule requires timeWindow configuration");
      }
      if (rule.timeWindow.startHour < 0 || rule.timeWindow.startHour > 23) {
        throw new Error("startHour must be between 0 and 23");
      }
      if (rule.timeWindow.endHour < 0 || rule.timeWindow.endHour > 23) {
        throw new Error("endHour must be between 0 and 23");
      }
    }
  }
}

export const policyService = new PolicyService();
