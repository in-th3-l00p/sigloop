export interface Payment {
  id: string;
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed";
  metadata: Record<string, string>;
  createdAt: string;
}

export interface RecordPaymentRequest {
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface PaymentStats {
  totalSpent: string;
  totalTransactions: number;
  byAgent: Record<string, { spent: string; count: number }>;
  byDomain: Record<string, { spent: string; count: number }>;
  byPeriod: Array<{ period: string; spent: string; count: number }>;
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
}
