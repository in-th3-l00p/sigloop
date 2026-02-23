# Hooks

[Back to README](./README.md) | [Pages](./pages.md) | [API Layer](./api-layer.md) | [Types](./types.md) | [Testing](./testing.md)

All hooks are built on [TanStack React Query](https://tanstack.com/query) and wrap the functions from the [API layer](./api-layer.md). Query hooks use `useQuery` for cached, auto-refetching reads. Mutation hooks use `useMutation` and automatically invalidate related query caches on success.

**Source directory:** `src/hooks/`

---

## Table of Contents

- [useWallets](#usewalletsmd---usewalletsmd)
- [useWallet](#usewalletid-string)
- [useCreateWallet](#usecreatewallet)
- [useDeleteWallet](#usedeletewallet)
- [useAgents](#useagents)
- [useAgent](#useagentid-string)
- [useCreateAgent](#usecreateagent)
- [useRevokeAgent](#userevokeagent)
- [usePolicies](#usepolicies)
- [usePolicy](#usepolicyid-string)
- [useCreatePolicy](#usecreatepolicy)
- [useDeletePolicy](#usedeletepolicy)
- [usePayments](#usepayments)
- [usePaymentStats](#usepaymentstats)
- [useSwap](#useswap)
- [useLend](#uselend)
- [useStake](#usestake)

---

## Wallet Hooks

**Source:** `src/hooks/useWallet.ts`

### `useWallets()`

Fetches all wallets.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseQueryResult<Wallet[]>` | Standard React Query result with `data`, `isLoading`, `isError`, etc. |
| **Query Key** | `["wallets"]` | Used for cache identification and invalidation |
| **Query Fn** | `fetchWallets` | Calls `GET /wallets` |

```tsx
import { useWallets } from "@/hooks/useWallet";

function MyComponent() {
  const { data: wallets, isLoading, isError } = useWallets();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading wallets</p>;

  return wallets?.map((w) => <p key={w.id}>{w.name}</p>);
}
```

### `useWallet(id: string)`

Fetches a single wallet by ID.

| Property | Type | Description |
|----------|------|-------------|
| **Parameter** | `id: string` | Wallet ID to fetch |
| **Returns** | `UseQueryResult<Wallet>` | Single wallet data |
| **Query Key** | `["wallets", id]` | Scoped to specific wallet |
| **Enabled** | `!!id` | Only runs when `id` is truthy |

```tsx
const { data: wallet } = useWallet("wallet-123");
```

### `useCreateWallet()`

Creates a new wallet. On success, invalidates the `["wallets"]` query cache so lists re-fetch.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseMutationResult` | Mutation result with `mutate`, `isPending`, `isSuccess`, etc. |
| **Mutation Fn** | `createWallet(data)` | Calls `POST /wallets` |
| **Input** | `CreateWalletRequest` | `{ name: string; chainId: number }` |
| **On Success** | Invalidates `["wallets"]` | Triggers automatic re-fetch of wallet list |

```tsx
const createWallet = useCreateWallet();

createWallet.mutate(
  { name: "My Wallet", chainId: 8453 },
  { onSuccess: () => console.log("Created!") }
);
```

### `useDeleteWallet()`

Deletes a wallet by ID. On success, invalidates the `["wallets"]` query cache.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseMutationResult` | Mutation result |
| **Mutation Fn** | `deleteWallet(id)` | Calls `DELETE /wallets/:id` |
| **Input** | `string` | Wallet ID to delete |
| **On Success** | Invalidates `["wallets"]` | Triggers automatic re-fetch |

```tsx
const deleteWallet = useDeleteWallet();
deleteWallet.mutate("wallet-123");
```

---

## Agent Hooks

**Source:** `src/hooks/useAgent.ts`

### `useAgents()`

Fetches all agents.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseQueryResult<Agent[]>` | All agents |
| **Query Key** | `["agents"]` | Cache key |

```tsx
const { data: agents } = useAgents();
```

### `useAgent(id: string)`

Fetches a single agent by ID.

| Property | Type | Description |
|----------|------|-------------|
| **Parameter** | `id: string` | Agent ID |
| **Returns** | `UseQueryResult<Agent>` | Single agent |
| **Query Key** | `["agents", id]` | Scoped cache key |
| **Enabled** | `!!id` | Only runs when `id` is truthy |

```tsx
const { data: agent } = useAgent("agent-abc");
```

### `useCreateAgent()`

Creates a new agent with a session key. On success, invalidates `["agents"]`.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseMutationResult` | Mutation result |
| **Input** | `CreateAgentRequest` | `{ walletId, name, policyId, expiresAt }` |
| **On Success** | Invalidates `["agents"]` | Triggers re-fetch |

```tsx
const createAgent = useCreateAgent();

createAgent.mutate({
  walletId: "w1",
  name: "Payment Agent",
  policyId: "p1",
  expiresAt: "2025-12-31T23:59:59",
});
```

### `useRevokeAgent()`

Revokes an agent's session key. On success, invalidates `["agents"]`.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseMutationResult` | Mutation result |
| **Input** | `string` | Agent ID to revoke |
| **Endpoint** | `POST /agents/:id/revoke` | Revocation endpoint |

```tsx
const revokeAgent = useRevokeAgent();
revokeAgent.mutate("agent-abc");
```

---

## Policy Hooks

**Source:** `src/hooks/usePolicy.ts`

### `usePolicies()`

Fetches all policies.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseQueryResult<Policy[]>` | All policies |
| **Query Key** | `["policies"]` | Cache key |

```tsx
const { data: policies } = usePolicies();
```

### `usePolicy(id: string)`

Fetches a single policy by ID.

| Property | Type | Description |
|----------|------|-------------|
| **Parameter** | `id: string` | Policy ID |
| **Returns** | `UseQueryResult<Policy>` | Single policy |
| **Enabled** | `!!id` | Only runs when `id` is truthy |

```tsx
const { data: policy } = usePolicy("policy-xyz");
```

### `useCreatePolicy()`

Creates a new policy. On success, invalidates `["policies"]`.

| Property | Type | Description |
|----------|------|-------------|
| **Input** | `CreatePolicyRequest` | `{ name, spending, allowlist, timeWindow }` |
| **On Success** | Invalidates `["policies"]` | Triggers re-fetch |

```tsx
const createPolicy = useCreatePolicy();

createPolicy.mutate({
  name: "Default Policy",
  spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
  allowlist: { contracts: ["0xabc..."], functions: ["transfer(address,uint256)"] },
  timeWindow: { validAfter: "", validUntil: "" },
});
```

### `useDeletePolicy()`

Deletes a policy by ID. On success, invalidates `["policies"]`.

| Property | Type | Description |
|----------|------|-------------|
| **Input** | `string` | Policy ID to delete |
| **On Success** | Invalidates `["policies"]` | Triggers re-fetch |

```tsx
const deletePolicy = useDeletePolicy();
deletePolicy.mutate("policy-xyz");
```

---

## x402 Payment Hooks

**Source:** `src/hooks/useX402.ts`

These hooks power the payment tracking system for x402 micropayments.

### `usePayments()`

Fetches the full payment history.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseQueryResult<Payment[]>` | All recorded payments |
| **Query Key** | `["payments"]` | Cache key |

```tsx
const { data: payments } = usePayments();
```

### `usePaymentStats()`

Fetches aggregated payment statistics.

| Property | Type | Description |
|----------|------|-------------|
| **Returns** | `UseQueryResult<PaymentStats>` | Aggregate stats |
| **Query Key** | `["payments", "stats"]` | Cache key |

```tsx
const { data: stats } = usePaymentStats();
console.log(stats?.totalSpent, stats?.totalPayments);
```

---

## DeFi Hooks

**Source:** `src/hooks/useDefi.ts`

These hooks provide mutation-only operations for DeFi actions. They call the API directly via `apiClient` and return a transaction hash on success.

### `useSwap()`

Executes a token swap.

| Property | Type | Description |
|----------|------|-------------|
| **Input** | `SwapRequest` | `{ walletId, fromToken, toToken, amount }` |
| **Returns** | `UseMutationResult<{ txHash: string }>` | Transaction result |
| **Endpoint** | `POST /defi/swap` | Swap endpoint |

```tsx
const swap = useSwap();

swap.mutate({
  walletId: "w1",
  fromToken: "ETH",
  toToken: "USDC",
  amount: "1.0",
});
```

### `useLend()`

Executes a lending deposit.

| Property | Type | Description |
|----------|------|-------------|
| **Input** | `LendRequest` | `{ walletId, token, amount, protocol }` |
| **Returns** | `UseMutationResult<{ txHash: string }>` | Transaction result |
| **Endpoint** | `POST /defi/lend` | Lend endpoint |

```tsx
const lend = useLend();

lend.mutate({
  walletId: "w1",
  token: "USDC",
  amount: "1000",
  protocol: "aave",
});
```

### `useStake()`

Executes a staking transaction.

| Property | Type | Description |
|----------|------|-------------|
| **Input** | `StakeRequest` | `{ walletId, token, amount, validator }` |
| **Returns** | `UseMutationResult<{ txHash: string }>` | Transaction result |
| **Endpoint** | `POST /defi/stake` | Stake endpoint |

```tsx
const stake = useStake();

stake.mutate({
  walletId: "w1",
  token: "ETH",
  amount: "32.0",
  validator: "0xvalidator...",
});
```

---

## React Query Configuration

The `QueryClient` in `App.tsx` is configured with:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- **retry: 1** -- Failed queries are retried once before reporting an error.
- **refetchOnWindowFocus: false** -- Queries do not automatically re-fetch when the browser tab regains focus.
