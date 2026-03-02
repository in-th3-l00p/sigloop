import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })
import { createWallet, loadWallet } from "../src/index.js"
import { sepolia } from "viem/chains"

const RPC_URL = process.env.ZERODEV_RPC_URL!

async function main() {
  console.log("--- Create New Wallet ---")
  const wallet = await createWallet({
    chain: sepolia,
    rpcUrl: RPC_URL,
  })
  console.log("Address:", wallet.address)
  console.log("Private key:", wallet.privateKey)

  console.log("\n--- Sign Message ---")
  const message = "hello from sigloop"
  const signature = await wallet.signMessage(message)
  console.log("Message:", message)
  console.log("Signature:", signature)

  console.log("\n--- Verify Signature ---")
  const isValid = await wallet.verifySignature(message, signature)
  console.log("Valid:", isValid)

  console.log("\n--- Load Same Wallet ---")
  const loaded = await loadWallet({
    privateKey: wallet.privateKey,
    chain: sepolia,
    rpcUrl: RPC_URL,
  })
  console.log("Same address:", loaded.address === wallet.address)
}

main().catch(console.error)
