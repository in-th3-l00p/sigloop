# Quick Start

## Install

```bash
pnpm add @sigloop/wallet-server @aws-sdk/client-kms viem
```

## Prerequisites

Configure AWS credentials via environment variables, shared credentials file, or IAM role. The KMS key requires `kms:CreateKey`, `kms:Sign`, and `kms:GetPublicKey` permissions.

## Create a New KMS Wallet

```ts
import { createKmsWallet } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"
import { sepolia } from "viem/chains"

const kmsClient = new KMSClient({ region: "us-east-1" })

const wallet = await createKmsWallet({
  kmsClient,
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
  sponsorGas: true,
  alias: "my-agent-wallet",
})

console.log(wallet.address)  // smart account address
console.log(wallet.keyId)    // save this to restore later
```

## Load an Existing Wallet

```ts
import { loadKmsWallet } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"
import { sepolia } from "viem/chains"

const kmsClient = new KMSClient({ region: "us-east-1" })

const wallet = await loadKmsWallet({
  kmsClient,
  keyId: "arn:aws:kms:us-east-1:123456789:key/abcd-1234",
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
  sponsorGas: true,
})
```

## Send a Transaction

```ts
const txHash = await wallet.sendTransaction({
  to: "0x...",
  value: 0n,
})
```

## Sign and Verify

```ts
const signature = await wallet.signMessage("hello")
const valid = await wallet.verifySignature("hello", signature)
```
