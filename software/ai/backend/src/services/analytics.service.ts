import { paymentsStore } from "../store/payments.store.js";
import { agentsStore } from "../store/agents.store.js";
import type { Payment } from "../types/payment.js";

interface SpendingDataPoint {
  period: string;
  totalSpent: string;
  transactionCount: number;
}

interface AgentActivityEntry {
  agentId: string;
  name: string;
  walletId: string;
  totalSpent: string;
  transactionCount: number;
  lastActive: string | null;
  domains: string[];
}

export class AnalyticsService {
  getSpending(params?: {
    period?: "hourly" | "daily" | "weekly" | "monthly";
    startDate?: string;
    endDate?: string;
    walletId?: string;
    agentId?: string;
  }): SpendingDataPoint[] {
    let payments = paymentsStore.list().filter((p) => p.status === "completed");

    if (params?.walletId) {
      payments = payments.filter((p) => p.walletId === params.walletId);
    }
    if (params?.agentId) {
      payments = payments.filter((p) => p.agentId === params.agentId);
    }
    if (params?.startDate) {
      const start = new Date(params.startDate).getTime();
      payments = payments.filter((p) => new Date(p.createdAt).getTime() >= start);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate).getTime();
      payments = payments.filter((p) => new Date(p.createdAt).getTime() <= end);
    }

    const period = params?.period ?? "daily";
    const buckets = new Map<string, { spent: number; count: number }>();

    for (const payment of payments) {
      const key = this.getBucketKey(payment.createdAt, period);
      const existing = buckets.get(key) ?? { spent: 0, count: 0 };
      existing.spent += parseFloat(payment.amount);
      existing.count++;
      buckets.set(key, existing);
    }

    return Array.from(buckets.entries())
      .map(([period, data]) => ({
        period,
        totalSpent: data.spent.toFixed(6),
        transactionCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  getAgentActivity(params?: {
    walletId?: string;
    limit?: number;
    sortBy?: "spent" | "transactions" | "recent";
  }): AgentActivityEntry[] {
    let agents = agentsStore.list();

    if (params?.walletId) {
      agents = agents.filter((a) => a.walletId === params.walletId);
    }

    const entries: AgentActivityEntry[] = agents.map((agent) => {
      const agentPayments = paymentsStore
        .list()
        .filter((p) => p.agentId === agent.id && p.status === "completed");

      const totalSpent = agentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const domains = [...new Set(agentPayments.map((p) => p.domain))];
      const lastPayment = agentPayments[0];

      return {
        agentId: agent.id,
        name: agent.name,
        walletId: agent.walletId,
        totalSpent: totalSpent.toFixed(6),
        transactionCount: agentPayments.length,
        lastActive: lastPayment?.createdAt ?? null,
        domains,
      };
    });

    const sortBy = params?.sortBy ?? "spent";
    entries.sort((a, b) => {
      if (sortBy === "spent") return parseFloat(b.totalSpent) - parseFloat(a.totalSpent);
      if (sortBy === "transactions") return b.transactionCount - a.transactionCount;
      if (sortBy === "recent") {
        if (!a.lastActive) return 1;
        if (!b.lastActive) return -1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      return 0;
    });

    const limit = params?.limit ?? 50;
    return entries.slice(0, limit);
  }

  getTopConsumers(limit: number = 10): Array<{
    agentId: string;
    name: string;
    totalSpent: string;
    transactionCount: number;
  }> {
    return this.getAgentActivity({ limit, sortBy: "spent" }).map((entry) => ({
      agentId: entry.agentId,
      name: entry.name,
      totalSpent: entry.totalSpent,
      transactionCount: entry.transactionCount,
    }));
  }

  private getBucketKey(
    timestamp: string,
    period: "hourly" | "daily" | "weekly" | "monthly"
  ): string {
    const date = new Date(timestamp);

    switch (period) {
      case "hourly": {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        const d = String(date.getUTCDate()).padStart(2, "0");
        const h = String(date.getUTCHours()).padStart(2, "0");
        return `${y}-${m}-${d}T${h}:00:00Z`;
      }
      case "daily": {
        return timestamp.split("T")[0];
      }
      case "weekly": {
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setUTCDate(diff);
        const y = monday.getUTCFullYear();
        const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
        const d = String(monday.getUTCDate()).padStart(2, "0");
        return `${y}-W${m}-${d}`;
      }
      case "monthly": {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      }
    }
  }
}

export const analyticsService = new AnalyticsService();
