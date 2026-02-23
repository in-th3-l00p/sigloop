# Getting Started

[<- Back to README](./README.md) | [Next: Wallet ->](./wallet.md)

---

## Installation

```bash
pnpm add @sigloop/sdk
```

```bash
npm install @sigloop/sdk
```

```bash
yarn add @sigloop/sdk
```

The SDK has two runtime dependencies:

- **viem** ^2.46.2 -- Ethereum client library for type-safe contract interaction
- **permissionless** ^0.3.4 -- ERC-4337 account abstraction utilities

Both are installed automatically as dependencies.

---

## Prerequisites

- Node.js 18+ or a runtime that supports ES2022 and the Web Crypto API
- An Ethereum private key or passkey credential for wallet ownership
- Access to an RPC endpoint and bundler for your target chain

---

## Quick Start

### 1. Create a Smart Wallet

```typescript
import { createWallet, SupportedChain } from "@sigloop/sdk";
import { privateKeyToAccount } from "viem/accounts";

const owner = privateKeyToAccount("0xYOUR_PRIVATE_KEY");

const wallet = await createWallet({
  owner,
  config: {
    chainId: SupportedChain.BaseSepolia,
  },
});

console.log("Wallet address:", wallet.address);
```

### 2. Define a Policy

```typescript
import {
  composePolicy,
  createSpendingLimit,
  createContractAllowlist,
  createRateLimitPerHour,
} from "@sigloop/sdk";

const policy = composePolicy([
  createSpendingLimit({
    tokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    maxPerTransaction: 50000000000000000n,   // 0.05 ETH
    maxDaily: 200000000000000000n,            // 0.2 ETH
    maxWeekly: 1000000000000000000n,          // 1 ETH
  }),
  createContractAllowlist([
    "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap router
  ]),
  createRateLimitPerHour(10),
]);
```

### 3. Create an Agent with a Session Key

```typescript
import { createAgent, SupportedChain } from "@sigloop/sdk";

const agent = await createAgent({
  walletAddress: wallet.address,
  owner,
  config: {
    name: "my-trading-agent",
    description: "Executes token swaps on Uniswap",
    policy,
    sessionDurationSeconds: 86400, // 24 hours
  },
  chainId: SupportedChain.BaseSepolia,
});

console.log("Agent ID:", agent.id);
console.log("Session key:", agent.sessionKey.publicKey);
console.log("Expires at:", new Date(agent.expiresAt * 1000));
```

### 4. Execute a Swap

```typescript
import { executeSwap, buildApproveCalldata, SupportedChain } from "@sigloop/sdk";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH = "0x4200000000000000000000000000000000000006";

const swap = await executeSwap({
  chainId: SupportedChain.Base,
  tokenIn: USDC,
  tokenOut: WETH,
  amountIn: 1000000n, // 1 USDC (6 decimals)
  minAmountOut: 400000000000000n, // minimum WETH out
  recipient: wallet.address,
});

console.log("Swap calldata:", swap.calldata);
console.log("Send to:", swap.to);
```

### 5. Use x402 Payments

```typescript
import { createX402Client } from "@sigloop/sdk";

const client = createX402Client({
  account: owner,
  walletAddress: wallet.address,
  chainId: 8453,
  config: {
    maxPaymentPerRequest: 1000000n, // 1 USDC max per request
    maxTotalPayment: 10000000n,     // 10 USDC total budget
    autoApprove: true,
  },
});

const response = await client.get("https://api.example.com/premium-data");
const data = await response.json();
```

---

## Custom RPC and Bundler URLs

Override the default chain endpoints when creating a wallet:

```typescript
const wallet = await createWallet({
  owner,
  config: {
    chainId: SupportedChain.Base,
    rpcUrl: "https://your-rpc-endpoint.com",
    bundlerUrl: "https://your-bundler-endpoint.com",
    paymasterUrl: "https://your-paymaster-endpoint.com",
  },
});
```

---

## Module Imports

Everything is re-exported from the package root:

```typescript
import { createWallet, createAgent, composePolicy, SupportedChain } from "@sigloop/sdk";
```

You can also import from sub-paths if your bundler supports it:

```typescript
import { createWallet } from "@sigloop/sdk/wallet";
import { composePolicy } from "@sigloop/sdk/policy";
```

---

[<- Back to README](./README.md) | [Next: Wallet ->](./wallet.md)
