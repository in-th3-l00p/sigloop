import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createRateLimit,
  createRateLimitPerMinute,
  createRateLimitPerHour,
  createRateLimitPerDay,
  RateLimitTracker,
} from "../../policy/ratelimit.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createRateLimit", () => {
  it("creates a rate limit with valid params", () => {
    const result = createRateLimit(10, 60);
    expect(result.type).toBe("rate-limit");
    expect(result.maxCalls).toBe(10);
    expect(result.intervalSeconds).toBe(60);
  });

  it("throws for zero maxCalls", () => {
    expect(() => createRateLimit(0, 60)).toThrow("maxCalls must be a positive integer");
  });

  it("throws for negative maxCalls", () => {
    expect(() => createRateLimit(-1, 60)).toThrow("maxCalls must be a positive integer");
  });

  it("throws for zero intervalSeconds", () => {
    expect(() => createRateLimit(10, 0)).toThrow("intervalSeconds must be a positive integer");
  });

  it("throws for negative intervalSeconds", () => {
    expect(() => createRateLimit(10, -1)).toThrow("intervalSeconds must be a positive integer");
  });

  it("throws for non-integer maxCalls", () => {
    expect(() => createRateLimit(1.5, 60)).toThrow("maxCalls must be an integer");
  });

  it("throws for non-integer intervalSeconds", () => {
    expect(() => createRateLimit(10, 1.5)).toThrow("intervalSeconds must be an integer");
  });
});

describe("createRateLimitPerMinute", () => {
  it("creates a rate limit with 60-second interval", () => {
    const result = createRateLimitPerMinute(5);
    expect(result.intervalSeconds).toBe(60);
    expect(result.maxCalls).toBe(5);
  });
});

describe("createRateLimitPerHour", () => {
  it("creates a rate limit with 3600-second interval", () => {
    const result = createRateLimitPerHour(100);
    expect(result.intervalSeconds).toBe(3600);
    expect(result.maxCalls).toBe(100);
  });
});

describe("createRateLimitPerDay", () => {
  it("creates a rate limit with 86400-second interval", () => {
    const result = createRateLimitPerDay(1000);
    expect(result.intervalSeconds).toBe(86400);
    expect(result.maxCalls).toBe(1000);
  });
});

describe("RateLimitTracker", () => {
  it("allows calls within the limit", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 3, intervalSeconds: 60 });
    expect(tracker.canProceed()).toBe(true);
    tracker.recordCall();
    expect(tracker.canProceed()).toBe(true);
    tracker.recordCall();
    expect(tracker.canProceed()).toBe(true);
    tracker.recordCall();
    expect(tracker.canProceed()).toBe(false);
  });

  it("throws when recording past the limit", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 1, intervalSeconds: 60 });
    tracker.recordCall();
    expect(() => tracker.recordCall()).toThrow("Rate limit exceeded");
  });

  it("reports remaining calls correctly", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 5, intervalSeconds: 60 });
    expect(tracker.remainingCalls()).toBe(5);
    tracker.recordCall();
    expect(tracker.remainingCalls()).toBe(4);
    tracker.recordCall();
    expect(tracker.remainingCalls()).toBe(3);
  });

  it("returns null for nextAvailableTime when under limit", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 5, intervalSeconds: 60 });
    expect(tracker.nextAvailableTime()).toBeNull();
  });

  it("returns a future time for nextAvailableTime when at limit", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 1, intervalSeconds: 60 });
    tracker.recordCall();
    const next = tracker.nextAvailableTime();
    expect(next).not.toBeNull();
    expect(next!).toBeGreaterThan(Date.now());
  });

  it("resets all call history", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 1, intervalSeconds: 60 });
    tracker.recordCall();
    expect(tracker.canProceed()).toBe(false);
    tracker.reset();
    expect(tracker.canProceed()).toBe(true);
    expect(tracker.remainingCalls()).toBe(1);
  });

  it("prunes expired calls", () => {
    const tracker = new RateLimitTracker({ type: "rate-limit", maxCalls: 1, intervalSeconds: 1 });
    vi.spyOn(Date, "now").mockReturnValue(1000);
    tracker.recordCall();

    vi.spyOn(Date, "now").mockReturnValue(3000);
    expect(tracker.canProceed()).toBe(true);
  });
});
