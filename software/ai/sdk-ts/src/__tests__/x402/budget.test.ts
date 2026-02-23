import { describe, it, expect, vi, afterEach } from "vitest";
import { BudgetTracker } from "../../x402/budget.js";
import type { PaymentRecord, X402Policy } from "../../types/x402.js";
import type { Address, Hex } from "viem";

const ASSET: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const PAY_TO: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

function makePolicy(overrides: Partial<X402Policy> = {}): X402Policy {
  return {
    maxPerRequest: 1000n,
    maxDaily: 5000n,
    allowedDomains: [],
    allowedAssets: [],
    ...overrides,
  };
}

function makeRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "0xabc" as Hex,
    url: "https://api.example.com/data",
    amount: 100n,
    asset: ASSET,
    payTo: PAY_TO,
    timestamp: Math.floor(Date.now() / 1000),
    authorization: "0xdef" as Hex,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BudgetTracker", () => {
  describe("canSpend", () => {
    it("returns true when amount is within budget", () => {
      const tracker = new BudgetTracker(makePolicy());
      expect(tracker.canSpend(500n, ASSET)).toBe(true);
    });

    it("returns false when amount exceeds maxPerRequest", () => {
      const tracker = new BudgetTracker(makePolicy({ maxPerRequest: 100n }));
      expect(tracker.canSpend(101n, ASSET)).toBe(false);
    });

    it("returns false when daily spend would be exceeded", () => {
      const tracker = new BudgetTracker(makePolicy({ maxDaily: 200n }));
      tracker.recordPayment(makeRecord({ amount: 150n }));
      expect(tracker.canSpend(100n, ASSET)).toBe(false);
    });

    it("returns true when domain is in allowed list", () => {
      const tracker = new BudgetTracker(
        makePolicy({ allowedDomains: ["api.example.com"] })
      );
      expect(tracker.canSpend(100n, ASSET, "api.example.com")).toBe(true);
    });

    it("returns false when domain is not in allowed list", () => {
      const tracker = new BudgetTracker(
        makePolicy({ allowedDomains: ["allowed.com"] })
      );
      expect(tracker.canSpend(100n, ASSET, "forbidden.com")).toBe(false);
    });

    it("ignores domain check when allowedDomains is empty", () => {
      const tracker = new BudgetTracker(makePolicy({ allowedDomains: [] }));
      expect(tracker.canSpend(100n, ASSET, "any.com")).toBe(true);
    });

    it("returns true when asset is in allowed list", () => {
      const tracker = new BudgetTracker(
        makePolicy({ allowedAssets: [ASSET] })
      );
      expect(tracker.canSpend(100n, ASSET)).toBe(true);
    });

    it("returns false when asset is not in allowed list", () => {
      const tracker = new BudgetTracker(
        makePolicy({ allowedAssets: ["0x000000000000000000000000000000000000dEaD" as Address] })
      );
      expect(tracker.canSpend(100n, ASSET)).toBe(false);
    });

    it("ignores asset check when allowedAssets is empty", () => {
      const tracker = new BudgetTracker(makePolicy({ allowedAssets: [] }));
      expect(tracker.canSpend(100n, ASSET)).toBe(true);
    });
  });

  describe("recordPayment", () => {
    it("records a payment", () => {
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord());
      expect(tracker.getPaymentCount()).toBe(1);
    });
  });

  describe("getDailySpend", () => {
    it("returns 0 with no records", () => {
      const tracker = new BudgetTracker(makePolicy());
      expect(tracker.getDailySpend()).toBe(0n);
    });

    it("sums recent payments", () => {
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord({ amount: 100n }));
      tracker.recordPayment(makeRecord({ amount: 200n }));
      expect(tracker.getDailySpend()).toBe(300n);
    });

    it("filters by asset", () => {
      const otherAsset: Address = "0x000000000000000000000000000000000000dEaD";
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord({ amount: 100n, asset: ASSET }));
      tracker.recordPayment(makeRecord({ amount: 200n, asset: otherAsset }));
      expect(tracker.getDailySpend(ASSET)).toBe(100n);
    });

    it("excludes old records", () => {
      const tracker = new BudgetTracker(makePolicy());
      const oldTimestamp = Math.floor(Date.now() / 1000) - 100000;
      tracker.recordPayment(makeRecord({ amount: 100n, timestamp: oldTimestamp }));
      tracker.recordPayment(makeRecord({ amount: 200n }));
      expect(tracker.getDailySpend()).toBe(200n);
    });
  });

  describe("getTotalSpend", () => {
    it("returns 0 with no records", () => {
      const tracker = new BudgetTracker(makePolicy());
      expect(tracker.getTotalSpend()).toBe(0n);
    });

    it("sums all payments regardless of age", () => {
      const tracker = new BudgetTracker(makePolicy());
      const oldTimestamp = Math.floor(Date.now() / 1000) - 100000;
      tracker.recordPayment(makeRecord({ amount: 100n, timestamp: oldTimestamp }));
      tracker.recordPayment(makeRecord({ amount: 200n }));
      expect(tracker.getTotalSpend()).toBe(300n);
    });

    it("filters by asset", () => {
      const otherAsset: Address = "0x000000000000000000000000000000000000dEaD";
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord({ amount: 100n, asset: ASSET }));
      tracker.recordPayment(makeRecord({ amount: 200n, asset: otherAsset }));
      expect(tracker.getTotalSpend(ASSET)).toBe(100n);
    });
  });

  describe("getRemainingDailyBudget", () => {
    it("returns full budget with no spending", () => {
      const tracker = new BudgetTracker(makePolicy({ maxDaily: 5000n }));
      expect(tracker.getRemainingDailyBudget()).toBe(5000n);
    });

    it("returns reduced budget after spending", () => {
      const tracker = new BudgetTracker(makePolicy({ maxDaily: 5000n }));
      tracker.recordPayment(makeRecord({ amount: 1000n }));
      expect(tracker.getRemainingDailyBudget()).toBe(4000n);
    });

    it("returns 0 when budget is exhausted", () => {
      const tracker = new BudgetTracker(makePolicy({ maxDaily: 100n }));
      tracker.recordPayment(makeRecord({ amount: 150n }));
      expect(tracker.getRemainingDailyBudget()).toBe(0n);
    });
  });

  describe("getRemainingPerRequestBudget", () => {
    it("always returns maxPerRequest", () => {
      const tracker = new BudgetTracker(makePolicy({ maxPerRequest: 500n }));
      tracker.recordPayment(makeRecord({ amount: 100n }));
      expect(tracker.getRemainingPerRequestBudget()).toBe(500n);
    });
  });

  describe("getPaymentHistory", () => {
    it("returns a copy of the records", () => {
      const tracker = new BudgetTracker(makePolicy());
      const record = makeRecord();
      tracker.recordPayment(record);
      const history = tracker.getPaymentHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBe(record);
      history.push(makeRecord());
      expect(tracker.getPaymentHistory()).toHaveLength(1);
    });
  });

  describe("getPaymentCount", () => {
    it("returns 0 initially", () => {
      const tracker = new BudgetTracker(makePolicy());
      expect(tracker.getPaymentCount()).toBe(0);
    });

    it("returns correct count", () => {
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord());
      tracker.recordPayment(makeRecord());
      expect(tracker.getPaymentCount()).toBe(2);
    });
  });

  describe("clearHistory", () => {
    it("removes all records", () => {
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord());
      tracker.clearHistory();
      expect(tracker.getPaymentCount()).toBe(0);
      expect(tracker.getDailySpend()).toBe(0n);
    });
  });

  describe("pruneExpiredRecords", () => {
    it("removes records older than maxAgeSeconds", () => {
      const tracker = new BudgetTracker(makePolicy());
      const oldTimestamp = Math.floor(Date.now() / 1000) - 700000;
      tracker.recordPayment(makeRecord({ timestamp: oldTimestamp }));
      tracker.recordPayment(makeRecord());
      tracker.pruneExpiredRecords(604800);
      expect(tracker.getPaymentCount()).toBe(1);
    });

    it("uses default maxAgeSeconds of 604800", () => {
      const tracker = new BudgetTracker(makePolicy());
      const oldTimestamp = Math.floor(Date.now() / 1000) - 700000;
      tracker.recordPayment(makeRecord({ timestamp: oldTimestamp }));
      tracker.pruneExpiredRecords();
      expect(tracker.getPaymentCount()).toBe(0);
    });

    it("keeps recent records", () => {
      const tracker = new BudgetTracker(makePolicy());
      tracker.recordPayment(makeRecord());
      tracker.pruneExpiredRecords();
      expect(tracker.getPaymentCount()).toBe(1);
    });
  });
});
