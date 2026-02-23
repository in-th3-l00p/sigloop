import { paymentsStore } from "../store/payments.store.js";
import { agentsStore } from "../store/agents.store.js";
import { walletsStore } from "../store/wallets.store.js";
import type { Payment, RecordPaymentRequest, PaymentStats } from "../types/payment.js";

export class PaymentService {
  record(request: RecordPaymentRequest): Payment {
    if (!request.agentId || request.agentId.trim().length === 0) {
      throw new Error("agentId is required");
    }
    if (!request.walletId || request.walletId.trim().length === 0) {
      throw new Error("walletId is required");
    }
    if (!request.domain || request.domain.trim().length === 0) {
      throw new Error("domain is required");
    }
    if (!request.amount) {
      throw new Error("amount is required");
    }

    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    const agent = agentsStore.get(request.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${request.agentId}`);
    }

    const wallet = walletsStore.get(request.walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${request.walletId}`);
    }

    if (agent.walletId !== request.walletId) {
      throw new Error("Agent does not belong to the specified wallet");
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      agentId: request.agentId,
      walletId: request.walletId,
      domain: request.domain.trim(),
      amount: request.amount,
      currency: request.currency ?? "USDC",
      status: "completed",
      metadata: request.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    return paymentsStore.append(payment);
  }

  list(filters?: {
    agentId?: string;
    walletId?: string;
    domain?: string;
    startDate?: string;
    endDate?: string;
  }): Payment[] {
    if (!filters) return paymentsStore.list();

    let results = paymentsStore.list();

    if (filters.agentId) {
      results = results.filter((p) => p.agentId === filters.agentId);
    }
    if (filters.walletId) {
      results = results.filter((p) => p.walletId === filters.walletId);
    }
    if (filters.domain) {
      results = results.filter((p) => p.domain === filters.domain);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      results = results.filter((p) => new Date(p.createdAt).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      results = results.filter((p) => new Date(p.createdAt).getTime() <= end);
    }

    return results;
  }

  getStats(): PaymentStats {
    const agg = paymentsStore.aggregate();

    const payments = paymentsStore.list().filter((p) => p.status === "completed");
    const byPeriodMap = new Map<string, { spent: number; count: number }>();

    for (const payment of payments) {
      const date = payment.createdAt.split("T")[0];
      const existing = byPeriodMap.get(date) ?? { spent: 0, count: 0 };
      existing.spent += parseFloat(payment.amount);
      existing.count++;
      byPeriodMap.set(date, existing);
    }

    const byPeriod = Array.from(byPeriodMap.entries())
      .map(([period, data]) => ({
        period,
        spent: data.spent.toFixed(6),
        count: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const byAgent: Record<string, { spent: string; count: number }> = {};
    for (const [key, val] of Object.entries(agg.byAgent)) {
      byAgent[key] = { spent: val.spent.toFixed(6), count: val.count };
    }

    const byDomain: Record<string, { spent: string; count: number }> = {};
    for (const [key, val] of Object.entries(agg.byDomain)) {
      byDomain[key] = { spent: val.spent.toFixed(6), count: val.count };
    }

    return {
      totalSpent: agg.totalSpent.toFixed(6),
      totalTransactions: agg.totalCount,
      byAgent,
      byDomain,
      byPeriod,
    };
  }
}

export const paymentService = new PaymentService();
