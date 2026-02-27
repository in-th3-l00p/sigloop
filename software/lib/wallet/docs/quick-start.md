# Quick Start

## Install

```bash
pnpm add @sigloop/wallet viem
```

## Create a New Wallet

```ts
import { createWallet } from "@sigloop/wallet"
import { sepolia } from "viem/chains"

const wallet = await createWallet({
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
})

console.log(wallet.address)    // smart account address
console.log(wallet.privateKey) // save this to restore later
```

## Load an Existing Wallet

```ts
import { loadWallet } from "@sigloop/wallet"
import { sepolia } from "viem/chains"

const wallet = await loadWallet({
  privateKey: "0x...",
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
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
