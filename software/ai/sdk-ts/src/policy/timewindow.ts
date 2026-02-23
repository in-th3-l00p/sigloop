import type { TimeWindow } from "../types/policy.js";

export function createTimeWindow(validAfter: number, validUntil: number): TimeWindow {
  if (validAfter >= validUntil) {
    throw new Error("validAfter must be before validUntil");
  }

  const now = Math.floor(Date.now() / 1000);
  if (validUntil <= now) {
    throw new Error("validUntil must be in the future");
  }

  return {
    type: "time-window",
    validAfter,
    validUntil,
  };
}

export function createTimeWindowFromDuration(durationSeconds: number): TimeWindow {
  if (durationSeconds <= 0) {
    throw new Error("Duration must be positive");
  }

  const now = Math.floor(Date.now() / 1000);
  return {
    type: "time-window",
    validAfter: now,
    validUntil: now + durationSeconds,
  };
}

export function createTimeWindowFromHours(hours: number): TimeWindow {
  return createTimeWindowFromDuration(hours * 3600);
}

export function createTimeWindowFromDays(days: number): TimeWindow {
  return createTimeWindowFromDuration(days * 86400);
}

export function isTimeWindowActive(window: TimeWindow): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= window.validAfter && now < window.validUntil;
}

export function getTimeWindowRemaining(window: TimeWindow): number {
  const now = Math.floor(Date.now() / 1000);
  if (now >= window.validUntil) {
    return 0;
  }
  if (now < window.validAfter) {
    return window.validUntil - window.validAfter;
  }
  return window.validUntil - now;
}
