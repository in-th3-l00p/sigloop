# Types

[<- Back to README](./README.md) | [Services](./services.md) | [Store ->](./store.md)

---

All TypeScript types are defined in `src/types/` and re-exported from `src/types/index.ts`.

---

## Wallet

**Source:** `src/types/wallet.ts`

### `Wallet`

Represents an Ethereum wallet managed by the platform.

```typescript
interface Wallet {
  id: string;
  address: string;
  name: string;
  chainId: number;
  createdAt: string;
  updatedAt: string;
}
```

| Field       | Type     | Description                                              |
|-------------|----------|----------------------------------------------------------|
| `id`        | `string` | UUID v4 identifier.                                      |
| `address`   | `string` | Ethereum address derived from the generated private key. |
| `name`      | `string` | Human-readable wallet name.                              |
| `chainId`   | `number` | EVM chain ID (e.g., `1` for Ethereum mainnet, `137` for Polygon). |
| `createdAt` | `string` | ISO 8601 timestamp of creation.                          |
| `updatedAt` | `string` | ISO 8601 timestamp of last update.                       |

---

### `CreateWalletRequest`

Request body for wallet creation.

```typescript
interface CreateWalletRequest {
  name: string;
  chainId?: number;
}
```

| Field     | Type     | Required | Default | Description                          |
|-----------|----------|----------|---------|--------------------------------------|
| `name`    | `string` | Yes      | --      | Wallet name (must be non-empty).     |
| `chainId` | `number` | No       | `1`     | EVM chain ID.                        |

---

### `WalletResponse`

Single wallet response envelope.

```typescript
interface WalletResponse {
  wallet: Wallet;
}
```

---

### `WalletListResponse`

Wallet list response envelope.

```typescript
interface WalletListResponse {
  wallets: Wallet[];
  total: number;
}
```

---

## Agent

**Source:** `src/types/agent.ts`

### `AgentStatus` (Enum)

```typescript
enum AgentStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
  EXPIRED = "expired",
}
```

| Value     | Description                                                  |
|-----------|--------------------------------------------------------------|
| `active`  | Agent is active and can perform operations.                  |
| `revoked` | Agent has been manually revoked; key material deleted.       |
| `expired` | Agent has expired (reserved for future TTL-based expiration).|

---

### `Agent`

Represents a scoped session key bound to a wallet.

```typescript
interface Agent {
  id: string;
  walletId: string;
  name: string;
  publicKey: string;
  policyId: string | null;
  status: AgentStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}
```

| Field         | Type             | Description                                           |
|---------------|------------------|-------------------------------------------------------|
| `id`          | `string`         | UUID v4 identifier.                                   |
| `walletId`    | `string`         | UUID of the parent wallet.                            |
| `name`        | `string`         | Human-readable agent name.                            |
| `publicKey`   | `string`         | Ethereum address (public key) of the agent's key pair.|
| `policyId`    | `string \| null` | UUID of the attached policy, or `null` if none.       |
| `status`      | `AgentStatus`    | Current status (`"active"`, `"revoked"`, `"expired"`).|
| `permissions` | `string[]`       | Array of granted permission strings.                  |
| `createdAt`   | `string`         | ISO 8601 timestamp of creation.                       |
| `updatedAt`   | `string`         | ISO 8601 timestamp of last update.                    |
| `revokedAt`   | `string \| null` | ISO 8601 timestamp of revocation, or `null`.          |

---

### `CreateAgentRequest`

Request body for agent creation.

```typescript
interface CreateAgentRequest {
  name: string;
  policyId?: string;
  permissions?: string[];
}
```

| Field         | Type       | Required | Default | Description                          |
|---------------|------------|----------|---------|--------------------------------------|
| `name`        | `string`   | Yes      | --      | Agent name (must be non-empty).      |
| `policyId`    | `string`   | No       | `null`  | UUID of an existing policy.          |
| `permissions` | `string[]` | No       | `[]`    | Permission strings to grant.         |

