import { createBudgetTracker } from "../src/index.js"

async function main() {
  const tracker = createBudgetTracker({
    maxPerRequest: 1000000n,
    dailyBudget: 10000000n,
    totalBudget: 100000000n,
    allowedDomains: ["api.example.com"],
  })

  console.log("Can spend 500000:", tracker.canSpend(500000n, "api.example.com"))
  console.log("Can spend 2000000:", tracker.canSpend(2000000n, "api.example.com"))
  console.log("Can spend on blocked domain:", tracker.canSpend(500000n, "evil.com"))

  tracker.recordPayment({
    url: "https://api.example.com/data",
    domain: "api.example.com",
    amount: 500000n,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    timestamp: Math.floor(Date.now() / 1000),
  })

  console.log("\nAfter payment:")
  console.log("Daily spend:", tracker.getDailySpend())
  console.log("Total spent:", tracker.getTotalSpent())
  console.log("Remaining budget:", tracker.getRemainingBudget())
  console.log("State:", tracker.getState())
}

main().catch(console.error)
