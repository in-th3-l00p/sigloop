import { createAgent, isSessionKeyActive } from "../src/index.js"

async function main() {
  const agent = createAgent({
    validatorAddress: "0x1111111111111111111111111111111111111111",
    policy: {
      allowedTargets: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
      allowedSelectors: ["0xa9059cbb"],
      maxAmountPerTx: 1000000n,
      dailyLimit: 5000000n,
    },
    sessionDuration: 3600,
  })

  console.log("Agent address:", agent.address)
  console.log("Session key:", agent.sessionKey.privateKey)
  console.log("Expires at:", new Date(agent.sessionKey.expiresAt * 1000).toISOString())
  console.log("Active:", isSessionKeyActive(agent.sessionKey))

  const mockUserOpHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  const sig = await agent.signUserOp(mockUserOpHash)
  console.log("Signature:", sig)
  console.log("Signature length (bytes):", (sig.length - 2) / 2)
}

main().catch(console.error)
