import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })

import { KMSClient } from "@aws-sdk/client-kms"
import { sepolia } from "viem/chains"
import { parseEther } from "viem"
import { createKmsWallet, loadKmsWallet } from "../src/index.js"

const kmsClient = new KMSClient({ region: process.env.AWS_REGION! })
const BUNDLER_RPC_URL = process.env.ZERODEV_RPC_URL!

async function main() {
  console.log("Creating KMS-backed wallet...")

  const wallet = await createKmsWallet({
    kmsClient,
    chain: sepolia,
    rpcUrl: BUNDLER_RPC_URL,
    sponsorGas: true,
    alias: "demo-agent-wallet",
    description: "Demo server wallet",
  })

  console.log("Smart account address:", wallet.address)
  console.log("KMS key ID:", wallet.keyId)
  console.log("Public key:", wallet.publicKey)

  const sig = await wallet.signMessage("hello from KMS")
  console.log("Signature:", sig)

  const isValid = await wallet.verifySignature("hello from KMS", sig)
  console.log("Signature valid:", isValid)

  console.log("\nReloading wallet from KMS key...")

  const reloaded = await loadKmsWallet({
    kmsClient,
    keyId: wallet.keyId,
    chain: sepolia,
    rpcUrl: BUNDLER_RPC_URL,
    sponsorGas: true,
  })

  console.log("Reloaded address:", reloaded.address)
  console.log("Addresses match:", wallet.address === reloaded.address)
}

main().catch(console.error)
