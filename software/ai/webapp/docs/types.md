# Types

[Back to README](./README.md) | [API Layer](./api-layer.md) | [Hooks](./hooks.md) | [Components](./components-wallet.md)

All TypeScript interfaces are defined in the `src/types/` directory and barrel-exported from `src/types/index.ts`. These types are used across the API layer, hooks, and components.

**Source directory:** `src/types/`

---

## Table of Contents

- [Wallet Types](#wallet-types)
- [Agent Types](#agent-types)
- [Policy Types](#policy-types)
- [Payment Types](#payment-types)
- [DeFi Types](#defi-types-hook-local)

---

## Wallet Types

**Source:** `src/types/wallet.ts`

### `Wallet`

Represents a smart wallet that AI agents can operate on.

```ts
export interface Wallet {
  id: string;
  address: string;
  name: string;
  chainId: number;
  agentCount: number;
  totalSpent: string;
  createdAt: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique wallet identifier |
| `address` | `string` | Blockchain address of the smart wallet (e.g., `0x1234...abcd`) |
| `name` | `string` | Human-readable wallet name |
| `chainId` | `number` | EVM chain ID (1=Ethereum, 8453=Base, 10=Optimism, 42161=Arbitrum) |
| `agentCount` | `number` | Number of agents currently assigned to this wallet |
| `totalSpent` | `string` | Total amount spent through this wallet in ETH (string for precision) |
| `createdAt` | `string` | ISO 8601 timestamp of wallet creation |

### `CreateWalletRequest`

Request body for creating a new wallet.

```ts
export interface CreateWalletRequest {
  name: string;
  chainId: number;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Desired wallet name |
| `chainId` | `number` | Target EVM chain ID |

---

## Agent Types

**Source:** `src/types/agent.ts`

### `AgentStatus`

Union type representing the possible states of an agent's session key.

```ts
export type AgentStatus = "active" | "revoked" | "expired";
```

| Value | Description |
|-------|-------------|
| `"active"` | Agent's session key is valid and operational |
| `"revoked"` | Session key has been manually revoked by the wallet owner |
| `"expired"` | Session key has passed its `expiresAt` timestamp |

### `Agent`

Represents an AI agent with a delegated session key.

```ts
export interface Agent {
  id: string;
  walletId: string;
  name: string;
  sessionKeyAddress: string;
  status: AgentStatus;
  policyId: string;
  createdAt: string;
  expiresAt: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique agent identifier |
| `walletId` | `string` | ID of the wallet this agent operates on |
| `name` | `string` | Human-readable agent name (e.g., "Payment Bot") |
| `sessionKeyAddress` | `string` | Blockchain address of the agent's session key |
| `status` | `AgentStatus` | Current status: `"active"`, `"revoked"`, or `"expired"` |
| `policyId` | `string` | ID of the policy governing this agent's permissions |
| `createdAt` | `string` | ISO 8601 timestamp of agent creation |
| `expiresAt` | `string` | ISO 8601 timestamp when the session key expires |

### `CreateAgentRequest`

Request body for creating a new agent.

```ts
export interface CreateAgentRequest {
  walletId: string;
  name: string;
  policyId: string;
  expiresAt: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletId` | `string` | ID of the wallet to assign the agent to |
| `name` | `string` | Desired agent name |
| `policyId` | `string` | ID of the policy to bind to the agent |
| `expiresAt` | `string` | Desired session key expiration (ISO 8601 or datetime-local format) |

---

## Policy Types

**Source:** `src/types/policy.ts`

### `SpendingLimit`

Defines the spending constraints for a policy.

```ts
export interface SpendingLimit {
  maxPerTx: string;
  dailyLimit: string;
  weeklyLimit: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `maxPerTx` | `string` | Maximum ETH amount per single transaction |
| `dailyLimit` | `string` | Maximum ETH amount that can be spent per day |
| `weeklyLimit` | `string` | Maximum ETH amount that can be spent per week |

All values are strings to preserve decimal precision.

### `Allowlist`

Defines which contracts and functions an agent is permitted to interact with.

```ts
export interface Allowlist {
  contracts: string[];
  functions: string[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `contracts` | `string[]` | Array of allowed contract addresses (e.g., `["0xabc..."]`) |
| `functions` | `string[]` | Array of allowed function signatures (e.g., `["transfer(address,uint256)"]`) |

### `TimeWindow`

Defines the temporal validity window for a policy.

```ts
export interface TimeWindow {
  validAfter: string;
  validUntil: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `validAfter` | `string` | Earliest datetime the policy is valid (empty string means "now") |
| `validUntil` | `string` | Latest datetime the policy is valid (empty string means "no expiry") |

### `Policy`

Represents a complete permission policy combining spending limits, allowlists, and time windows.

```ts
export interface Policy {
  id: string;
  name: string;
  spending: SpendingLimit;
  allowlist: Allowlist;
  timeWindow: TimeWindow;
  createdAt: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique policy identifier |
| `name` | `string` | Human-readable policy name |
| `spending` | `SpendingLimit` | Spending limit constraints |
| `allowlist` | `Allowlist` | Contract and function allowlists |
| `timeWindow` | `TimeWindow` | Temporal validity window |
| `createdAt` | `string` | ISO 8601 timestamp of policy creation |

### `CreatePolicyRequest`

Request body for creating a new policy.

```ts
export interface CreatePolicyRequest {
  name: string;
  spending: SpendingLimit;
  allowlist: Allowlist;
  timeWindow: TimeWindow;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Desired policy name |
| `spending` | `SpendingLimit` | Spending limit configuration |
| `allowlist` | `Allowlist` | Contract and function allowlist configuration |
| `timeWindow` | `TimeWindow` | Temporal validity configuration |

---

## Payment Types

**Source:** `src/types/payment.ts`

### `Payment`

Represents a single x402 micropayment transaction.

```ts
export interface Payment {
  id: string;
  agentId: string;
  agentName: string;
  domain: string;
  amount: string;
  status: "settled" | "pending" | "failed";
  timestamp: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique payment identifier |
| `agentId` | `string` | ID of the agent that made the payment |
| `agentName` | `string` | Name of the agent (denormalized for display) |
| `domain` | `string` | Domain of the service paid for (e.g., `"api.example.com"`) |
| `amount` | `string` | Payment amount in ETH (string for precision) |
| `status` | `"settled" \| "pending" \| "failed"` | Current settlement status |
| `timestamp` | `string` | ISO 8601 timestamp of the payment |

### `PaymentStats`

Aggregated payment statistics.

```ts
export interface PaymentStats {
  totalSpent: string;
  totalPayments: number;
  avgPerPayment: string;
  topDomains: { domain: string; amount: string }[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalSpent` | `string` | Total ETH spent across all payments |
| `totalPayments` | `number` | Total number of payment transactions |
| `avgPerPayment` | `string` | Average ETH per payment |
| `topDomains` | `Array<{ domain: string; amount: string }>` | Domains sorted by total spend, each with domain name and total amount |

---

## DeFi Types (Hook-Local)

**Source:** `src/hooks/useDefi.ts` (not exported from `src/types/`)

These interfaces are defined locally within the `useDefi` hook file and are not part of the shared type system.

### `SwapRequest`

```ts
interface SwapRequest {
  walletId: string;
  fromToken: string;
  toToken: string;
  amount: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletId` | `string` | Wallet to execute the swap from |
| `fromToken` | `string` | Source token symbol (e.g., `"ETH"`) |
| `toToken` | `string` | Destination token symbol (e.g., `"USDC"`) |
| `amount` | `string` | Amount to swap |

### `LendRequest`

```ts
interface LendRequest {
  walletId: string;
  token: string;
  amount: string;
  protocol: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletId` | `string` | Wallet to lend from |
| `token` | `string` | Token to lend (e.g., `"USDC"`) |
| `amount` | `string` | Amount to lend |
| `protocol` | `string` | Lending protocol (e.g., `"aave"`) |

### `StakeRequest`

```ts
interface StakeRequest {
  walletId: string;
  token: string;
  amount: string;
  validator: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletId` | `string` | Wallet to stake from |
| `token` | `string` | Token to stake (e.g., `"ETH"`) |
| `amount` | `string` | Amount to stake |
| `validator` | `string` | Validator address |

---

## Barrel Export

**Source:** `src/types/index.ts`

All public types are re-exported from the barrel file:

```ts
export type { Wallet, CreateWalletRequest } from "./wallet";
export type { Agent, AgentStatus, CreateAgentRequest } from "./agent";
export type {
  Policy,
  CreatePolicyRequest,
  SpendingLimit,
  Allowlist,
  TimeWindow,
} from "./policy";
export type { Payment, PaymentStats } from "./payment";
```

Import types in your code via:

```ts
import type { Wallet, Agent, Policy, Payment } from "@/types";
```
