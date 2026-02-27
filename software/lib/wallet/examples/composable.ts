import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import {
  createSigner,
  generatePrivateKey,
  createEcdsaValidator,
  createSmartAccount,
  createPaymaster,
  createAccountClient,
  sendTransaction,
  sendTransactions,
  signMessage,
  verifySignature,
} from "../src/advanced.js"
import { parseEther } from "viem"

const BUNDLER_RPC_URL = process.env.ZERODEV_RPC_URL!
const PUBLIC_RPC_URL = process.env.PUBLIC_RPC_URL || "https://sepolia.drpc.org"
const PRIVATE_KEY = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as `0x${string}`

async function main() {
  console.log("--- Step 1: Create Signer ---")
  const signer = createSigner(PRIVATE_KEY)
  console.log("EOA:", signer.address)

  console.log("\n--- Step 2: Public Client ---")
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(PUBLIC_RPC_URL),
  })
  console.log("Chain:", sepolia.name, `(${sepolia.id})`)

  console.log("\n--- Step 3: ECDSA Validator ---")
  const validator = await createEcdsaValidator(publicClient, { signer })
  console.log("Validator created")

  console.log("\n--- Step 4: Smart Account ---")
  const account = await createSmartAccount(publicClient, { validator })
  console.log("Smart account:", account.address)

  console.log("\n--- Step 5: Paymaster (sponsored gas) ---")
  const paymasterClient = createPaymaster({
    chain: sepolia,
    rpcUrl: BUNDLER_RPC_URL,
  })
  console.log("Paymaster client created")

  console.log("\n--- Step 6: Account Client ---")
  const client = createAccountClient({
    account,
    chain: sepolia,
    rpcUrl: BUNDLER_RPC_URL,
    publicClient,
    paymaster: {
      type: "sponsor",
      paymasterClient,
    },
  })
  console.log("Account client ready")

  console.log("\n--- Step 7: Sign & Verify ---")
  const message = "composable wallet example"
  const signature = await signMessage(client, message)
  console.log("Signature:", signature)

  const valid = await verifySignature(publicClient, {
    signer: account.address,
    message,
    signature,
  })
  console.log("Valid:", valid)

  console.log("\n--- Step 8: Send Transaction ---")
  const txHash = await sendTransaction(client, {
    to: "0x0000000000000000000000000000000000000001",
    value: parseEther("0"),
  })
  console.log("Tx hash:", txHash)

  console.log("\n--- Step 9: Batch Transactions ---")
  const batchHash = await sendTransactions(client, [
    { to: "0x0000000000000000000000000000000000000001" },
    { to: "0x0000000000000000000000000000000000000002" },
  ])
  console.log("Batch tx hash:", batchHash)

  console.log("\n--- Multiple Accounts from Same Key ---")
  for (let i = 0n; i < 3n; i++) {
    const acct = await createSmartAccount(publicClient, {
      validator,
      index: i,
    })
    console.log(`Account index ${i}:`, acct.address)
  }
}

main().catch(console.error)
