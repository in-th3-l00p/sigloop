import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })
import { createWallet, randomSigner, generatePrivateKey } from "../src/index.js"
import { sepolia } from "viem/chains"

const RPC_URL = process.env.ZERODEV_RPC_URL!
const PRIVATE_KEY = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as `0x${string}`

async function main() {
  console.log("--- Random Signer ---")
  const { privateKey, account } = randomSigner()
  console.log("Private key:", privateKey)
  console.log("EOA address:", account.address)

  console.log("\n--- Create Smart Wallet ---")
  const wallet = await createWallet({
    privateKey: PRIVATE_KEY,
    chain: sepolia,
    rpcUrl: RPC_URL,
  })

  console.log("Smart account address:", wallet.address)

  console.log("\n--- Sign Message ---")
  const message = "hello from sigloop"
  const signature = await wallet.signMessage(message)
  console.log("Message:", message)
  console.log("Signature:", signature)

  console.log("\n--- Verify Signature ---")
  const isValid = await wallet.verifySignature(message, signature)
  console.log("Valid:", isValid)

  console.log("\n--- Counterfactual Addresses (index) ---")
  for (let i = 0n; i < 3n; i++) {
    const w = await createWallet({
      privateKey: PRIVATE_KEY,
      chain: sepolia,
      rpcUrl: RPC_URL,
      index: i,
    })
    console.log(`Index ${i}:`, w.address)
  }
}

main().catch(console.error)
