import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })

import { KMSClient } from "@aws-sdk/client-kms"
import { createKey, loadKey } from "../src/index.js"

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION!,
  ...(process.env.KMS_ENDPOINT && { endpoint: process.env.KMS_ENDPOINT }),
})

async function main() {
  console.log("Creating KMS key...")

  const key = await createKey({
    kmsClient,
    alias: "demo-agent-key",
    description: "Demo server key",
  })

  console.log("EOA address:", key.address)
  console.log("KMS key ID:", key.keyId)
  console.log("Public key:", key.publicKey)

  const sig = await key.signer.signMessage({ message: "hello from KMS" })
  console.log("Signature:", sig)

  console.log("\nReloading key from KMS...")

  const reloaded = await loadKey({
    kmsClient,
    keyId: key.keyId,
  })

  console.log("Reloaded address:", reloaded.address)
  console.log("Addresses match:", key.address === reloaded.address)
}

main().catch(console.error)
