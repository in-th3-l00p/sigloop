# Services

[<- Back to README](./README.md) | [Middleware](./middleware.md) | [Types ->](./types.md)

---

The service layer contains all business logic. Each service is a singleton class instance that orchestrates validation, store operations, and cross-service interactions.

---

## WalletService

**Source:** `src/services/wallet.service.ts`
**Singleton:** `walletService`

Manages wallet creation and lifecycle. Generates Ethereum private keys using `viem` and derives addresses from them.

### Methods

#### `create(request: CreateWalletRequest): Wallet`

Creates a new wallet with a generated Ethereum address.

**Parameters:**

| Field     | Type     | Required | Default | Description                          |
|-----------|----------|----------|---------|--------------------------------------|
| `name`    | `string` | Yes      | --      | Wallet name (trimmed, must be non-empty). |
| `chainId` | `number` | No       | `1`     | EVM chain ID.                        |

**Behavior:**
1. Validates that `name` is present and non-empty.
2. Generates a new Ethereum private key via `viem/accounts.generatePrivateKey()`.
3. Derives the public address via `viem/accounts.privateKeyToAccount()`.
4. Creates a `Wallet` object with a UUID, the derived address, the provided name (trimmed), and chain ID.
5. Stores the wallet in `walletsStore` and returns it.

**Throws:**
- `"Wallet name is required"` -- if `name` is missing or empty.

