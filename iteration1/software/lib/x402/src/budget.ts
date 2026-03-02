import type { BudgetTracker, BudgetTrackerConfig, BudgetState, PaymentRecord } from "./types.js"
import { ONE_DAY_SECONDS } from "./constants.js"

export function createBudgetTracker(config: BudgetTrackerConfig): BudgetTracker {
  let totalSpent = 0n
  let dailySpent = 0n
  let lastDailyReset = Math.floor(Date.now() / 1000)
  const payments: PaymentRecord[] = []

  function resetDailyIfNeeded() {
    const now = Math.floor(Date.now() / 1000)
    if (now - lastDailyReset >= ONE_DAY_SECONDS) {
      dailySpent = 0n
      lastDailyReset = now
    }
  }

  return {
    canSpend(amount: bigint, domain?: string): boolean {
      resetDailyIfNeeded()

      if (amount > config.maxPerRequest) return false
      if (dailySpent + amount > config.dailyBudget) return false
      if (totalSpent + amount > config.totalBudget) return false

      if (domain && config.allowedDomains && config.allowedDomains.length > 0) {
        if (!config.allowedDomains.includes(domain)) return false
      }

      return true
    },

    recordPayment(record: PaymentRecord): void {
      resetDailyIfNeeded()

      totalSpent += record.amount
      dailySpent += record.amount
      payments.push(record)
    },

    getDailySpend(): bigint {
      resetDailyIfNeeded()
      return dailySpent
    },

    getTotalSpent(): bigint {
      return totalSpent
    },

    getRemainingBudget(): bigint {
      if (totalSpent >= config.totalBudget) return 0n
      return config.totalBudget - totalSpent
    },

    getState(): BudgetState {
      resetDailyIfNeeded()
      return {
        totalSpent,
        dailySpent,
        lastDailyReset,
        payments: [...payments],
      }
    },
  }
}
