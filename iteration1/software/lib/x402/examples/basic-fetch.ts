import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import { createX402Client } from "../src/index.js"

async function main() {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  const client = createX402Client({
    signer: account,
    chainId: 8453,
    maxPerRequest: 1000000n,
    dailyBudget: 10000000n,
    totalBudget: 100000000n,
    allowedDomains: ["api.example.com"],
  })

  console.log("x402 client created")
  console.log("Signer:", account.address)

  const budget = client.getBudget()
  console.log("Budget state:", budget)
  console.log("Total spent:", budget.totalSpent)
  console.log("Daily spent:", budget.dailySpent)
}

main().catch(console.error)