**Note:** The generated private key is not stored by the wallet service. It is used only to derive the address. For agent session keys, see [KeyManagerService](#keymanagerservice).

---

#### `get(id: string): Wallet`

Retrieves a wallet by ID.

**Throws:**
- `"Wallet not found: <id>"` -- if no wallet exists with the given ID.

---

#### `list(): Wallet[]`

Returns all wallets as an array.

---

#### `delete(id: string): void`

Deletes a wallet by ID.

**Throws:**
- `"Wallet not found: <id>"` -- if no wallet exists with the given ID.

---

## AgentService

**Source:** `src/services/agent.service.ts`
**Singleton:** `agentService`

Manages agent lifecycle including creation with key pair generation, revocation, and deletion. Coordinates with `walletsStore`, `policiesStore`, and `keyManagerService`.

### Methods

#### `create(walletId: string, request: CreateAgentRequest): { agent: Agent; sessionKey: string }`

Creates a new agent bound to a wallet with a generated cryptographic key pair.

**Parameters:**

| Field         | Type       | Required | Default | Description                                      |
|---------------|------------|----------|---------|--------------------------------------------------|
| `walletId`    | `string`   | Yes      | --      | UUID of the parent wallet (path parameter).      |
| `name`        | `string`   | Yes      | --      | Agent name (trimmed, must be non-empty).         |
| `policyId`    | `string`   | No       | `null`  | UUID of an existing policy.                      |
| `permissions` | `string[]` | No       | `[]`    | Array of permission strings.                     |

**Behavior:**
1. Validates that `name` is present and non-empty.
2. Verifies the wallet exists in `walletsStore`.
3. If `policyId` is provided, verifies the policy exists in `policiesStore`.
4. Generates a key pair via `keyManagerService.generateKeyPair()`.
5. Stores the key pair via `keyManagerService.storeKey()`.
6. Creates an `Agent` object with status `"active"`, the generated `publicKey`, and `revokedAt: null`.
7. Stores the agent in `agentsStore`.
8. Returns the agent and the `privateKey` as `sessionKey`.

**Throws:**
- `"Agent name is required"` -- if `name` is missing or empty.
- `"Wallet not found: <walletId>"` -- if the wallet does not exist.
- `"Policy not found: <policyId>"` -- if the specified policy does not exist.

---

#### `get(id: string): Agent`

Retrieves an agent by ID.

**Throws:**
- `"Agent not found: <id>"` -- if no agent exists with the given ID.

---

#### `list(): Agent[]`

Returns all agents as an array.

---

#### `listByWallet(walletId: string): Agent[]`

Returns all agents belonging to a specific wallet.

---

#### `revoke(id: string): Agent`

Revokes an active agent, setting its status to `"revoked"` and recording the revocation timestamp. Deletes the agent's key material.

**Behavior:**
1. Retrieves the agent from the store.
2. Checks that the agent is not already revoked.
3. Updates the agent with `status: "revoked"` and `revokedAt: <current ISO timestamp>`.
4. Deletes the key from `keyManagerService`.
5. Returns the updated agent.

**Throws:**
- `"Agent not found: <id>"` -- if the agent does not exist.
- `"Agent is already revoked: <id>"` -- if the agent's status is already `"revoked"`.

---

#### `delete(id: string): void`

Permanently deletes an agent and its key material.

**Throws:**
- `"Agent not found: <id>"` -- if the agent does not exist.

---

## PolicyService

**Source:** `src/services/policy.service.ts`
**Singleton:** `policyService`

Manages policy CRUD operations and rule validation.

### Methods

#### `create(request: CreatePolicyRequest): Policy`

Creates a new policy with validated rules.

**Parameters:**

| Field         | Type          | Required | Default | Description                      |
|---------------|---------------|----------|---------|----------------------------------|
| `name`        | `string`      | Yes      | --      | Policy name (trimmed).           |
| `description` | `string`      | No       | `""`    | Policy description (trimmed).    |
| `rules`       | `PolicyRule[]` | Yes      | --      | Array of rules (at least one).   |

**Behavior:**
1. Validates `name` is present and non-empty.
2. Validates `rules` is present and non-empty.
3. Validates each rule individually (see rule validation below).
4. Creates and stores the policy.

**Throws:** See [Rule Validation](#rule-validation) for the full list of validation errors.

---

#### `get(id: string): Policy`

Retrieves a policy by ID.

**Throws:**
- `"Policy not found: <id>"` -- if no policy exists with the given ID.

---

#### `list(): Policy[]`

Returns all policies as an array.

---

#### `update(id: string, request: Partial<CreatePolicyRequest>): Policy`

Updates an existing policy. Only provided fields are modified.

**Behavior:**
1. Verifies the policy exists.
2. If `rules` is provided, validates the new rules (same validation as create).
3. Merges the updates and sets a new `updatedAt` timestamp.

**Throws:**
- `"Policy not found: <id>"` -- if the policy does not exist.
- Rule validation errors if `rules` is provided.

---

#### `delete(id: string): void`

Deletes a policy by ID.

**Throws:**
- `"Policy not found: <id>"` -- if the policy does not exist.

---

#### `compose(policyIds: string[]): PolicyRule[]`

Merges rules from multiple policies into a single flat array. Useful for combining policies applied to a single agent.

**Parameters:**
- `policyIds` -- Array of policy UUIDs.

**Returns:** Flat array of all `PolicyRule` objects from all specified policies.

**Throws:**
- `"Policy not found: <id>"` -- if any specified policy does not exist.

---

### Rule Validation

The `validateRule` private method enforces the following constraints:

| Rule Type        | Validation                                                              |
|------------------|-------------------------------------------------------------------------|
| _(any)_          | `type` must be one of: `"spending_limit"`, `"allowlist"`, `"time_window"`. |
| `spending_limit` | `spendingLimit` object is required.                                     |
| `spending_limit` | `spendingLimit.maxAmount` must parse to a positive number.              |
| `spending_limit` | `spendingLimit.period` must be: `"hourly"`, `"daily"`, `"weekly"`, or `"monthly"`. |
| `allowlist`      | `allowlist` object is required.                                         |
| `allowlist`      | At least one of `allowlist.addresses` or `allowlist.domains` must be non-empty. |
| `time_window`    | `timeWindow` object is required.                                        |
| `time_window`    | `timeWindow.startHour` must be between 0 and 23 (inclusive).            |
| `time_window`    | `timeWindow.endHour` must be between 0 and 23 (inclusive).              |

---

## PaymentService

**Source:** `src/services/payment.service.ts`
**Singleton:** `paymentService`

Handles payment recording, filtered listing, and aggregate statistics.

### Methods

#### `record(request: RecordPaymentRequest): Payment`

Records a new payment transaction.

**Parameters:**

| Field      | Type                     | Required | Default  | Description                         |
|------------|--------------------------|----------|----------|-------------------------------------|
| `agentId`  | `string`                 | Yes      | --       | UUID of the agent.                  |
| `walletId` | `string`                 | Yes      | --       | UUID of the wallet.                 |
| `domain`   | `string`                 | Yes      | --       | Domain receiving the payment.       |
| `amount`   | `string`                 | Yes      | --       | Amount as a string (positive).      |
| `currency` | `string`                 | No       | `"USDC"` | Currency symbol.                    |
| `metadata` | `Record<string, string>` | No       | `{}`     | Arbitrary key-value metadata.       |

**Behavior:**
1. Validates all required fields are present and non-empty.
2. Validates `amount` parses to a positive number.
3. Verifies the agent exists.
4. Verifies the wallet exists.
5. Verifies the agent belongs to the specified wallet (`agent.walletId === request.walletId`).
6. Creates a `Payment` with status `"completed"` and stores it.

**Throws:**
- `"agentId is required"` -- if `agentId` is missing or empty.
- `"walletId is required"` -- if `walletId` is missing or empty.
- `"domain is required"` -- if `domain` is missing or empty.
- `"amount is required"` -- if `amount` is missing.
- `"amount must be a positive number"` -- if `amount` is not a positive number.
- `"Agent not found: <agentId>"` -- if the agent does not exist.
- `"Wallet not found: <walletId>"` -- if the wallet does not exist.
- `"Agent does not belong to the specified wallet"` -- if the agent's wallet does not match.

---

#### `list(filters?): Payment[]`

Lists payments with optional filters. All filters are combined with AND logic.

**Filter Parameters:**

| Field       | Type     | Description                                  |
|-------------|----------|----------------------------------------------|
| `agentId`   | `string` | Exact match on agent UUID.                   |
| `walletId`  | `string` | Exact match on wallet UUID.                  |
| `domain`    | `string` | Exact match on domain.                       |
| `startDate` | `string` | ISO 8601 datetime, inclusive lower bound.    |
| `endDate`   | `string` | ISO 8601 datetime, inclusive upper bound.    |

**Returns:** Array of `Payment` objects sorted by `createdAt` descending (newest first).

---

#### `getStats(): PaymentStats`

Computes aggregate statistics across all completed payments.

**Returns:**

| Field               | Type     | Description                                      |
|---------------------|----------|--------------------------------------------------|
| `totalSpent`        | `string` | Total spent across all completed payments (6 decimal places). |
| `totalTransactions` | `number` | Count of completed payments.                     |
| `byAgent`           | `object` | Map of `agentId` to `{ spent, count }`.          |
| `byDomain`          | `object` | Map of `domain` to `{ spent, count }`.           |
| `byPeriod`          | `array`  | Daily breakdown with `{ period, spent, count }`.  |

---

## AnalyticsService

**Source:** `src/services/analytics.service.ts`
**Singleton:** `analyticsService`

Provides time-series spending analytics and per-agent activity summaries.

### Methods

#### `getSpending(params?): SpendingDataPoint[]`

Aggregates payment data into time-bucketed data points.

**Parameters:**

| Field       | Type     | Default   | Description                                      |
|-------------|----------|-----------|--------------------------------------------------|
| `period`    | `string` | `"daily"` | `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`.  |
| `startDate` | `string` | --        | ISO 8601 datetime filter.                        |
| `endDate`   | `string` | --        | ISO 8601 datetime filter.                        |
| `walletId`  | `string` | --        | Filter by wallet.                                |
| `agentId`   | `string` | --        | Filter by agent.                                 |

**Returns:** Array of `{ period: string, totalSpent: string, transactionCount: number }` sorted chronologically.

Only includes payments with status `"completed"`.

---

#### `getAgentActivity(params?): AgentActivityEntry[]`

Generates activity summaries for all agents (or agents of a specific wallet).

**Parameters:**

| Field      | Type     | Default   | Description                                |
|------------|----------|-----------|--------------------------------------------|
| `walletId` | `string` | --        | Filter agents by wallet.                   |
| `limit`    | `number` | `50`      | Maximum entries to return.                 |
| `sortBy`   | `string` | `"spent"` | `"spent"`, `"transactions"`, or `"recent"`. |

**Returns:** Array of:

| Field              | Type       | Description                              |
|--------------------|------------|------------------------------------------|
| `agentId`          | `string`   | Agent UUID.                              |
| `name`             | `string`   | Agent name.                              |
| `walletId`         | `string`   | Parent wallet UUID.                      |
| `totalSpent`       | `string`   | Total spent (6 decimal places).          |
| `transactionCount` | `number`   | Number of completed payments.            |
| `lastActive`       | `string | null` | ISO timestamp of last payment, or `null`. |
| `domains`          | `string[]` | Unique domains the agent has paid.       |

---

#### `getTopConsumers(limit?: number): Array<{ agentId, name, totalSpent, transactionCount }>`

Convenience method that returns the top-spending agents. Delegates to `getAgentActivity` with `sortBy: "spent"`.

**Parameters:**
- `limit` -- Maximum number of results (default: `10`).

**Returns:** Simplified array with `agentId`, `name`, `totalSpent`, and `transactionCount`.

---

### Private: `getBucketKey(timestamp, period)`

Converts a timestamp into a period bucket key string:

| Period    | Example Output          | Logic                               |
|-----------|-------------------------|-------------------------------------|
| `hourly`  | `2026-02-23T14:00:00Z`  | Truncate to hour in UTC.            |
| `daily`   | `2026-02-23`            | Extract date portion before `T`.    |
| `weekly`  | `2026-W02-17`           | Find Monday of the ISO week.        |
| `monthly` | `2026-02`               | Year and zero-padded month.         |

---

## KeyManagerService

**Source:** `src/services/keymanager.service.ts`
**Singleton:** `keyManagerService`

Manages cryptographic key pairs for agents. Keys are stored in-memory with the private key base64-encoded.

### Methods

#### `generateKeyPair(): { publicKey: string; privateKey: string }`

Generates a new Ethereum key pair using `viem`.

**Returns:**
- `publicKey` -- The Ethereum address derived from the private key.
- `privateKey` -- The raw hex private key.

---

#### `storeKey(id: string, publicKey: string, privateKey: string): void`

Stores a key pair associated with an agent ID. The private key is base64-encoded before storage.

---

#### `retrievePublicKey(id: string): string | undefined`

Returns the stored public key for the given ID, or `undefined` if not found.

---

#### `retrievePrivateKey(id: string): string | undefined`

Returns the decrypted (base64-decoded) private key for the given ID, or `undefined` if not found.

---

#### `deleteKey(id: string): boolean`

Deletes the key pair for the given ID. Returns `true` if a key was deleted, `false` if no key existed.

---

#### `hasKey(id: string): boolean`

Returns `true` if a key pair exists for the given ID.

---

### Internal Storage

Keys are stored in an in-memory `Map<string, StoredKey>` where:

```typescript
interface StoredKey {
  publicKey: string;
  encryptedPrivateKey: string;  // base64-encoded
  createdAt: string;            // ISO 8601 timestamp
}
```

The "encryption" is base64 encoding (not production-grade encryption). This is suitable for development and demonstration purposes.

---

## Related

- [Types](./types.md) -- All TypeScript interfaces used by services
- [Store](./store.md) -- Underlying data stores used by services
- [Middleware](./middleware.md) -- Error handler that catches service exceptions
