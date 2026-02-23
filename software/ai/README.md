# Sigloop — AI Agent Wallet Platform

Wallet abstraction for autonomous AI agents. ERC-4337 smart accounts, ERC-7579 modular permissions, and x402 payment automation.

## Architecture

```
┌──────────────┐     ┌─────────────┐     ┌───────────┐
│   Webapp     │     │  REST API   │     │   SDKs    │
│  :5173       │     │  :3002      │     │  TS + Go  │
└──────┬───────┘     └──────┬──────┘     └───────┬───┘
       │                    │                    │
       └────────────┬───────┘                    │
                    ▼                            │
             ┌─────────────┐                     │
             │  Backend    │◄────────────────────┘
             │  :3001      │
             └──────┬──────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
  ┌────────┐  ┌──────────┐  ┌────────┐
  │ Anvil  │  │ Contracts│  │ Stores │
  │ :8545  │  │ ERC-7579 │  │ In-Mem │
  └────────┘  └──────────┘  └────────┘
```

## Projects

| Project | Stack | Purpose |
|---------|-------|---------|
| **webapp** | React 19, Vite 7, TailwindCSS v4, shadcn/ui | Dashboard UI for managing wallets, agents, policies, payments |
| **backend** | Hono, Node.js, viem | REST API — 19 endpoints across wallets, agents, policies, payments, analytics |
| **rest** | Hono, Node.js | Flow orchestration API — 12 test flows for integration testing scenarios |
| **sdk-ts** | TypeScript, viem, permissionless | Client SDK with wallet, agent, policy, x402, chain, and DeFi modules |
| **sdk-go** | Go, go-ethereum | Client SDK mirroring the TS SDK for Go-based agents |

## Webapp

Six pages behind a dark-themed sidebar:

- **Dashboard** — Wallet/agent/policy counts, total x402 spend, recent payments table, recent agents list
- **Wallets** — Create and manage ERC-4337 smart wallets across chains (Ethereum, Base, Optimism, Arbitrum)
- **Agents** — Provision session-key agents, filter by status (active/revoked/expired), revoke access
- **Policies** — Build spending limits, contract/domain allowlists, and time windows; compose rules per agent
- **Payments** — x402 payment history with filtering (agent, wallet, domain, date range) and aggregate stats
- **Settings** — API URL, default chain selection, dark mode toggle

## Backend API

19 endpoints under `/api`:

| Resource | Endpoints | Operations |
|----------|-----------|------------|
| Wallets | 4 | Create, list, get, delete |
| Agents | 5 | Create (returns session key), list, get, revoke, delete |
| Policies | 5 | Create, list, get, update, delete |
| Payments | 3 | Record, list (filterable), stats |
| Analytics | 2 | Spending by period, agent activity |

Middleware: API key auth (`X-API-KEY`), token-bucket rate limiting (100 req burst, 10/sec refill), structured error handling.

## REST Flow API

12 orchestration flows for integration testing at `/api/flows`:

**Onboarding** — Single-call agent onboarding (wallet + policy + agent), multi-agent setup with per-agent policies.

**Payment** — x402 payment simulation across API domains, budget exhaustion testing with overage tracking.

**Lifecycle** — Full agent lifecycle (create → transact → revoke), policy hot-update mid-lifecycle, bulk cleanup.

**Scenarios** — DeFi trading bot (pair rotation, buy/sell), API marketplace consumer (x402 micropayments), multi-chain operations (Base + Arbitrum + local).

Each flow returns step-by-step execution traces with per-step status, timing, and data.

## SDKs

Both SDKs expose the same module surface:

| Module | Functionality |
|--------|--------------|
| **wallet** | Smart account creation (ZeroDev Kernel), passkey auth, social recovery |
| **agent** | Session key provisioning, revocation, expiry management |
| **policy** | Spending limits, allowlists, time windows, rate limits, AND/OR composition |
| **x402** | HTTP 402 middleware, EIP-3009 payment signing, budget tracking |
| **chain** | Multi-chain config (Base, Arbitrum), optimal chain routing, bridging |
| **defi** | Uniswap V3 swaps, Aave V3 lending/borrowing, staking |

## Smart Contracts

Four ERC-7579 modules deployed via Foundry:

| Contract | Type | Role |
|----------|------|------|
| AgentPermissionValidator | Validator | Validates agent session key signatures against on-chain policies |
| SpendingLimitHook | Hook | Enforces daily/weekly spending caps with auto-reset |
| X402PaymentPolicy | Hook | x402 budget tracking with domain allowlists |
| DeFiExecutor | Executor | Dispatches swap, lend, borrow, repay, and stake actions |

## Testing

| Suite | Tests | Framework |
|-------|-------|-----------|
| sdk-ts unit | 315 | vitest |
| sdk-go unit | 200+ | go test |
| backend unit | 201 | vitest |
| webapp unit | 237 | Jest + RTL |
| rest unit | 112 | vitest |
| contracts | 27 | Forge |
| integration-ts | 37 | vitest |
| integration-go | 14 | go test |
| **Total** | **~1,143+** | |

## Quick Start

```bash
docker compose up
```

| Service | URL |
|---------|-----|
| Webapp | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| REST Flows | http://localhost:3002 |
| Anvil RPC | http://localhost:8545 |

## Project Structure

```
software/ai/
├── webapp/          # React dashboard (65 source files)
├── backend/         # Hono API (28 source files)
├── rest/            # Flow orchestration API (16 source files)
├── sdk-ts/          # TypeScript SDK (39 source files)
├── sdk-go/          # Go SDK (27 source files)
└── docker-compose.yml
```
