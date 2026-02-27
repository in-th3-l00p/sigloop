import { createX402Policy, encodeX402Budget } from "../src/index.js"

async function main() {
  const budget = createX402Policy({
    maxPerRequest: 1000000n,
    dailyBudget: 10000000n,
    totalBudget: 100000000n,
    allowedDomains: ["api.example.com", "data.provider.io"],
  })

  console.log("Budget:", budget)

  const encoded = encodeX402Budget(budget)
  console.log("Encoded:", encoded)
  console.log("Encoded length:", encoded.length, "chars")
}

main().catch(console.error)
