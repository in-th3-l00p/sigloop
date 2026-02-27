# Transactions

## Single Transaction

```ts
const txHash = await wallet.sendTransaction({
  to: "0x...",
  value: parseEther("0.1"),
  data: "0x",  // optional
})
```

## Batch Transactions

Send multiple operations atomically in a single UserOperation.

```ts
const txHash = await wallet.sendTransactions([
  { to: "0xAlice", value: parseEther("0.1") },
  { to: "0xBob", value: parseEther("0.2") },
])
```

## Contract Calls

### Using `sendContractCall`

```ts
await wallet.sendContractCall({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: "transfer",
  args: [recipient, parseUnits("10", 6)],
})
```

### Encoding Manually for Batches

```ts
import { encodeFunctionData } from "@sigloop/wallet"

const approveData = encodeFunctionData({
  abi: erc20Abi,
  functionName: "approve",
  args: [spender, amount],
})

const transferData = encodeFunctionData({
  abi: erc20Abi,
  functionName: "transferFrom",
  args: [from, to, amount],
})

await wallet.sendTransactions([
  { to: TOKEN_ADDRESS, data: approveData },
  { to: TOKEN_ADDRESS, data: transferData },
])
```
