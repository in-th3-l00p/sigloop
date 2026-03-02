import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })

import { KMSClient } from "@aws-sdk/client-kms"
import { createKmsSigner, createKmsKey, getKmsPublicKey, deriveEthAddressFromSpki } from "../src/advanced.js"

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION!,
  ...(process.env.KMS_ENDPOINT && { endpoint: process.env.KMS_ENDPOINT }),
})

async function main() {
  console.log("--- Step 1: Create KMS Key ---")
  const keyId = await createKmsKey({ kmsClient, alias: "composable-demo" })
  console.log("Key ID:", keyId)

  console.log("\n--- Step 2: Get Public Key & Address ---")
  const spki = await getKmsPublicKey({ kmsClient, keyId })
  const { address, publicKey } = deriveEthAddressFromSpki(spki)
  console.log("EOA address:", address)
  console.log("Public key:", publicKey)

  console.log("\n--- Step 3: Create KMS Signer ---")
  const { signer } = await createKmsSigner({ kmsClient, keyId })
  console.log("Signer address:", signer.address)

  console.log("\n--- Step 4: Sign Message ---")
  const signature = await signer.signMessage({ message: "KMS composable signer" })
  console.log("Signature:", signature)
}

main().catch(console.error)
