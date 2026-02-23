# Sigloop Backend API Documentation

> **Version:** 0.1.0
> **Framework:** [Hono](https://hono.dev/) on Node.js
> **Runtime:** tsx (TypeScript execution)
> **Base URL:** `http://localhost:3001/api`

---

## Architecture Overview

```
                          +---------------------------+
                          |       HTTP Client         |
                          +---------------------------+
                                     |
                                     v
                          +---------------------------+
                          |        Hono App           |
                          |    (CORS enabled)         |
                          +---------------------------+
                                     |
                                     v
                          +---------------------------+
                          |     /api  Router          |
                          +---------------------------+
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
   +----------------+     +------------------+     +------------------+
   | /api/health    |     | Rate Limiter     |     |                  |
   | (no auth)      |     | (token bucket)   |     |                  |
   +----------------+     +------------------+     |                  |
                                     |              |                  |
                                     v              |                  |
                          +------------------+      |                  |
                          | Auth Middleware  |      |                  |
                          | (X-API-KEY)     |      |                  |
                          +------------------+      |                  |
                                     |              |                  |
            +----------+----------+--+--+----------+----------+
            |          |          |     |          |          |
            v          v          v     v          v          v
       /wallets   /agents   /policies  /payments  /analytics
            |          |          |     |          |
            v          v          v     v          v
   +------------------------------------------------------------+
   |                    Service Layer                            |
   |  WalletService | AgentService | PolicyService |            |
   |  PaymentService | AnalyticsService | KeyManagerService     |
   +------------------------------------------------------------+
                                     |
                                     v
   +------------------------------------------------------------+
   |                  In-Memory Store Layer                      |
   |  walletsStore | agentsStore | policiesStore | paymentsStore |
   |                    (Map-based)                              |
   +------------------------------------------------------------+
```

---

## Table of Contents

### Getting Started

- [Getting Started](./getting-started.md) -- Installation, environment variables, running, Docker

### API Reference

- [Wallets API](./api-wallets.md) -- Create, list, get, and delete wallets
- [Agents API](./api-agents.md) -- Create, list, get, delete, and revoke agents
- [Policies API](./api-policies.md) -- Create, list, get, update, and delete policies
- [Payments API](./api-payments.md) -- Record payments, list with filters, get stats
- [Analytics API](./api-analytics.md) -- Spending analytics, agent activity

### Internals

- [Middleware](./middleware.md) -- Authentication, rate limiting, error handling
- [Services](./services.md) -- Business logic layer (all service classes and methods)
- [Types](./types.md) -- All TypeScript interfaces and enums
- [Store](./store.md) -- In-memory data store architecture

---

## Key Concepts

| Concept     | Description                                                                 |
|-------------|-----------------------------------------------------------------------------|
| **Wallet**  | An Ethereum wallet with a generated private key and on-chain address.       |
| **Agent**   | A scoped session key bound to a wallet, with optional policy constraints.   |
| **Policy**  | A set of rules (spending limits, allowlists, time windows) applied to agents.|
| **Payment** | A recorded transaction made by an agent from a wallet to a domain.          |

---

## Authentication

All endpoints (except `/api/health`) require the `X-API-KEY` header. See [Middleware](./middleware.md) for details.

```bash
curl -H "X-API-KEY: sigloop-dev-key" http://localhost:3001/api/wallets
```

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start in development mode (hot reload)
pnpm dev

# 3. Verify the server is running
curl http://localhost:3001/api/health
# => {"status":"ok","timestamp":"...","version":"0.1.0"}
```

See [Getting Started](./getting-started.md) for full setup instructions.
