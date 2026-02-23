import type { Payment } from "../types/payment.js";

const payments = new Map<string, Payment>();

export const paymentsStore = {
  append(payment: Payment): Payment {
    payments.set(payment.id, payment);
    return payment;
  },

  get(id: string): Payment | undefined {
    return payments.get(id);
  },

  list(): Payment[] {
    return Array.from(payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  listByAgent(agentId: string): Payment[] {
    return Array.from(payments.values())
      .filter((p) => p.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listByWallet(walletId: string): Payment[] {
    return Array.from(payments.values())
      .filter((p) => p.walletId === walletId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listByDomain(domain: string): Payment[] {
    return Array.from(payments.values())
      .filter((p) => p.domain === domain)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  listByDateRange(start: Date, end: Date): Payment[] {
    return Array.from(payments.values())
      .filter((p) => {
        const t = new Date(p.createdAt).getTime();
        return t >= start.getTime() && t <= end.getTime();
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  aggregate(): {
    totalSpent: number;
    totalCount: number;
    byAgent: Record<string, { spent: number; count: number }>;
    byDomain: Record<string, { spent: number; count: number }>;
  } {
    const byAgent: Record<string, { spent: number; count: number }> = {};
    const byDomain: Record<string, { spent: number; count: number }> = {};
    let totalSpent = 0;
    let totalCount = 0;

    for (const payment of payments.values()) {
      if (payment.status !== "completed") continue;

      const amount = parseFloat(payment.amount);
      totalSpent += amount;
      totalCount++;

      if (!byAgent[payment.agentId]) {
        byAgent[payment.agentId] = { spent: 0, count: 0 };
      }
      byAgent[payment.agentId].spent += amount;
      byAgent[payment.agentId].count++;

      if (!byDomain[payment.domain]) {
        byDomain[payment.domain] = { spent: 0, count: 0 };
      }
      byDomain[payment.domain].spent += amount;
      byDomain[payment.domain].count++;
    }

    return { totalSpent, totalCount, byAgent, byDomain };
  },

  clear(): void {
    payments.clear();
  },
};
