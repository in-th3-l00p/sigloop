import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createBudgetTracker } from "../src/budget.js"
import type { PaymentRecord } from "../src/types.js"

function makeRecord(amount: bigint): PaymentRecord {
  return {
    url: "https://api.example.com/data",
    domain: "api.example.com",
    amount,
    asset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    timestamp: Math.floor(Date.now() / 1000),
  }
}

describe("createBudgetTracker", () => {
  it("returns object with all methods", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    expect(tracker.canSpend).toBeTypeOf("function")
    expect(tracker.recordPayment).toBeTypeOf("function")
    expect(tracker.getDailySpend).toBeTypeOf("function")
    expect(tracker.getTotalSpent).toBeTypeOf("function")
    expect(tracker.getRemainingBudget).toBeTypeOf("function")
    expect(tracker.getState).toBeTypeOf("function")
  })
})

describe("canSpend", () => {
  it("returns true when under all limits", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    expect(tracker.canSpend(50n)).toBe(true)
  })

  it("returns false when exceeding maxPerRequest", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    expect(tracker.canSpend(200n)).toBe(false)
  })

  it("returns false when daily budget exceeded", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 150n,
      totalBudget: 10000n,
    })

    tracker.recordPayment(makeRecord(100n))
    expect(tracker.canSpend(100n)).toBe(false)
  })

  it("returns false when total budget exceeded", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 150n,
    })

    tracker.recordPayment(makeRecord(100n))
    expect(tracker.canSpend(100n)).toBe(false)
  })

  it("returns false for disallowed domain", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
      allowedDomains: ["allowed.com"],
    })

    expect(tracker.canSpend(50n, "disallowed.com")).toBe(false)
  })

  it("returns true for allowed domain", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
      allowedDomains: ["allowed.com"],
    })

    expect(tracker.canSpend(50n, "allowed.com")).toBe(true)
  })

  it("allows any domain when allowedDomains is empty", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    expect(tracker.canSpend(50n, "any.com")).toBe(true)
  })
})

describe("recordPayment", () => {
  it("updates totalSpent and dailySpent", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    tracker.recordPayment(makeRecord(50n))
    expect(tracker.getTotalSpent()).toBe(50n)
    expect(tracker.getDailySpend()).toBe(50n)

    tracker.recordPayment(makeRecord(30n))
    expect(tracker.getTotalSpent()).toBe(80n)
    expect(tracker.getDailySpend()).toBe(80n)
  })
})

describe("getRemainingBudget", () => {
  it("returns total minus spent", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    tracker.recordPayment(makeRecord(100n))
    expect(tracker.getRemainingBudget()).toBe(9900n)
  })

  it("returns 0 when fully spent", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 100n,
    })

    tracker.recordPayment(makeRecord(100n))
    expect(tracker.getRemainingBudget()).toBe(0n)
  })
})

describe("getState", () => {
  it("returns complete snapshot", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    tracker.recordPayment(makeRecord(50n))

    const state = tracker.getState()
    expect(state.totalSpent).toBe(50n)
    expect(state.dailySpent).toBe(50n)
    expect(state.lastDailyReset).toBeGreaterThan(0)
    expect(state.payments.length).toBe(1)
  })

  it("returns a copy of payments array", () => {
    const tracker = createBudgetTracker({
      maxPerRequest: 100n,
      dailyBudget: 1000n,
      totalBudget: 10000n,
    })

    tracker.recordPayment(makeRecord(50n))
    const state = tracker.getState()
    state.payments.push(makeRecord(999n))

    expect(tracker.getState().payments.length).toBe(1)
  })
})
