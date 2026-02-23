export interface SpendingLimit {
  maxAmount: string;
  period: "hourly" | "daily" | "weekly" | "monthly";
  currency: string;
}

export interface Allowlist {
  addresses: string[];
  domains: string[];
}

export interface TimeWindow {
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
  timezone: string;
}

export interface PolicyRule {
  type: "spending_limit" | "allowlist" | "time_window";
  spendingLimit?: SpendingLimit;
  allowlist?: Allowlist;
  timeWindow?: TimeWindow;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  description?: string;
  rules: PolicyRule[];
}

export interface PolicyResponse {
  policy: Policy;
}

export interface PolicyListResponse {
  policies: Policy[];
  total: number;
}
