import type { RateLimit } from "../types/policy.js";

export function createRateLimit(maxCalls: number, intervalSeconds: number): RateLimit {
  if (maxCalls <= 0) {
    throw new Error("maxCalls must be a positive integer");
  }

  if (intervalSeconds <= 0) {
    throw new Error("intervalSeconds must be a positive integer");
  }

  if (!Number.isInteger(maxCalls)) {
    throw new Error("maxCalls must be an integer");
  }

  if (!Number.isInteger(intervalSeconds)) {
    throw new Error("intervalSeconds must be an integer");
  }

  return {
    type: "rate-limit",
    maxCalls,
    intervalSeconds,
  };
}

export function createRateLimitPerMinute(maxCalls: number): RateLimit {
  return createRateLimit(maxCalls, 60);
}

export function createRateLimitPerHour(maxCalls: number): RateLimit {
  return createRateLimit(maxCalls, 3600);
}

export function createRateLimitPerDay(maxCalls: number): RateLimit {
  return createRateLimit(maxCalls, 86400);
}

export class RateLimitTracker {
  private calls: number[] = [];
  private readonly maxCalls: number;
  private readonly intervalMs: number;

  constructor(rateLimit: RateLimit) {
    this.maxCalls = rateLimit.maxCalls;
    this.intervalMs = rateLimit.intervalSeconds * 1000;
  }

  canProceed(): boolean {
    this.pruneExpired();
    return this.calls.length < this.maxCalls;
  }

  recordCall(): void {
    if (!this.canProceed()) {
      throw new Error("Rate limit exceeded");
    }
    this.calls.push(Date.now());
  }

  remainingCalls(): number {
    this.pruneExpired();
    return Math.max(0, this.maxCalls - this.calls.length);
  }

  nextAvailableTime(): number | null {
    this.pruneExpired();
    if (this.calls.length < this.maxCalls) {
      return null;
    }
    const oldest = this.calls[0];
    if (oldest === undefined) {
      return null;
    }
    return oldest + this.intervalMs;
  }

  reset(): void {
    this.calls = [];
  }

  private pruneExpired(): void {
    const cutoff = Date.now() - this.intervalMs;
    this.calls = this.calls.filter((t) => t > cutoff);
  }
}