---

### `AgentResponse`

Single agent response envelope (used at creation to include session key).

```typescript
interface AgentResponse {
  agent: Agent;
  sessionKey?: string;
}
```

---

### `AgentListResponse`

Agent list response envelope.

```typescript
interface AgentListResponse {
  agents: Agent[];
  total: number;
}
```

---

## Policy

**Source:** `src/types/policy.ts`

### `SpendingLimit`

Configuration for a spending limit rule.

```typescript
interface SpendingLimit {
  maxAmount: string;
  period: "hourly" | "daily" | "weekly" | "monthly";
  currency: string;
}
```

| Field       | Type     | Description                                            |
|-------------|----------|--------------------------------------------------------|
| `maxAmount` | `string` | Maximum spending amount (parseable as a positive number). |
| `period`    | `string` | Enforcement period: `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`. |
| `currency`  | `string` | Currency symbol (e.g., `"USDC"`, `"ETH"`).             |

---

### `Allowlist`

Configuration for an allowlist rule.

```typescript
interface Allowlist {
  addresses: string[];
  domains: string[];
}
```

| Field       | Type       | Description                                           |
|-------------|------------|-------------------------------------------------------|
| `addresses` | `string[]` | Allowed Ethereum addresses.                           |
| `domains`   | `string[]` | Allowed domain names.                                 |

At least one of `addresses` or `domains` must contain at least one entry.

---

### `TimeWindow`

Configuration for a time window rule.

```typescript
interface TimeWindow {
  startHour: number;
  endHour: number;
  daysOfWeek: number[];
  timezone: string;
}
```

| Field        | Type       | Description                                         |
|--------------|------------|-----------------------------------------------------|
| `startHour`  | `number`   | Start hour, 0-23 inclusive.                         |
| `endHour`    | `number`   | End hour, 0-23 inclusive.                           |
| `daysOfWeek` | `number[]` | Allowed days (0 = Sunday, 1 = Monday, ..., 6 = Saturday). |
| `timezone`   | `string`   | Timezone identifier (e.g., `"UTC"`, `"America/New_York"`). |

---

### `PolicyRule`

A single rule within a policy. The `type` field determines which configuration object is required.

```typescript
interface PolicyRule {
  type: "spending_limit" | "allowlist" | "time_window";
  spendingLimit?: SpendingLimit;
  allowlist?: Allowlist;
  timeWindow?: TimeWindow;
}
```

| Field           | Type            | Condition                           | Description                    |
|-----------------|-----------------|-------------------------------------|--------------------------------|
| `type`          | `string`        | Always required                     | Rule type discriminator.       |
| `spendingLimit` | `SpendingLimit` | Required when `type` is `"spending_limit"` | Spending limit configuration. |
| `allowlist`     | `Allowlist`     | Required when `type` is `"allowlist"`      | Allowlist configuration.      |
| `timeWindow`    | `TimeWindow`    | Required when `type` is `"time_window"`    | Time window configuration.    |

---

### `Policy`

A named collection of rules.

```typescript
interface Policy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}
```

| Field         | Type           | Description                             |
|---------------|----------------|-----------------------------------------|
| `id`          | `string`       | UUID v4 identifier.                     |
| `name`        | `string`       | Human-readable policy name.             |
| `description` | `string`       | Description of the policy.              |
| `rules`       | `PolicyRule[]`  | Array of rules (at least one).          |
| `createdAt`   | `string`       | ISO 8601 timestamp of creation.         |
| `updatedAt`   | `string`       | ISO 8601 timestamp of last update.      |

---

### `CreatePolicyRequest`

Request body for policy creation.

```typescript
interface CreatePolicyRequest {
  name: string;
  description?: string;
  rules: PolicyRule[];
}
```

