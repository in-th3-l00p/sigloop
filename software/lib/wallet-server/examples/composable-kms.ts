import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })

import { KMSClient } from "@aws-sdk/client-kms"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { createKmsSigner, createKmsKey } from "../src/advanced.js"
import {
  createEcdsaValidator,
  createSmartAccount,
  createPaymaster,
  createAccountClient,
  signMessage,
  verifySignature,
} from "@sigloop/wallet/advanced"

const kmsClient = new KMSClient({ region: process.env.AWS_REGION! })
const BUNDLER_RPC_URL = process.env.ZERODEV_RPC_URL!

async function main() {
  console.log("--- Step 1: Create KMS Key ---")
  const keyId = await createKmsKey({ kmsClient, alias: "composable-demo" })
  console.log("Key ID:", keyId)

  console.log("\n--- Step 2: Create KMS Signer ---")
  const { signer, address, publicKey } = await createKmsSigner({ kmsClient, keyId })
  console.log("EOA address:", address)
  console.log("Public key:", publicKey)

  console.log("\n--- Step 3: Build Smart Account ---")
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(BUNDLER_RPC_URL),
  })

  const validator = await createEcdsaValidator(publicClient, { signer })
  const account = await createSmartAccount(publicClient, { validator })
  console.log("Smart account:", account.address)

  console.log("\n--- Step 4: Create Client ---")
  const paymasterClient = createPaymaster({ chain: sepolia, rpcUrl: BUNDLER_RPC_URL })
  const client = createAccountClient({
    account,
    chain: sepolia,
    rpcUrl: BUNDLER_RPC_URL,
    publicClient,
    paymaster: { type: "sponsor", paymasterClient },
  })

  console.log("\n--- Step 5: Sign & Verify ---")
  const message = "KMS composable wallet"
  const signature = await signMessage(client, message)
  console.log("Signature:", signature)

  const valid = await verifySignature(publicClient, {
    signer: account.address,
    message,
    signature,
  })
  console.log("Valid:", valid)
}

main().catch(console.error)
