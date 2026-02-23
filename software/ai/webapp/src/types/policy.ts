export interface SpendingLimit {
  maxPerTx: string;
  dailyLimit: string;
  weeklyLimit: string;
}

export interface Allowlist {
  contracts: string[];
  functions: string[];
}

export interface TimeWindow {
  validAfter: string;
  validUntil: string;
}

export interface Policy {
  id: string;
  name: string;
  spending: SpendingLimit;
  allowlist: Allowlist;
  timeWindow: TimeWindow;
  createdAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  spending: SpendingLimit;
  allowlist: Allowlist;
  timeWindow: TimeWindow;
}
