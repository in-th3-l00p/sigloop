import type { Address } from "viem";
import type { PaymentRecord, X402Policy } from "../types/x402.js";

export class BudgetTracker {
  private records: PaymentRecord[] = [];
  private readonly policy: X402Policy;

  constructor(policy: X402Policy) {
    this.policy = policy;
  }

  canSpend(amount: bigint, asset: Address, domain?: string): boolean {
    if (amount > this.policy.maxPerRequest) {
      return false;
    }

    if (domain && this.policy.allowedDomains.length > 0) {
      if (!this.policy.allowedDomains.includes(domain)) {
        return false;
      }
    }

    if (this.policy.allowedAssets.length > 0) {
      const normalizedAsset = asset.toLowerCase();
      const allowed = this.policy.allowedAssets.some(
        (a) => a.toLowerCase() === normalizedAsset
      );
      if (!allowed) {
        return false;
      }
    }

    const dailySpent = this.getDailySpend(asset);
    if (dailySpent + amount > this.policy.maxDaily) {
      return false;
    }

    return true;
  }

  recordPayment(record: PaymentRecord): void {
    this.records.push(record);
  }

  getDailySpend(asset?: Address): bigint {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    return this.records
      .filter((r) => {
        if (r.timestamp < oneDayAgo) return false;
        if (asset && r.asset.toLowerCase() !== asset.toLowerCase()) return false;
        return true;
      })
      .reduce((sum, r) => sum + r.amount, 0n);
  }

  getTotalSpend(asset?: Address): bigint {
    return this.records
      .filter((r) => {
        if (asset && r.asset.toLowerCase() !== asset.toLowerCase()) return false;
        return true;
      })
      .reduce((sum, r) => sum + r.amount, 0n);
  }

  getRemainingDailyBudget(asset?: Address): bigint {
    const spent = this.getDailySpend(asset);
    const remaining = this.policy.maxDaily - spent;
    return remaining > 0n ? remaining : 0n;
  }

  getRemainingPerRequestBudget(): bigint {
    return this.policy.maxPerRequest;
  }

  getPaymentHistory(): PaymentRecord[] {
    return [...this.records];
  }

  getPaymentCount(): number {
    return this.records.length;
  }

  clearHistory(): void {
    this.records = [];
  }

  pruneExpiredRecords(maxAgeSeconds: number = 604800): void {
    const cutoff = Math.floor(Date.now() / 1000) - maxAgeSeconds;
    this.records = this.records.filter((r) => r.timestamp >= cutoff);
  }
}
