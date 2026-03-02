import {
  generateSessionKey,
  encodeInstallAgent,
  encodeAddAgent,
  encodeRemoveAgent,
  signUserOpAsAgent,
} from "../src/advanced.js"
import { createAgentPolicy } from "@sigloop/policy"

async function main() {
  const validatorAddress = "0x1111111111111111111111111111111111111111"

  const sessionKey = generateSessionKey(86400)
  console.log("Session key address:", sessionKey.address)

  const policy = createAgentPolicy({
    allowedTargets: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
    maxAmountPerTx: 1000000n,
    dailyLimit: 5000000n,
    weeklyLimit: 20000000n,
  })

  const installData = encodeInstallAgent(sessionKey.address, policy)
  console.log("Install data:", installData.slice(0, 66) + "...")

  const addAgent = encodeAddAgent(validatorAddress, sessionKey.address, policy)
  console.log("Add agent tx to:", addAgent.to)
  console.log("Add agent data:", addAgent.data.slice(0, 66) + "...")

  const userOpHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  const sig = await signUserOpAsAgent(
    sessionKey.address,
    sessionKey.privateKey,
    userOpHash,
  )
  console.log("UserOp signature:", sig.slice(0, 42) + "...")

  const remove = encodeRemoveAgent(validatorAddress, sessionKey.address)
  console.log("Remove agent tx to:", remove.to)
}

main().catch(console.error)
