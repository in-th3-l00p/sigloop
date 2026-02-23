# @sigloop/sdk

Wallet abstraction SDK for AI agents. Build autonomous agents with ERC-4337 smart accounts, scoped session keys, on-chain policy enforcement, and native x402 payment support.

**Version:** 0.1.0
**License:** MIT
**Runtime:** ES2022
**Dependencies:** [viem](https://viem.sh) ^2.46.2, [permissionless](https://docs.pimlico.io/permissionless) ^0.3.4

---

## Table of Contents

| Page | Description |
|------|-------------|
| [Getting Started](./getting-started.md) | Installation, quick start, and basic usage |
| [Wallet](./wallet.md) | Wallet creation, passkey authentication, social recovery |
| [Agent](./agent.md) | Agent creation, session keys, revocation, listing |
| [Policy](./policy.md) | Spending limits, allowlists, time windows, rate limits, composition |
| [x402](./x402.md) | Payment middleware, EIP-3009 signing, budget tracking, HTTP client |
| [Chain](./chain.md) | Chain configuration, optimal routing, bridging |
| [DeFi](./defi.md) | Token swaps, lending/borrowing, staking |
| [Types](./types.md) | All TypeScript interfaces and type definitions |
| [Utils](./utils.md) | Encoding, validation, and helper utilities |

---

## Architecture

```
@sigloop/sdk
├── wallet/     Smart account creation and recovery
├── agent/      Session key management for AI agents
├── policy/     On-chain policy rules and composition
├── x402/       HTTP 402 payment protocol support
├── chain/      Multi-chain configuration and routing
├── defi/       DeFi protocol integrations (Uniswap, Aave)
├── types/      TypeScript type definitions
└── utils/      Encoding and validation helpers
```

## Supported Chains

| Chain | Chain ID | Network |
|-------|----------|---------|
| Base | 8453 | Mainnet |
| Arbitrum | 42161 | Mainnet |
| Base Sepolia | 84532 | Testnet |
| Arbitrum Sepolia | 421614 | Testnet |

## Quick Example

```typescript
import {
  createWallet,
  createAgent,
  composePolicy,
  createSpendingLimit,
  createContractAllowlist,
  createTimeWindowFromDays,
  SupportedChain,
} from "@sigloop/sdk";
import { privateKeyToAccount } from "viem/accounts";

const owner = privateKeyToAccount("0x...");

const wallet = await createWallet({
  owner,
  config: { chainId: SupportedChain.Base },
});

const policy = composePolicy([
  createSpendingLimit({
    tokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    maxPerTransaction: 100000000000000000n,
    maxDaily: 500000000000000000n,
    maxWeekly: 2000000000000000000n,
  }),
  createContractAllowlist(["0x..."]),
  createTimeWindowFromDays(7),
]);

const agent = await createAgent({
  walletAddress: wallet.address,
  owner,
  config: { name: "trading-bot", policy },
  chainId: SupportedChain.Base,
});
```

---

[Next: Getting Started ->](./getting-started.md)
