# Store

[<- Back to README](./README.md) | [Types](./types.md)

---

All data stores are in-memory `Map`-based implementations located in `src/store/`. They are re-exported from `src/store/index.ts`.

Data is **not persisted** across server restarts. All stores follow a similar pattern: objects are keyed by their `id` field in a `Map<string, T>`, and standard CRUD operations are provided.

---

## Architecture

```
+-------------------------------------------------------------------+
|                    In-Memory Store Layer                           |
|                                                                   |
|  walletsStore       agentsStore       policiesStore               |
|  Map<string,        Map<string,       Map<string,                 |
|      Wallet>            Agent>            Policy>                 |
|                                                                   |
|  paymentsStore      keyStore (internal to KeyManagerService)      |
|  Map<string,        Map<string,                                   |
|      Payment>           StoredKey>                                |
+-------------------------------------------------------------------+
```

Each store is a plain JavaScript object (not a class) with methods that mutate the underlying `Map`. The `update` methods automatically set the `updatedAt` field to the current ISO 8601 timestamp.

---

## walletsStore

**Source:** `src/store/wallets.store.ts`
**Backing structure:** `Map<string, Wallet>`

### Methods

#### `create(wallet: Wallet): Wallet`

Adds a wallet to the store. The wallet object must have a pre-generated `id`.

**Returns:** The same wallet object.

---

#### `get(id: string): Wallet | undefined`

Retrieves a wallet by ID.

**Returns:** The wallet object, or `undefined` if not found.

---

#### `list(): Wallet[]`

Returns all wallets as an array (insertion order).

---

#### `update(id: string, data: Partial<Wallet>): Wallet | undefined`

Merges `data` into the existing wallet using spread syntax. Automatically updates `updatedAt` to the current timestamp.

**Returns:** The updated wallet, or `undefined` if the ID does not exist.

---

#### `delete(id: string): boolean`

Removes a wallet by ID.

**Returns:** `true` if the wallet existed and was deleted, `false` otherwise.

---

#### `clear(): void`

Removes all wallets. Useful for testing.

---

## agentsStore

**Source:** `src/store/agents.store.ts`
**Backing structure:** `Map<string, Agent>`

### Methods

#### `create(agent: Agent): Agent`

Adds an agent to the store.

**Returns:** The same agent object.

---

#### `get(id: string): Agent | undefined`

Retrieves an agent by ID.

**Returns:** The agent object, or `undefined` if not found.

---

#### `list(): Agent[]`

Returns all agents as an array.

---

#### `listByWallet(walletId: string): Agent[]`

Returns all agents whose `walletId` matches the given value.

---

#### `update(id: string, data: Partial<Agent>): Agent | undefined`

Merges `data` into the existing agent. Automatically updates `updatedAt`.

**Returns:** The updated agent, or `undefined` if the ID does not exist.

---

#### `delete(id: string): boolean`

Removes an agent by ID.

**Returns:** `true` if deleted, `false` otherwise.

---

#### `deleteByWallet(walletId: string): number`

Removes all agents belonging to a specific wallet.

**Returns:** The number of agents deleted.

---

#### `clear(): void`

Removes all agents. Useful for testing.

---

## policiesStore

**Source:** `src/store/policies.store.ts`
**Backing structure:** `Map<string, Policy>`

### Methods

#### `create(policy: Policy): Policy`

Adds a policy to the store.

**Returns:** The same policy object.

---

#### `get(id: string): Policy | undefined`

Retrieves a policy by ID.

**Returns:** The policy object, or `undefined` if not found.

---

#### `list(): Policy[]`

Returns all policies as an array.

---

#### `update(id: string, data: Partial<Policy>): Policy | undefined`

Merges `data` into the existing policy. Automatically updates `updatedAt`.

**Returns:** The updated policy, or `undefined` if the ID does not exist.

---

#### `delete(id: string): boolean`

Removes a policy by ID.

**Returns:** `true` if deleted, `false` otherwise.

---

#### `clear(): void`

Removes all policies. Useful for testing.

---

## paymentsStore

**Source:** `src/store/payments.store.ts`
**Backing structure:** `Map<string, Payment>`

The payments store differs from other stores in that it uses `append` instead of `create` (reflecting append-only semantics), provides multiple filtered list methods, and includes an `aggregate` method for analytics.

### Methods

#### `append(payment: Payment): Payment`

Adds a payment to the store (append-only operation).

**Returns:** The same payment object.

---

#### `get(id: string): Payment | undefined`

Retrieves a payment by ID.

**Returns:** The payment object, or `undefined` if not found.

---

#### `list(): Payment[]`

Returns all payments sorted by `createdAt` descending (newest first).

---

#### `listByAgent(agentId: string): Payment[]`

Returns payments filtered by agent ID, sorted by `createdAt` descending.

---

#### `listByWallet(walletId: string): Payment[]`

Returns payments filtered by wallet ID, sorted by `createdAt` descending.

---

#### `listByDomain(domain: string): Payment[]`

Returns payments filtered by domain, sorted by `createdAt` descending.

---

#### `listByDateRange(start: Date, end: Date): Payment[]`

Returns payments within the given date range (inclusive), sorted by `createdAt` descending.

---

#### `aggregate(): { totalSpent, totalCount, byAgent, byDomain }`

Computes aggregate statistics across all completed payments.

**Returns:**

```typescript
{
  totalSpent: number;        // Sum of all completed payment amounts
  totalCount: number;        // Count of completed payments
  byAgent: Record<string, { spent: number; count: number }>;   // Grouped by agentId
  byDomain: Record<string, { spent: number; count: number }>;  // Grouped by domain
}
```

Only payments with `status === "completed"` are included in aggregation.

---

#### `clear(): void`

Removes all payments. Useful for testing.

---

## Key Store (KeyManagerService Internal)

**Source:** `src/services/keymanager.service.ts`
**Backing structure:** `Map<string, StoredKey>`

This is not in the `store/` directory but functions as an in-memory store for agent key material. See [Services: KeyManagerService](./services.md#keymanagerservice) for details.

```typescript
interface StoredKey {
  publicKey: string;           // Ethereum address
  encryptedPrivateKey: string; // Base64-encoded private key
  createdAt: string;           // ISO 8601 timestamp
}
```

---

## Common Patterns

### Update Semantics

All `update` methods use spread syntax to merge fields:

```typescript
const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
```

This means:
- Only provided fields are overwritten.
- The `updatedAt` field is always refreshed.
- Nested objects are replaced entirely, not deep-merged.

### Thread Safety

Since Node.js is single-threaded for JavaScript execution, the in-memory stores do not require locking. However, they are not safe for multi-process deployments without an external coordination layer.

### Data Persistence

All data is lost on server restart. For production use, these stores should be replaced with a persistent database layer.

---

## Related

- [Types](./types.md) -- TypeScript interfaces stored in these maps
- [Services](./services.md) -- Service layer that operates on these stores
