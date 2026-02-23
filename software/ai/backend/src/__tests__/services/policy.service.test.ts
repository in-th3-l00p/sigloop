import { describe, it, expect, beforeEach } from "vitest";
import { policyService } from "../../services/policy.service.js";
import { policiesStore } from "../../store/policies.store.js";
import type { PolicyRule } from "../../types/policy.js";

const validSpendingRule: PolicyRule = {
  type: "spending_limit",
  spendingLimit: { maxAmount: "100", period: "daily", currency: "USDC" },
};

const validAllowlistRule: PolicyRule = {
  type: "allowlist",
  allowlist: { addresses: ["0x1234"], domains: [] },
};

const validTimeWindowRule: PolicyRule = {
  type: "time_window",
  timeWindow: { startHour: 9, endHour: 17, daysOfWeek: [1, 2, 3, 4, 5], timezone: "UTC" },
};

describe("PolicyService", () => {
  beforeEach(() => {
    policiesStore.clear();
  });

  describe("create", () => {
    it("creates a policy with a spending_limit rule", () => {
      const policy = policyService.create({ name: "Spending Policy", rules: [validSpendingRule] });
      expect(policy).toHaveProperty("id");
      expect(policy.name).toBe("Spending Policy");
      expect(policy.description).toBe("");
      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0].type).toBe("spending_limit");
    });

    it("creates a policy with description", () => {
      const policy = policyService.create({
        name: "Desc Policy",
        description: "A nice description",
        rules: [validSpendingRule],
      });
      expect(policy.description).toBe("A nice description");
    });

    it("trims name and description", () => {
      const policy = policyService.create({
        name: "  Trimmed  ",
        description: "  Trimmed Desc  ",
        rules: [validSpendingRule],
      });
      expect(policy.name).toBe("Trimmed");
      expect(policy.description).toBe("Trimmed Desc");
    });

    it("creates a policy with an allowlist rule", () => {
      const policy = policyService.create({ name: "Allow Policy", rules: [validAllowlistRule] });
      expect(policy.rules[0].type).toBe("allowlist");
    });

    it("creates a policy with a time_window rule", () => {
      const policy = policyService.create({ name: "Time Policy", rules: [validTimeWindowRule] });
      expect(policy.rules[0].type).toBe("time_window");
    });

    it("creates a policy with multiple rules", () => {
      const policy = policyService.create({
        name: "Multi Policy",
        rules: [validSpendingRule, validAllowlistRule, validTimeWindowRule],
      });
      expect(policy.rules).toHaveLength(3);
    });

    it("throws when name is empty", () => {
      expect(() => policyService.create({ name: "", rules: [validSpendingRule] })).toThrow(
        "Policy name is required"
      );
    });

    it("throws when name is whitespace", () => {
      expect(() => policyService.create({ name: "   ", rules: [validSpendingRule] })).toThrow(
        "Policy name is required"
      );
    });

    it("throws when rules array is empty", () => {
      expect(() => policyService.create({ name: "No Rules", rules: [] })).toThrow(
        "At least one policy rule is required"
      );
    });

    it("throws for invalid rule type", () => {
      expect(() =>
        policyService.create({
          name: "Bad Type",
          rules: [{ type: "invalid" as any }],
        })
      ).toThrow("Invalid rule type: invalid");
    });

    it("throws when spending_limit rule has no spendingLimit config", () => {
      expect(() =>
        policyService.create({ name: "Bad Spending", rules: [{ type: "spending_limit" }] })
      ).toThrow("spending_limit rule requires spendingLimit configuration");
    });

    it("throws when spending_limit maxAmount is not a positive number", () => {
      expect(() =>
        policyService.create({
          name: "Bad Amount",
          rules: [
            {
              type: "spending_limit",
              spendingLimit: { maxAmount: "-5", period: "daily", currency: "USDC" },
            },
          ],
        })
      ).toThrow("spendingLimit.maxAmount must be a positive number");
    });

    it("throws when spending_limit maxAmount is NaN", () => {
      expect(() =>
        policyService.create({
          name: "NaN Amount",
          rules: [
            {
              type: "spending_limit",
              spendingLimit: { maxAmount: "abc", period: "daily", currency: "USDC" },
            },
          ],
        })
      ).toThrow("spendingLimit.maxAmount must be a positive number");
    });

    it("throws when spending_limit period is invalid", () => {
      expect(() =>
        policyService.create({
          name: "Bad Period",
          rules: [
            {
              type: "spending_limit",
              spendingLimit: { maxAmount: "100", period: "yearly" as any, currency: "USDC" },
            },
          ],
        })
      ).toThrow("Invalid period: yearly");
    });

    it("throws when allowlist rule has no allowlist config", () => {
      expect(() =>
        policyService.create({ name: "Bad Allowlist", rules: [{ type: "allowlist" }] })
      ).toThrow("allowlist rule requires allowlist configuration");
    });

    it("throws when allowlist has no addresses or domains", () => {
      expect(() =>
        policyService.create({
          name: "Empty Allowlist",
          rules: [{ type: "allowlist", allowlist: { addresses: [], domains: [] } }],
        })
      ).toThrow("Allowlist must contain at least one address or domain");
    });

    it("creates policy when allowlist has only domains", () => {
      const policy = policyService.create({
        name: "Domain Only",
        rules: [{ type: "allowlist", allowlist: { addresses: [], domains: ["example.com"] } }],
      });
      expect(policy.rules[0].allowlist!.domains).toEqual(["example.com"]);
    });

    it("throws when time_window has no timeWindow config", () => {
      expect(() =>
        policyService.create({ name: "Bad TW", rules: [{ type: "time_window" }] })
      ).toThrow("time_window rule requires timeWindow configuration");
    });

    it("throws when startHour is out of range", () => {
      expect(() =>
        policyService.create({
          name: "Bad Start",
          rules: [
            { type: "time_window", timeWindow: { startHour: 25, endHour: 17, daysOfWeek: [], timezone: "UTC" } },
          ],
        })
      ).toThrow("startHour must be between 0 and 23");
    });

    it("throws when startHour is negative", () => {
      expect(() =>
        policyService.create({
          name: "Neg Start",
          rules: [
            { type: "time_window", timeWindow: { startHour: -1, endHour: 17, daysOfWeek: [], timezone: "UTC" } },
          ],
        })
      ).toThrow("startHour must be between 0 and 23");
    });

    it("throws when endHour is out of range", () => {
      expect(() =>
        policyService.create({
          name: "Bad End",
          rules: [
            { type: "time_window", timeWindow: { startHour: 9, endHour: 24, daysOfWeek: [], timezone: "UTC" } },
          ],
        })
      ).toThrow("endHour must be between 0 and 23");
    });

    it("throws when endHour is negative", () => {
      expect(() =>
        policyService.create({
          name: "Neg End",
          rules: [
            { type: "time_window", timeWindow: { startHour: 9, endHour: -1, daysOfWeek: [], timezone: "UTC" } },
          ],
        })
      ).toThrow("endHour must be between 0 and 23");
    });
  });

  describe("get", () => {
    it("returns an existing policy", () => {
      const policy = policyService.create({ name: "Get Policy", rules: [validSpendingRule] });
      expect(policyService.get(policy.id)).toEqual(policy);
    });

    it("throws when policy not found", () => {
      expect(() => policyService.get("nonexistent")).toThrow("Policy not found: nonexistent");
    });
  });

  describe("list", () => {
    it("returns empty array when no policies", () => {
      expect(policyService.list()).toEqual([]);
    });

    it("returns all policies", () => {
      policyService.create({ name: "P1", rules: [validSpendingRule] });
      policyService.create({ name: "P2", rules: [validAllowlistRule] });
      expect(policyService.list()).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("updates policy name", () => {
      const policy = policyService.create({ name: "Old Name", rules: [validSpendingRule] });
      const updated = policyService.update(policy.id, { name: "New Name" });
      expect(updated.name).toBe("New Name");
    });

    it("updates policy description", () => {
      const policy = policyService.create({ name: "Desc Update", rules: [validSpendingRule] });
      const updated = policyService.update(policy.id, { description: "Updated description" });
      expect(updated.description).toBe("Updated description");
    });

    it("updates policy rules", () => {
      const policy = policyService.create({ name: "Rule Update", rules: [validSpendingRule] });
      const updated = policyService.update(policy.id, { rules: [validAllowlistRule] });
      expect(updated.rules).toHaveLength(1);
      expect(updated.rules[0].type).toBe("allowlist");
    });

    it("throws when policy not found", () => {
      expect(() => policyService.update("nonexistent", { name: "Nope" })).toThrow("Policy not found");
    });

    it("throws when updating rules to empty array", () => {
      const policy = policyService.create({ name: "Empty Rules", rules: [validSpendingRule] });
      expect(() => policyService.update(policy.id, { rules: [] })).toThrow(
        "At least one policy rule is required"
      );
    });

    it("validates rules on update", () => {
      const policy = policyService.create({ name: "Bad Update", rules: [validSpendingRule] });
      expect(() =>
        policyService.update(policy.id, { rules: [{ type: "invalid" as any }] })
      ).toThrow("Invalid rule type: invalid");
    });
  });

  describe("delete", () => {
    it("deletes an existing policy", () => {
      const policy = policyService.create({ name: "Delete Me", rules: [validSpendingRule] });
      policyService.delete(policy.id);
      expect(policiesStore.get(policy.id)).toBeUndefined();
    });

    it("throws when policy not found", () => {
      expect(() => policyService.delete("nonexistent")).toThrow("Policy not found");
    });
  });

  describe("compose", () => {
    it("composes rules from multiple policies", () => {
      const p1 = policyService.create({ name: "P1", rules: [validSpendingRule] });
      const p2 = policyService.create({ name: "P2", rules: [validAllowlistRule, validTimeWindowRule] });
      const composed = policyService.compose([p1.id, p2.id]);
      expect(composed).toHaveLength(3);
      expect(composed[0].type).toBe("spending_limit");
      expect(composed[1].type).toBe("allowlist");
      expect(composed[2].type).toBe("time_window");
    });

    it("throws when a policy id is not found", () => {
      const p1 = policyService.create({ name: "P1", rules: [validSpendingRule] });
      expect(() => policyService.compose([p1.id, "nonexistent"])).toThrow("Policy not found");
    });

    it("returns empty array for empty input", () => {
      expect(policyService.compose([])).toEqual([]);
    });
  });
});
