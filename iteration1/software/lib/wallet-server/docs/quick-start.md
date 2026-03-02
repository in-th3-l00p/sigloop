# Quick Start

## Install

```bash
pnpm add @sigloop/wallet-server @aws-sdk/client-kms viem
```

## Prerequisites

Configure AWS credentials via environment variables, shared credentials file, or IAM role. The KMS key requires `kms:CreateKey`, `kms:Sign`, and `kms:GetPublicKey` permissions.

## Create a New KMS Key

```ts
import { createKey } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"

const kmsClient = new KMSClient({ region: "us-east-1" })

const key = await createKey({
  kmsClient,
  alias: "my-agent-key",
})

console.log(key.address)    // derived Ethereum address
console.log(key.keyId)      // save this to reload later
console.log(key.publicKey)  // hex-encoded public key
```

## Load an Existing Key

```ts
import { loadKey } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"

const kmsClient = new KMSClient({ region: "us-east-1" })

const key = await loadKey({
  kmsClient,
  keyId: "arn:aws:kms:us-east-1:123456789:key/abcd-1234",
})
```

## Sign a Message

The returned `signer` is a standard viem `LocalAccount`:

```ts
const signature = await key.signer.signMessage({ message: "hello" })
```
