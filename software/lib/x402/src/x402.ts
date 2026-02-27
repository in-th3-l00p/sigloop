import type { X402Config, BudgetState } from "./types.js"
import { createBudgetTracker } from "./budget.js"
import { createX402Fetch } from "./middleware.js"
import {
  DEFAULT_MAX_PER_REQUEST,
  DEFAULT_DAILY_BUDGET,
  DEFAULT_TOTAL_BUDGET,
} from "./constants.js"

export function createX402Client(config: X402Config): {
  fetch: typeof fetch
  getBudget: () => BudgetState
} {
  const tracker = createBudgetTracker({
    maxPerRequest: config.maxPerRequest ?? DEFAULT_MAX_PER_REQUEST,
    dailyBudget: config.dailyBudget ?? DEFAULT_DAILY_BUDGET,
    totalBudget: config.totalBudget ?? DEFAULT_TOTAL_BUDGET,
    allowedDomains: config.allowedDomains,
  })

  const x402fetch = createX402Fetch(config)

  return {
    fetch: x402fetch,
    getBudget: () => tracker.getState(),
  }
}
