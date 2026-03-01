# Backend Service

Production backend at `software/backend/`. Hono framework serving REST, GraphQL, and WebSocket on a single port.

**Stack:** Hono 4.7, graphql-yoga 5.10, @hono/node-ws, viem, all six @sigloop/* libraries

**Files:** 28 source, 23 test (159 tests passing)

---

## Entry Point

```
src/index.ts
  → createConfig()        (env vars + defaults)
  → createApp(config)     (composition root)
  → setupWebSocket(app)   (upgrade handler)
  → serve()               (port 3001)
```

Three surfaces on the same server:

| Surface   | Path         | Protocol |
|-----------|--------------|----------|
| REST API  | `/api/*`     | HTTP     |
| GraphQL   | `/graphql`   | HTTP     |
| WebSocket | `/ws`        | WS       |

---

## Configuration

`src/config.ts` — `createConfig(overrides?): Config`

| Field                | Env Variable           | Default              |
|----------------------|------------------------|----------------------|
| `port`               | `PORT`                 | `3001`               |
| `apiKey`             | `API_KEY`              | `sigloop-dev-key`    |
| `rpcUrl`             | `RPC_URL`              | `http://localhost:8545` |
| `bundlerUrl`         | `BUNDLER_URL`          | (empty)              |
| `zerodevProjectId`   | `ZERODEV_PROJECT_ID`   | (empty)              |
| `defaultChainId`     | `DEFAULT_CHAIN_ID`     | `8453` (Base)        |
| `rateLimitMaxTokens` | —                      | `100`                |
| `rateLimitRefillRate` | —                     | `10`                 |
| `wsHeartbeatInterval` | —                     | `30000`              |
| `version`            | —                      | `0.1.0`              |

---

## Middleware Stack

Applied in order per request:

1. **CORS** (`src/middleware/cors.ts`) — `createCorsMiddleware()` wraps Hono's built-in CORS.

2. **Error Handler** (`src/middleware/error-handler.ts`) — `errorHandler` catches thrown errors and maps known messages to HTTP status codes:
   - `"not found"` → 404
   - `"required"` / `"invalid"` → 400
   - `"already"` → 409
   - Everything else → 500

3. **Rate Limiter** (`src/middleware/rate-limit.ts`) — `createRateLimitMiddleware(config)` implements token bucket per client IP. Returns `429 Too Many Requests` when exhausted. Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.

4. **Auth** (`src/middleware/auth.ts`) — `createAuthMiddleware(config)` validates the `X-API-KEY` header against `config.apiKey`. Returns 401 if missing, 403 if invalid.

The health endpoint is mounted before auth/rate-limit, so it's always accessible.

---

## Stores

Five in-memory stores under `src/stores/`. All are closure factories returning an object of methods over a `Map` (or array).

| Store            | Backing        | Key Methods                                    |
|------------------|----------------|------------------------------------------------|
| `walletsStore`   | `Map<id, WalletRecord>` | get, create, list, update, delete, clear |
| `agentsStore`    | `Map<id, AgentRecord>`  | get, create, list, listByWallet, update, delete, deleteByWallet, clear |
| `policiesStore`  | `Map<id, PolicyRecord>` | get, create, list, listByType, update, delete, clear |
| `paymentsStore`  | `PaymentRecord[]`       | append, list (with filters), getStats, aggregate, clear |
| `eventsStore`    | `Set<WsClient>` + ring buffer | addClient, removeClient, getClients, pushEvent, getRecent |

---

## Services

Seven services under `src/services/`. Each accepts a dependencies object for testability.

### Keys Service

`createKeysService()` — Stateless key generation.

| Method              | Returns                      |
|---------------------|------------------------------|
| `generate()`        | `{ privateKey, address }`    |
| `encrypt(key)`      | Base64-encoded key (placeholder for real encryption) |
| `decrypt(encrypted)` | Original key                |

### Wallet Service

`createWalletService({ walletsStore, keysService, eventsStore, config })`

| Method                        | Description                                    |
|-------------------------------|------------------------------------------------|
| `create(req)`                 | Generate key, create record, return wallet     |
| `get(id)`                     | Retrieve wallet by ID                          |
| `list()`                      | List all wallets                               |
| `delete(id)`                  | Remove wallet and cascade-delete agents        |
| `signMessage(id, { message })` | Sign a message with the wallet's private key |
| `sendTransaction(id, tx)`    | Sign and submit a transaction via RPC          |

### Agent Service

`createAgentService({ agentsStore, walletsStore, policiesStore, keysService, eventsStore })`

| Method                        | Description                                    |
|-------------------------------|------------------------------------------------|
| `create(walletId, req)`       | Generate session key, create agent, emit event |
| `get(id)`                     | Get agent (strips private key from response)   |
| `list(walletId?)`             | List agents, optionally filtered by wallet     |
| `revoke(id)`                  | Set status to `revoked`, emit event            |
| `delete(id)`                  | Remove agent record                            |
| `signUserOp(id, hash)`        | Sign a UserOperation hash with session key     |
| `getPolicy(id)`               | Get the policy bound to an agent               |
| `getSession(id)`              | Get session status: active, expiresAt, remaining |

### Policy Service

`createPolicyService({ policiesStore })`

| Method                | Description                                          |
|-----------------------|------------------------------------------------------|
| `create(req)`         | Create a policy (agent, x402, or spending type)      |
| `get(id)`             | Retrieve policy by ID                                |
| `list()`              | List all policies                                    |
| `update(id, partial)` | Partial update of policy config                     |
| `delete(id)`          | Remove policy                                        |
| `encode(id)`          | ABI-encode the policy for on-chain installation      |
| `compose(ids)`        | Merge multiple agent policies via AND composition    |

### Payment Service

`createPaymentService({ paymentsStore, agentsStore, walletsStore, eventsStore })`

| Method                       | Description                                    |
|------------------------------|------------------------------------------------|
| `record(req)`                | Validate agent+wallet, record payment, update budget, emit events |
| `list(filters?)`             | Filter payments by agent, wallet, domain, date |
| `getStats()`                 | Aggregate stats: total, by-agent, by-domain, by-period |
| `getBudget(walletId)`        | Get current budget state for a wallet          |
| `checkBudget(walletId, req)` | Check if a proposed spend is within budget     |

Budget tracking uses `@sigloop/x402`'s `createBudgetTracker`. Events emitted:
- `payment:recorded` — on every recorded payment
- `budget:warning` — when daily spend exceeds 80% of limit
- `budget:exceeded` — when daily spend exceeds limit

### DeFi Service

`createDeFiService()` — Stateless, no dependencies.

| Method             | Description                                         |
|--------------------|-----------------------------------------------------|
| `encodeSwap(req)`  | Encode Uniswap V3 swap via `createDeFiActions`      |
| `encodeSupply(req)` | Encode Aave V3 supply call                         |
| `encodeBorrow(req)` | Encode Aave V3 borrow call                         |
| `encodeRepay(req)` | Encode Aave V3 repay call                           |
| `encodeApprove(req)` | Encode ERC-20 approve call                        |

All methods return `{ to, data, value }` for the encoded calldata.

### Analytics Service

`createAnalyticsService({ paymentsStore, agentsStore })`

| Method                  | Description                                       |
|-------------------------|---------------------------------------------------|
| `getSpending(filters?)` | Time-series spending aggregation (hourly/daily/weekly/monthly buckets) |
| `getAgentActivity(filters?)` | Agent ranking by spend, transactions, or recency |

---

## REST API Endpoints

All routes under `/api`. Protected by auth except `/api/health`.

### Health

| Method | Path          | Response                                     |
|--------|---------------|----------------------------------------------|
| GET    | `/api/health` | `{ status: "ok", version, timestamp }`       |

### Wallets

| Method | Path                           | Body / Params                   | Response          |
|--------|--------------------------------|---------------------------------|-------------------|
| POST   | `/api/wallets`                 | `{ name, chainId? }`           | WalletRecord      |
| GET    | `/api/wallets`                 | —                               | WalletRecord[]    |
| GET    | `/api/wallets/:id`             | —                               | WalletRecord      |
| DELETE | `/api/wallets/:id`             | —                               | `{ deleted: true }` |
| POST   | `/api/wallets/:id/sign-message` | `{ message }`                  | `{ signature }`   |
| POST   | `/api/wallets/:id/send-transaction` | `{ to, value?, data? }`   | `{ txHash }`      |

### Agents

| Method | Path                              | Body / Params                              | Response            |
|--------|-----------------------------------|--------------------------------------------|---------------------|
| POST   | `/api/wallets/:walletId/agents`   | `{ name, policyId?, sessionDuration? }`    | `{ agent, sessionKey }` |
| GET    | `/api/agents`                     | `?walletId=`                               | AgentResponse[]     |
| GET    | `/api/agents/:id`                 | —                                          | AgentResponse       |
| POST   | `/api/agents/:id/revoke`          | —                                          | AgentResponse       |
| DELETE | `/api/agents/:id`                 | —                                          | `{ deleted: true }` |
| POST   | `/api/agents/:id/sign-user-op`    | `{ userOpHash }`                           | `{ signature }`     |
| GET    | `/api/agents/:id/policy`          | —                                          | JSON (policy config) |
| GET    | `/api/agents/:id/session`         | —                                          | `{ active, expiresAt, remainingSeconds }` |

### Policies

| Method | Path                         | Body / Params                         | Response          |
|--------|------------------------------|---------------------------------------|-------------------|
| POST   | `/api/policies`              | `{ name, type, config }`             | PolicyRecord      |
| GET    | `/api/policies`              | —                                     | PolicyRecord[]    |
| GET    | `/api/policies/:id`          | —                                     | PolicyRecord      |
| PUT    | `/api/policies/:id`          | `{ name?, type?, config? }`          | PolicyRecord      |
| DELETE | `/api/policies/:id`          | —                                     | `{ deleted: true }` |
| POST   | `/api/policies/:id/encode`   | —                                     | `{ encoded }`     |
| POST   | `/api/policies/compose`      | `{ policyIds }`                       | PolicyRecord      |

### Payments

| Method | Path                          | Body / Params                                   | Response          |
|--------|-------------------------------|-------------------------------------------------|-------------------|
| POST   | `/api/payments`               | `{ agentId, walletId, domain, amount, ... }`    | PaymentRecord     |
| GET    | `/api/payments`               | `?agentId=&walletId=&domain=&startDate=&endDate=` | PaymentRecord[] |
| GET    | `/api/payments/stats`         | —                                                | PaymentStats      |
| GET    | `/api/payments/budget/:walletId` | —                                             | BudgetState       |
| POST   | `/api/payments/check-budget`  | `{ walletId, amount, domain? }`                 | `{ allowed, reason? }` |

### DeFi

| Method | Path                    | Body                                                    | Response     |
|--------|-------------------------|---------------------------------------------------------|--------------|
| POST   | `/api/defi/swap`        | `{ chainId, tokenIn, tokenOut, amountIn, minAmountOut, recipient }` | EncodedCall |
| POST   | `/api/defi/supply`      | `{ chainId, asset, amount, onBehalfOf }`                | EncodedCall  |
| POST   | `/api/defi/borrow`      | `{ chainId, asset, amount, onBehalfOf }`                | EncodedCall  |
| POST   | `/api/defi/repay`       | `{ chainId, asset, amount, onBehalfOf }`                | EncodedCall  |
| POST   | `/api/defi/approve`     | `{ token, spender, amount }`                            | `{ to, data }` |

### Analytics

| Method | Path                         | Query Params                                      | Response             |
|--------|------------------------------|---------------------------------------------------|----------------------|
| GET    | `/api/analytics/spending`    | `?period=&startDate=&endDate=&walletId=&agentId=` | SpendingDataPoint[]  |
| GET    | `/api/analytics/agents`      | `?walletId=&limit=&sortBy=`                       | AgentActivityEntry[] |

---

## GraphQL API

Mounted at `/graphql`. Uses graphql-yoga with Hono integration.

### Queries (14)

```graphql
wallet(id: ID!): Wallet
wallets: [Wallet!]!
agent(id: ID!): Agent
agents(walletId: ID): [Agent!]!
policy(id: ID!): Policy
policies: [Policy!]!
payments(filters: PaymentFiltersInput): [Payment!]!
paymentStats: PaymentStats!
budget(walletId: ID!): BudgetState!
agentPolicy(agentId: ID!): JSON
agentSession(agentId: ID!): SessionStatus!
spendingAnalytics(filters: SpendingFiltersInput): [SpendingDataPoint!]!
agentAnalytics(filters: AgentActivityFiltersInput): [AgentActivity!]!
```

### Mutations (20)

```graphql
createWallet(input: CreateWalletInput!): Wallet!
deleteWallet(id: ID!): Boolean!
signMessage(walletId: ID!, message: String!): SignatureResult!
sendTransaction(walletId: ID!, to: String!, value: String, data: String): TransactionResult!
createAgent(walletId: ID!, input: CreateAgentInput!): AgentWithSessionKey!
revokeAgent(id: ID!): Agent!
deleteAgent(id: ID!): Boolean!
signUserOp(agentId: ID!, userOpHash: String!): SignatureResult!
createPolicy(input: CreatePolicyInput!): Policy!
updatePolicy(id: ID!, input: UpdatePolicyInput!): Policy!
deletePolicy(id: ID!): Boolean!
encodePolicy(id: ID!): String!
composePolicies(policyIds: [ID!]!): Policy!
recordPayment(input: RecordPaymentInput!): Payment!
checkBudget(walletId: ID!, amount: String!, domain: String): BudgetCheck!
encodeSwap(input: SwapInput!): EncodedCall!
encodeSupply(input: LendingInput!): EncodedCall!
encodeBorrow(input: LendingInput!): EncodedCall!
encodeRepay(input: LendingInput!): EncodedCall!
encodeApprove(input: ApproveInput!): ApproveCall!
```

### Custom Scalars

`JSON` — Accepts arbitrary JSON objects. The scalar resolver handles all GraphQL AST node types (ObjectValue, ListValue, StringValue, IntValue, FloatValue, BooleanValue, NullValue) via recursive literal parsing.

---

## WebSocket API

Mounted at `/ws` via `@hono/node-ws`.

### Connection

```
ws://localhost:3001/ws
```

### Server → Client Events

```json
{
  "type": "payment:recorded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": { "id": "...", "amount": "1000000", "domain": "api.example.com" }
}
```

Event types:
- `payment:recorded` — A payment was recorded
- `agent:created` — A new agent was provisioned
- `agent:revoked` — An agent was revoked
- `budget:warning` — Daily spend exceeded 80% of budget
- `budget:exceeded` — Daily spend exceeded budget limit

### Client → Server Messages

- `{ "type": "ping" }` → Server responds with `{ "type": "pong" }`

### Behavior

- On connection, the server subscribes the client to the event stream and sends recent events as catch-up
- Heartbeat ping/pong keeps the connection alive
- On disconnect, the client is automatically unsubscribed

---

## Composition Root

`src/app.ts` — `createApp(config)` is the single factory that wires everything:

```
Config
  → Stores (5)
    → Services (7, injected with stores + each other)
      → Event Emitter (wraps eventsStore)
      → Routes (7, injected with services)
      → GraphQL Handler (injected with services)
  → Hono App
    → CORS middleware
    → Error handler
    → Health routes (no auth)
    → Rate limiter
    → Auth middleware
    → Protected routes
    → GraphQL route
```

Returns `{ app, eventEmitter, eventsStore, config }` — the `app` for serving, the emitter and store for WebSocket setup.

---

## Type System

`src/types.ts` defines all request/response types. Key design decisions:

- All monetary values are `string` (not `bigint`) for JSON compatibility
- Addresses are `viem`'s `Address` type (checksummed `0x${string}`)
- Hashes are `viem`'s `Hex` type
- Timestamps in records are ISO strings (`createdAt`, `updatedAt`)
- Expiry timestamps are unix epoch numbers (`expiresAt`)
- Agent responses strip `sessionPrivateKey` via `Omit<AgentRecord, "sessionPrivateKey">`
