import {
  createPolicyFromRules,
  mergeAllowlists,
  encodeAgentPolicy,
  encodeInstallAgentValidator,
  validateAgentPolicy,
} from "../src/advanced.js"
import type { PolicyRule } from "../src/advanced.js"

async function main() {
  const rules: PolicyRule[] = [
    {
      type: "contractAllowlist",
      allowlist: {
        targets: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
      },
    },
    {
      type: "functionAllowlist",
      allowlist: {
        selectors: ["0xa9059cbb"],
      },
    },
    {
      type: "spendingLimit",
      maxPerTx: 1000000n,
      dailyLimit: 5000000n,
      weeklyLimit: 20000000n,
    },
    {
      type: "timeWindow",
      window: {
        validAfter: Math.floor(Date.now() / 1000),
        validUntil: Math.floor(Date.now() / 1000) + 86400,
      },
    },
  ]

  const policy = createPolicyFromRules(rules)
  console.log("Policy from rules:", policy)
  console.log("Valid:", validateAgentPolicy(policy))

  const merged = mergeAllowlists(
    { targets: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"] },
    { targets: ["0xdAC17F958D2ee523a2206206994597C13D831ec7"] },
  )
  console.log("Merged allowlist:", merged)

  const encoded = encodeAgentPolicy(policy)
  console.log("Encoded policy:", encoded.slice(0, 66) + "...")

  const agentAddress = "0x1111111111111111111111111111111111111111"
  const installData = encodeInstallAgentValidator(agentAddress, policy)
  console.log("Install data:", installData.slice(0, 66) + "...")
}

main().catch(console.error)
