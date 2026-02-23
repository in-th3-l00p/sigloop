# API Layer

[Back to README](./README.md) | [Hooks](./hooks.md) | [Types](./types.md) | [Getting Started](./getting-started.md)

The API layer provides typed functions that wrap HTTP calls to the Sigloop backend. All functions use the generic `apiClient` wrapper, which handles base URL resolution, headers, and error parsing.

**Source directory:** `src/api/`

---

## Table of Contents

- [apiClient](#apiclient)
- [Wallets API](#wallets-api)
- [Agents API](#agents-api)
- [Policies API](#policies-api)
- [Payments API](#payments-api)

---

## apiClient

**Source:** `src/api/client.ts`

### Purpose

Generic HTTP client that wraps the native `fetch` API. All API module functions use this as their underlying transport.

### Signature

```ts
async function apiClient<T>(path: string, options?: RequestInit): Promise<T>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | `string` | Yes | API path appended to the base URL (e.g., `"/wallets"`) |
| `options` | `RequestInit` | No | Standard fetch options (method, body, headers, etc.) |

### Behavior

1. Constructs the full URL: `${API_BASE}${path}`
2. Merges provided headers with default `Content-Type: application/json`
3. Executes the `fetch` call
4. If the response is not OK (`!res.ok`), throws an `Error` with the response text body
5. Returns the parsed JSON response, typed as `T`

### Base URL

```ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

Configured via the `VITE_API_URL` environment variable, defaulting to `http://localhost:3001`.

### Usage

```ts
import { apiClient } from "@/api/client";

// GET request
const wallets = await apiClient<Wallet[]>("/wallets");

// POST request
const wallet = await apiClient<Wallet>("/wallets", {
  method: "POST",
  body: JSON.stringify({ name: "My Wallet", chainId: 8453 }),
});
```

---

## Wallets API

**Source:** `src/api/wallets.ts`

### Functions

#### `fetchWallets()`

Fetches all wallets.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/wallets` |
| Returns | `Promise<Wallet[]>` |

```ts
import { fetchWallets } from "@/api/wallets";
const wallets = await fetchWallets();
```

#### `fetchWallet(id: string)`

Fetches a single wallet by ID.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/wallets/:id` |
| Parameter | `id: string` -- Wallet ID |
| Returns | `Promise<Wallet>` |

```ts
const wallet = await fetchWallet("wallet-123");
```

#### `createWallet(data: CreateWalletRequest)`

Creates a new wallet.

| Property | Value |
|----------|-------|
| Method | `POST` |
| Endpoint | `/wallets` |
| Body | `CreateWalletRequest` -- `{ name: string; chainId: number }` |
| Returns | `Promise<Wallet>` |

```ts
const wallet = await createWallet({ name: "My Wallet", chainId: 8453 });
```

#### `deleteWallet(id: string)`

Deletes a wallet by ID.

| Property | Value |
|----------|-------|
| Method | `DELETE` |
| Endpoint | `/wallets/:id` |
| Parameter | `id: string` -- Wallet ID |
| Returns | `Promise<void>` |

```ts
await deleteWallet("wallet-123");
```

---

## Agents API

**Source:** `src/api/agents.ts`

### Functions

#### `fetchAgents()`

Fetches all agents.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/agents` |
| Returns | `Promise<Agent[]>` |

```ts
const agents = await fetchAgents();
```

#### `fetchAgent(id: string)`

Fetches a single agent by ID.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/agents/:id` |
| Parameter | `id: string` -- Agent ID |
| Returns | `Promise<Agent>` |

```ts
const agent = await fetchAgent("agent-abc");
```

#### `createAgent(data: CreateAgentRequest)`

Creates a new agent with a session key.

| Property | Value |
|----------|-------|
| Method | `POST` |
| Endpoint | `/agents` |
| Body | `CreateAgentRequest` -- `{ walletId, name, policyId, expiresAt }` |
| Returns | `Promise<Agent>` |

```ts
const agent = await createAgent({
  walletId: "w1",
  name: "Payment Bot",
  policyId: "p1",
  expiresAt: "2025-12-31T23:59:59",
});
```

#### `revokeAgent(id: string)`

Revokes an agent's session key.

| Property | Value |
|----------|-------|
| Method | `POST` |
| Endpoint | `/agents/:id/revoke` |
| Parameter | `id: string` -- Agent ID |
| Returns | `Promise<Agent>` |

```ts
const revokedAgent = await revokeAgent("agent-abc");
```

---

## Policies API

**Source:** `src/api/policies.ts`

### Functions

#### `fetchPolicies()`

Fetches all policies.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/policies` |
| Returns | `Promise<Policy[]>` |

```ts
const policies = await fetchPolicies();
```

#### `fetchPolicy(id: string)`

Fetches a single policy by ID.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/policies/:id` |
| Parameter | `id: string` -- Policy ID |
| Returns | `Promise<Policy>` |

```ts
const policy = await fetchPolicy("policy-xyz");
```

#### `createPolicy(data: CreatePolicyRequest)`

Creates a new policy.

| Property | Value |
|----------|-------|
| Method | `POST` |
| Endpoint | `/policies` |
| Body | `CreatePolicyRequest` -- `{ name, spending, allowlist, timeWindow }` |
| Returns | `Promise<Policy>` |

```ts
const policy = await createPolicy({
  name: "Strict Policy",
  spending: { maxPerTx: "0.01", dailyLimit: "0.1", weeklyLimit: "0.5" },
  allowlist: { contracts: [], functions: [] },
  timeWindow: { validAfter: "", validUntil: "" },
});
```

#### `deletePolicy(id: string)`

Deletes a policy by ID.

| Property | Value |
|----------|-------|
| Method | `DELETE` |
| Endpoint | `/policies/:id` |
| Parameter | `id: string` -- Policy ID |
| Returns | `Promise<void>` |

```ts
await deletePolicy("policy-xyz");
```

---

## Payments API

**Source:** `src/api/payments.ts`

### Functions

#### `fetchPayments()`

Fetches all payment records.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/payments` |
| Returns | `Promise<Payment[]>` |

```ts
const payments = await fetchPayments();
```

#### `fetchPaymentStats()`

Fetches aggregated payment statistics.

| Property | Value |
|----------|-------|
| Method | `GET` |
| Endpoint | `/payments/stats` |
| Returns | `Promise<PaymentStats>` |

```ts
const stats = await fetchPaymentStats();
```

---

## API Endpoint Summary

| Method | Endpoint | Function | Returns |
|--------|----------|----------|---------|
| GET | `/wallets` | `fetchWallets` | `Wallet[]` |
| GET | `/wallets/:id` | `fetchWallet` | `Wallet` |
| POST | `/wallets` | `createWallet` | `Wallet` |
| DELETE | `/wallets/:id` | `deleteWallet` | `void` |
| GET | `/agents` | `fetchAgents` | `Agent[]` |
| GET | `/agents/:id` | `fetchAgent` | `Agent` |
| POST | `/agents` | `createAgent` | `Agent` |
| POST | `/agents/:id/revoke` | `revokeAgent` | `Agent` |
| GET | `/policies` | `fetchPolicies` | `Policy[]` |
| GET | `/policies/:id` | `fetchPolicy` | `Policy` |
| POST | `/policies` | `createPolicy` | `Policy` |
| DELETE | `/policies/:id` | `deletePolicy` | `void` |
| GET | `/payments` | `fetchPayments` | `Payment[]` |
| GET | `/payments/stats` | `fetchPaymentStats` | `PaymentStats` |
| POST | `/defi/swap` | via `apiClient` | `{ txHash: string }` |
| POST | `/defi/lend` | via `apiClient` | `{ txHash: string }` |
| POST | `/defi/stake` | via `apiClient` | `{ txHash: string }` |
