import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createTimeWindow,
  createTimeWindowFromDuration,
  createTimeWindowFromHours,
  createTimeWindowFromDays,
  isTimeWindowActive,
  getTimeWindowRemaining,
} from "../../policy/timewindow.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createTimeWindow", () => {
  it("creates a time window with valid boundaries", () => {
    const now = Math.floor(Date.now() / 1000);
    const result = createTimeWindow(now - 10, now + 3600);
    expect(result.type).toBe("time-window");
    expect(result.validAfter).toBe(now - 10);
    expect(result.validUntil).toBe(now + 3600);
  });

  it("throws when validAfter equals validUntil", () => {
    const t = Math.floor(Date.now() / 1000) + 100;
    expect(() => createTimeWindow(t, t)).toThrow("validAfter must be before validUntil");
  });

  it("throws when validAfter is after validUntil", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(() => createTimeWindow(now + 200, now + 100)).toThrow(
      "validAfter must be before validUntil"
    );
  });

  it("throws when validUntil is in the past", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(() => createTimeWindow(now - 200, now - 100)).toThrow(
      "validUntil must be in the future"
    );
  });
});

describe("createTimeWindowFromDuration", () => {
  it("creates a time window with the given duration", () => {
    const now = Math.floor(Date.now() / 1000);
    const result = createTimeWindowFromDuration(3600);
    expect(result.type).toBe("time-window");
    expect(result.validAfter).toBeGreaterThanOrEqual(now - 1);
    expect(result.validAfter).toBeLessThanOrEqual(now + 1);
    expect(result.validUntil).toBeGreaterThanOrEqual(now + 3599);
    expect(result.validUntil).toBeLessThanOrEqual(now + 3601);
  });

  it("throws for zero duration", () => {
    expect(() => createTimeWindowFromDuration(0)).toThrow("Duration must be positive");
  });

  it("throws for negative duration", () => {
    expect(() => createTimeWindowFromDuration(-100)).toThrow("Duration must be positive");
  });
});

describe("createTimeWindowFromHours", () => {
  it("creates a time window of 1 hour", () => {
    const now = Math.floor(Date.now() / 1000);
    const result = createTimeWindowFromHours(1);
    expect(result.validUntil - result.validAfter).toBe(3600);
  });

  it("creates a time window of 24 hours", () => {
    const result = createTimeWindowFromHours(24);
    expect(result.validUntil - result.validAfter).toBe(86400);
  });
});

describe("createTimeWindowFromDays", () => {
  it("creates a time window of 1 day", () => {
    const result = createTimeWindowFromDays(1);
    expect(result.validUntil - result.validAfter).toBe(86400);
  });

  it("creates a time window of 7 days", () => {
    const result = createTimeWindowFromDays(7);
    expect(result.validUntil - result.validAfter).toBe(604800);
  });
});

describe("isTimeWindowActive", () => {
  it("returns true when current time is within the window", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now - 100, validUntil: now + 100 };
    expect(isTimeWindowActive(window)).toBe(true);
  });

  it("returns false when current time is before the window", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now + 100, validUntil: now + 200 };
    expect(isTimeWindowActive(window)).toBe(false);
  });

  it("returns false when current time is after the window", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now - 200, validUntil: now - 100 };
    expect(isTimeWindowActive(window)).toBe(false);
  });
});

describe("getTimeWindowRemaining", () => {
  it("returns positive remaining time for active window", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now - 100, validUntil: now + 500 };
    const remaining = getTimeWindowRemaining(window);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(500);
  });

  it("returns 0 for expired window", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now - 200, validUntil: now - 100 };
    expect(getTimeWindowRemaining(window)).toBe(0);
  });

  it("returns full duration for a window not yet started", () => {
    const now = Math.floor(Date.now() / 1000);
    const window = { type: "time-window" as const, validAfter: now + 100, validUntil: now + 600 };
    expect(getTimeWindowRemaining(window)).toBe(500);
  });
});