| Field         | Type           | Required | Default | Description                    |
|---------------|----------------|----------|---------|--------------------------------|
| `name`        | `string`       | Yes      | --      | Policy name (must be non-empty). |
| `description` | `string`       | No       | `""`    | Policy description.            |
| `rules`       | `PolicyRule[]`  | Yes      | --      | Array of rules (at least one). |

---

### `PolicyResponse`

Single policy response envelope.

```typescript
interface PolicyResponse {
  policy: Policy;
}
```

---

### `PolicyListResponse`

Policy list response envelope.

```typescript
interface PolicyListResponse {
  policies: Policy[];
  total: number;
}
```

---

## Payment

**Source:** `src/types/payment.ts`

### `Payment`

Represents a recorded transaction.

```typescript
interface Payment {
  id: string;
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed";
  metadata: Record<string, string>;
  createdAt: string;
}
```

| Field      | Type                     | Description                                     |
|------------|--------------------------|-------------------------------------------------|
| `id`       | `string`                 | UUID v4 identifier.                             |
| `agentId`  | `string`                 | UUID of the agent that made the payment.        |
| `walletId` | `string`                 | UUID of the wallet that funded the payment.     |
| `domain`   | `string`                 | Domain that received the payment.               |
| `amount`   | `string`                 | Payment amount as a string.                     |
| `currency` | `string`                 | Currency symbol (e.g., `"USDC"`).               |
| `status`   | `string`                 | One of: `"pending"`, `"completed"`, `"failed"`. |
| `metadata` | `Record<string, string>` | Arbitrary key-value metadata.                   |
| `createdAt`| `string`                 | ISO 8601 timestamp of creation.                 |

> **Note:** Currently, the `record()` method always creates payments with status `"completed"`. The `"pending"` and `"failed"` statuses are reserved for future use.

---

### `RecordPaymentRequest`

Request body for recording a payment.

```typescript
interface RecordPaymentRequest {
  agentId: string;
  walletId: string;
  domain: string;
  amount: string;
  currency?: string;
  metadata?: Record<string, string>;
}
```

| Field      | Type                     | Required | Default  | Description                    |
|------------|--------------------------|----------|----------|--------------------------------|
| `agentId`  | `string`                 | Yes      | --       | UUID of the paying agent.      |
| `walletId` | `string`                 | Yes      | --       | UUID of the funding wallet.    |
| `domain`   | `string`                 | Yes      | --       | Payment recipient domain.      |
| `amount`   | `string`                 | Yes      | --       | Amount (must be positive).     |
| `currency` | `string`                 | No       | `"USDC"` | Currency symbol.               |
| `metadata` | `Record<string, string>` | No       | `{}`     | Arbitrary metadata.            |

---

### `PaymentStats`

Aggregate payment statistics returned by `GET /api/payments/stats`.

```typescript
interface PaymentStats {
  totalSpent: string;
  totalTransactions: number;
  byAgent: Record<string, { spent: string; count: number }>;
  byDomain: Record<string, { spent: string; count: number }>;
  byPeriod: Array<{ period: string; spent: string; count: number }>;
}
```

| Field               | Type     | Description                                    |
|---------------------|----------|------------------------------------------------|
| `totalSpent`        | `string` | Total spent (6 decimal places).                |
| `totalTransactions` | `number` | Total completed payment count.                 |
| `byAgent`           | `object` | Breakdown by agent ID with `spent` and `count`.|
| `byDomain`          | `object` | Breakdown by domain with `spent` and `count`.  |
| `byPeriod`          | `array`  | Daily breakdown sorted chronologically.        |

---

### `PaymentListResponse`

Payment list response envelope.

```typescript
interface PaymentListResponse {
  payments: Payment[];
  total: number;
}
```

---

## Related

- [Services](./services.md) -- Business logic that uses these types
- [Store](./store.md) -- Data stores that persist these types
- [API Reference](./README.md#api-reference) -- Endpoints that accept and return these types
