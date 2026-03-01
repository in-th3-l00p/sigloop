# Sigloop — System Architecture

Sigloop is a wallet abstraction platform for AI agents. It combines ERC-4337 smart accounts (ZeroDev Kernel), ERC-7579 modular modules, and x402 payment automation into a unified system that lets autonomous agents operate on-chain within policy-enforced boundaries.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│   webapp (React 19)   │   sdk-ts   │   sdk-go   │   REST CLI    │
└──────────┬────────────┴─────┬──────┴─────┬──────┴───────┬───────┘
           │                  │            │              │
           ▼                  ▼            ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Service (Hono)                         │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐                │
│  │ REST API │  │ GraphQL  │  │    WebSocket     │                │
│  │ /api/*   │  │ /graphql │  │  ws://*/ws       │                │
│  └────┬─────┘  └────┬─────┘  └───────┬─────────┘                │
│       │              │                │                           │
│  ┌────▼──────────────▼────────────────▼───────────────────┐      │
│  │                 Middleware Stack                         │      │
│  │  CORS → Error Handler → Rate Limiter → Auth (API Key)  │      │
│  └────────────────────────┬────────────────────────────────┘      │
│                           │                                       │
│  ┌────────────────────────▼────────────────────────────────┐      │
│  │                    Services Layer                        │      │
│  │  Keys │ Wallet │ Agent │ Policy │ Payment │ DeFi │ Anal │      │
│  └───┬───┴───┬────┴───┬───┴───┬────┴───┬─────┴──┬───┴──┬──┘      │
│      │       │        │       │        │        │      │          │
│  ┌───▼───────▼────────▼───────▼────────▼────────▼──────▼───┐      │
│  │                   In-Memory Stores                       │      │
│  │  Wallets │ Agents │ Policies │ Payments │ Events         │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
           │        │          │           │
           ▼        ▼          ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core Libraries (@sigloop/*)                    │
│  wallet │ agent │ policy │ x402 │ defi │ wallet-server           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                               │
│                                                                   │
│  ┌──────────────┐  ┌───────────────────────────────────────┐     │
│  │  ERC-4337    │  │       ERC-7579 Modules (on-chain)     │     │
│  │  Bundler +   │  │  AgentPermissionValidator (Validator)  │     │
│  │  Paymaster   │  │  SpendingLimitHook (Hook)              │     │
│  │  (ZeroDev)   │  │  X402PaymentPolicy (Hook)              │     │
│  │              │  │  DeFiExecutor (Executor)                │     │
│  └──────────────┘  └───────────────────────────────────────┘     │
│                                                                   │
│  Chains: Base (8453) │ Ethereum (1) │ Arbitrum (42161)           │
│          Optimism (10) │ Anvil Local (31337)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Inventory

| Component               | Location                      | Language   | Files (src/test) |
|--------------------------|-------------------------------|------------|------------------|
| @sigloop/wallet          | software/lib/wallet           | TypeScript | 13 / 10          |
| @sigloop/agent           | software/lib/agent            | TypeScript | 8 / 5            |
| @sigloop/policy          | software/lib/policy           | TypeScript | 8 / 5            |
| @sigloop/x402            | software/lib/x402             | TypeScript | 8 / 5            |
| @sigloop/defi            | software/lib/defi             | TypeScript | 9 / 6            |
| @sigloop/wallet-server   | software/lib/wallet-server    | TypeScript | 9 / 4            |
| Production Backend       | software/backend              | TypeScript | 28 / 23          |
| SDK (TypeScript)         | software/ai/sdk-ts            | TypeScript | 39 / 22          |
| SDK (Go)                 | software/ai/sdk-go            | Go         | 27 / 20          |
| AI Backend (prototype)   | software/ai/backend           | TypeScript | 28 / 16          |
| Dashboard                | software/ai/webapp            | React/TS   | 63 / 26          |
| Flow Orchestration       | software/ai/rest              | TypeScript | 16 / —           |
| Landing Page             | software/landing              | Astro      | 8 / —            |
| Smart Contracts          | testing/ai/contracts          | Solidity   | 8 / 4            |
| Integration Tests (TS)   | testing/ai/integration-ts     | TypeScript | 17 / —           |
| Integration Tests (Go)   | testing/ai/integration-go     | Go         | 18 / —           |

**Totals: ~324 source files, ~141 test files**

## Design Principles

**Closure-based factories over classes.** Every module — stores, services, middleware, routes — is a plain function returning an object of methods. This avoids `this` binding issues, simplifies testing with dependency injection, and keeps the codebase uniform.

**String ↔ bigint boundary conversion.** Libraries use `bigint` for on-chain values. The backend converts to/from strings at the service boundary so REST, GraphQL, and WebSocket payloads remain JSON-serializable.

**Maximum modularity.** Each feature is its own library package. Libraries depend only on `viem` and each other where strictly necessary. The backend imports all six libraries through `file:` dependencies.

**Three API surfaces for the same data.** REST for standard CRUD, GraphQL for flexible queries, WebSocket for real-time event streaming — all powered by the same services layer.

## Data Flow: Agent Payment

1. **Client** sends `POST /api/payments` with `{ agentId, walletId, domain, amount }`
2. **Auth middleware** validates `X-API-KEY` header
3. **Rate limiter** checks token bucket for the client IP
4. **Payment route** parses the body and calls `paymentService.record()`
5. **Payment service** validates the agent and wallet exist, creates a `PaymentRecord`, appends it to `paymentsStore`, updates the budget tracker, and emits `payment:recorded` (plus `budget:warning` or `budget:exceeded` if thresholds are hit)
6. **Event emitter** broadcasts the event to all connected WebSocket clients
7. **Response** returns the created payment record as JSON

## Standards

- **ERC-4337**: Account abstraction — smart accounts with UserOperations, bundlers, and paymasters
- **ERC-7579**: Modular smart account architecture — validator, hook, and executor module types
- **EIP-3009**: TransferWithAuthorization — gasless token transfers via signatures
- **x402**: HTTP 402 Payment Required — payment middleware for API monetization
