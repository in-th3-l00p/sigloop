export interface Payment {
  id: string;
  agentId: string;
  agentName: string;
  domain: string;
  amount: string;
  status: "settled" | "pending" | "failed";
  timestamp: string;
}

export interface PaymentStats {
  totalSpent: string;
  totalPayments: number;
  avgPerPayment: string;
  topDomains: { domain: string; amount: string }[];
}
