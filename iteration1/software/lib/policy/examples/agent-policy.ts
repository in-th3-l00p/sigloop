import { createAgentPolicy, encodeAgentPolicy, validateAgentPolicy, isPolicyActive } from "../src/index.js"

async function main() {
  const policy = createAgentPolicy({
    allowedTargets: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    allowedSelectors: ["0xa9059cbb", "0x095ea7b3"],
    maxAmountPerTx: 1000000n,
    dailyLimit: 5000000n,
    weeklyLimit: 20000000n,
  })

  console.log("Policy:", policy)
  console.log("Valid:", validateAgentPolicy(policy))
  console.log("Active:", isPolicyActive(policy))

  const encoded = encodeAgentPolicy(policy)
  console.log("Encoded:", encoded)
  console.log("Encoded length:", encoded.length, "chars")
}

main().catch(console.error)
