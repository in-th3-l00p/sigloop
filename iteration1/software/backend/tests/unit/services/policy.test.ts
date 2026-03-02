import { describe, it, expect, beforeEach } from "vitest"
import { createPolicyService } from "../../../src/services/policy.js"
import { createPoliciesStore } from "../../../src/stores/policies.js"

describe("createPolicyService", () => {
  let service: ReturnType<typeof createPolicyService>

  beforeEach(() => {
    service = createPolicyService({ policiesStore: createPoliciesStore() })
  })

  it("creates an agent policy", () => {
    const policy = service.create({
      name: "Agent Policy",
      type: "agent",
      config: {
        allowedTargets: ["0x1111111111111111111111111111111111111111"],
        allowedSelectors: ["0x12345678"],
        maxAmountPerTx: "1000000",
        dailyLimit: "10000000",
        weeklyLimit: "50000000",
        validAfter: 0,
        validUntil: Math.floor(Date.now() / 1000) + 86400,
      },
    })
    expect(policy.id).toBeTruthy()
    expect(policy.type).toBe("agent")
  })

  it("creates an x402 policy", () => {
    const policy = service.create({
      name: "X402 Policy",
      type: "x402",
      config: {
        maxPerRequest: "1000000",
        dailyBudget: "10000000",
        totalBudget: "100000000",
        allowedDomains: ["api.example.com"],
      },
    })
    expect(policy.type).toBe("x402")
  })

  it("creates a spending policy", () => {
    const policy = service.create({
      name: "Spending Policy",
      type: "spending",
      config: {
        agent: "0x1111111111111111111111111111111111111111",
        token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        dailyLimit: "10000000",
        weeklyLimit: "50000000",
      },
    })
    expect(policy.type).toBe("spending")
  })

  it("throws when name is missing", () => {
    expect(() =>
      service.create({ name: "", type: "agent", config: {} as any }),
    ).toThrow("required")
  })

  it("validates x402 config", () => {
    expect(() =>
      service.create({
        name: "Bad",
        type: "x402",
        config: { maxPerRequest: "", dailyBudget: "", totalBudget: "", allowedDomains: [] } as any,
      }),
    ).toThrow("required")
  })

  it("gets a policy by id", () => {
    const policy = service.create({
      name: "Test",
      type: "agent",
      config: {
        allowedTargets: [],
        allowedSelectors: [],
        maxAmountPerTx: "0",
        dailyLimit: "0",
        weeklyLimit: "0",
        validAfter: 0,
        validUntil: 99999999999,
      },
    })
    expect(service.get(policy.id).name).toBe("Test")
  })

  it("throws when policy not found", () => {
    expect(() => service.get("nope")).toThrow("not found")
  })

  it("lists all policies", () => {
    service.create({
      name: "P1",
      type: "agent",
      config: { allowedTargets: [], allowedSelectors: [], maxAmountPerTx: "0", dailyLimit: "0", weeklyLimit: "0", validAfter: 0, validUntil: 99999999999 },
    })
    service.create({
      name: "P2",
      type: "x402",
      config: { maxPerRequest: "1000", dailyBudget: "10000", totalBudget: "100000", allowedDomains: [] },
    })
    expect(service.list()).toHaveLength(2)
  })

  it("updates a policy", () => {
    const policy = service.create({
      name: "Original",
      type: "agent",
      config: { allowedTargets: [], allowedSelectors: [], maxAmountPerTx: "0", dailyLimit: "0", weeklyLimit: "0", validAfter: 0, validUntil: 99999999999 },
    })
    const updated = service.update(policy.id, { name: "Updated" })
    expect(updated.name).toBe("Updated")
  })

  it("deletes a policy", () => {
    const policy = service.create({
      name: "Delete Me",
      type: "agent",
      config: { allowedTargets: [], allowedSelectors: [], maxAmountPerTx: "0", dailyLimit: "0", weeklyLimit: "0", validAfter: 0, validUntil: 99999999999 },
    })
    service.delete(policy.id)
    expect(() => service.get(policy.id)).toThrow("not found")
  })

  it("encodes an agent policy", () => {
    const policy = service.create({
      name: "Encode Me",
      type: "agent",
      config: {
        allowedTargets: ["0x1111111111111111111111111111111111111111"],
        allowedSelectors: ["0x12345678"],
        maxAmountPerTx: "1000000",
        dailyLimit: "10000000",
        weeklyLimit: "50000000",
        validAfter: 0,
        validUntil: 99999999999,
      },
    })
    const encoded = service.encode(policy.id)
    expect(encoded).toMatch(/^0x/)
  })

  it("encodes an x402 policy", () => {
    const policy = service.create({
      name: "X402 Encode",
      type: "x402",
      config: { maxPerRequest: "1000000", dailyBudget: "10000000", totalBudget: "100000000", allowedDomains: ["api.example.com"] },
    })
    const encoded = service.encode(policy.id)
    expect(encoded).toMatch(/^0x/)
  })

  it("throws when encoding spending policy", () => {
    const policy = service.create({
      name: "Spending",
      type: "spending",
      config: { agent: "0x1111111111111111111111111111111111111111", token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", dailyLimit: "10000000", weeklyLimit: "50000000" },
    })
    expect(() => service.encode(policy.id)).toThrow("cannot be encoded")
  })

  it("composes multiple agent policies", () => {
    const p1 = service.create({
      name: "P1",
      type: "agent",
      config: { allowedTargets: ["0x1111111111111111111111111111111111111111"], allowedSelectors: [], maxAmountPerTx: "1000", dailyLimit: "10000", weeklyLimit: "50000", validAfter: 0, validUntil: 99999999999 },
    })
    const p2 = service.create({
      name: "P2",
      type: "agent",
      config: { allowedTargets: ["0x2222222222222222222222222222222222222222"], allowedSelectors: [], maxAmountPerTx: "2000", dailyLimit: "20000", weeklyLimit: "100000", validAfter: 0, validUntil: 99999999999 },
    })
    const composed = service.compose([p1.id, p2.id])
    expect(composed.name).toContain("Composed")
    const cfg = composed.config as any
    expect(cfg.allowedTargets).toHaveLength(2)
  })
})
