# Testing Infrastructure

Testing spans four layers: Solidity unit tests (Foundry), TypeScript library unit tests (Vitest), backend unit + integration tests (Vitest), and on-chain integration tests (TypeScript + Go against Anvil).

---

## Test Summary

| Suite                    | Location                       | Framework     | Tests  |
|--------------------------|--------------------------------|---------------|--------|
| Smart Contracts          | testing/ai/contracts           | Forge         | 27     |
| @sigloop/wallet          | software/lib/wallet            | Vitest        | ~20    |
| @sigloop/agent           | software/lib/agent             | Vitest        | 30     |
| @sigloop/policy          | software/lib/policy            | Vitest        | 52     |
| @sigloop/x402            | software/lib/x402              | Vitest        | 37     |
| @sigloop/defi            | software/lib/defi              | Vitest        | 26     |
| Backend (unit + integ)   | software/backend               | Vitest        | 159    |
| Dashboard                | software/ai/webapp             | Jest          | ~26    |
| Integration (TypeScript) | testing/ai/integration-ts      | Vitest        | 37     |
| Integration (Go)         | testing/ai/integration-go      | go test       | 14     |

---

## Smart Contract Tests

**Location:** `testing/ai/contracts/test/`
**Framework:** Foundry Forge
**Run:** `forge test`

### Test Files

| File                             | Module                     | Tests | Coverage                                   |
|----------------------------------|----------------------------|-------|--------------------------------------------|
| `AgentPermissionValidator.t.sol` | AgentPermissionValidator   | 7     | Install, uninstall, validate, target/selector/amount/time checks |
| `SpendingLimitHook.t.sol`        | SpendingLimitHook          | 7     | Install, daily/weekly limits, period resets, overspend revert |
| `X402PaymentPolicy.t.sol`        | X402PaymentPolicy          | 7     | Install, per-request cap, daily budget, total budget, domain allowlist |
| `DeFiExecutor.t.sol`             | DeFiExecutor               | 6     | Install, swap/supply/borrow/repay dispatch, unauthorized target revert |

### Test Pattern

```solidity
function testValidateUserOp_RejectsUnauthorizedTarget() public {
    // Setup: install policy with allowedTargets = [targetA]
    // Act: submit UserOp calling targetB
    // Assert: validation returns SIG_VALIDATION_FAILED
}
```

Tests run against Forge's built-in EVM with cheatcodes (`vm.prank`, `vm.warp`, `vm.expectRevert`).

---

## Library Tests

Each library under `software/lib/` has co-located tests.

**Framework:** Vitest
**Run:** `pnpm test` from each library directory

### @sigloop/policy (52 tests)

- Policy creation (agent, x402, spending)
- ABI encoding and decoding round-trips
- Validation (missing fields, invalid values, time windows)
- Composition (AND/OR of multiple policies)
- Edge cases (empty allowlists, zero limits, expired policies)

### @sigloop/x402 (37 tests)

- Budget tracker creation and configuration
- Daily spend recording and remaining calculation
- Daily auto-reset when period expires
- Budget check (allowed vs exceeded)
- X402 client and fetch middleware
- Payment signing (EIP-3009)
- Nonce generation

### @sigloop/agent (30 tests)

- Agent creation with session key
- Session key expiry validation
- UserOperation signing
- Revocation encoding
- Policy retrieval
- Agent loading from stored state

### @sigloop/defi (26 tests)

- Swap encoding (Uniswap V3 exactInputSingle)
- Supply, borrow, repay encoding (Aave V3)
- Chain-specific router/pool resolution
- Approve calldata building
- Edge cases (zero amounts, missing params)

---

## Backend Tests

**Location:** `software/backend/tests/`
**Framework:** Vitest with `globals: true`
**Run:** `pnpm test` from `software/backend/`

159 tests across 23 files (14 unit, 9 integration).

### Unit Tests

Test individual stores, services, and middleware in isolation.

#### Store Tests (29 tests)

| File                       | Tests | Coverage                                            |
|----------------------------|-------|-----------------------------------------------------|
| `unit/stores/wallets.test.ts`  | 8 | CRUD, list, clear, not-found errors                |
| `unit/stores/agents.test.ts`   | 7 | CRUD, listByWallet, deleteByWallet                 |
| `unit/stores/policies.test.ts` | 6 | CRUD, listByType, update                           |
| `unit/stores/payments.test.ts` | 8 | Append, filter by agent/wallet/domain/date, aggregate |

#### Service Tests (64 tests)

| File                          | Tests | Coverage                                           |
|-------------------------------|-------|----------------------------------------------------|
| `unit/services/keys.test.ts`     | 5  | Generate, encrypt/decrypt round-trip, uniqueness   |
| `unit/services/wallet.test.ts`   | 10 | Create, get, list, delete, signMessage, sendTransaction |
| `unit/services/agent.test.ts`    | 13 | Create, get, list, revoke, delete, signUserOp, getPolicy, getSession, expiry handling |
| `unit/services/policy.test.ts`   | 14 | Create all 3 types, get, list, update, delete, encode, compose |
| `unit/services/payment.test.ts`  | 8  | Record, list, stats, budget, checkBudget, event emission |
| `unit/services/defi.test.ts`     | 7  | Swap, supply, borrow, repay, approve encoding     |
| `unit/services/analytics.test.ts`| 7  | Spending aggregation (hourly/daily/weekly/monthly), agent activity ranking |

Services are tested with real store instances but mock external dependencies.

#### Middleware Tests (12 tests)

| File                              | Tests | Coverage                                        |
|-----------------------------------|-------|-------------------------------------------------|
| `unit/middleware/auth.test.ts`        | 3 | Missing key → 401, wrong key → 403, valid → pass |
| `unit/middleware/rate-limit.test.ts`  | 3 | Under limit → pass, exceed → 429, refill recovery |
| `unit/middleware/error-handler.test.ts`| 6 | Not-found → 404, validation → 400, conflict → 409, unknown → 500 |

### Integration Tests

Test full HTTP request → response through the Hono app using `app.request()`.

| File                               | Tests | Coverage                                       |
|------------------------------------|-------|------------------------------------------------|
| `integration/health.test.ts`          | 1  | GET /api/health → 200 with status/version      |
| `integration/wallets.test.ts`         | 8  | Full CRUD, sign message, 404 on missing, auth required |
| `integration/agents.test.ts`          | 8  | Create under wallet, list, revoke, delete, sign-user-op, session, policy |
| `integration/policies.test.ts`        | 9  | Create all 3 types, update, delete, encode, compose |
| `integration/payments.test.ts`        | 6  | Record, list with filters, stats, budget state, check budget |
| `integration/defi.test.ts`            | 5  | Swap, supply, borrow, repay, approve encoding  |
| `integration/analytics.test.ts`       | 2  | Spending by period, agent activity ranking      |
| `integration/graphql.test.ts`         | 10 | Queries (wallet, wallets, agents, policies, payments) + Mutations (createWallet, createPolicy, createAgent, revokeAgent, deleteWallet) |
| `integration/websocket.test.ts`       | 5  | Connect, receive events, ping/pong, catchup, disconnect cleanup |

### Integration Test Pattern

```typescript
test("creates wallet", async () => {
  const { app } = createTestApp()
  const res = await app.request("/api/wallets", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": "test-key" },
    body: JSON.stringify({ name: "test-wallet" }),
  })
  expect(res.status).toBe(201)
  const data = await res.json()
  expect(data.name).toBe("test-wallet")
  expect(data.address).toMatch(/^0x/)
})
```

---

## On-Chain Integration Tests (TypeScript)

**Location:** `testing/ai/integration-ts/`
**Framework:** Vitest
**Requires:** Running Anvil instance with deployed contracts

37 tests across 5 suites that test library code against actual smart contracts on Anvil.

### Test Suites

| File                          | Tests | What it tests                                    |
|-------------------------------|-------|--------------------------------------------------|
| `agent-permission.test.ts`    | ~8    | Agent creation → policy installation → UserOp validation → signature verification |
| `spending-limit.test.ts`      | ~8    | Daily/weekly limit enforcement → period reset → overspend revert |
| `x402-payment.test.ts`        | ~7    | Budget tracking → domain allowlist → payment recording → budget exhaustion |
| `defi-executor.test.ts`       | ~7    | Swap/supply/borrow/repay encoding → executor dispatch → state verification |
| `full-flow.test.ts`           | ~7    | End-to-end: wallet creation → agent provisioning → policy → payment → revocation |

### Supporting Infrastructure

- `src/helpers/accounts.ts` — Test account generation from Anvil's pre-funded accounts
- `src/helpers/anvil.ts` — Anvil RPC client setup (viem publicClient + walletClient)
- `src/helpers/x402.ts` — X402 test utilities
- `src/config.ts` — Anvil URL (localhost:8545), chain ID (31337)
- `src/deploy.ts` — Deploy all 4 contracts to Anvil before tests
- `src/x402/mock-server.ts` — Mock HTTP server returning 402 Payment Required for x402 tests

### ABI Files

TypeScript ABI constants for each contract, used by viem's type-safe contract interactions:
- `AgentPermissionValidator.ts`
- `SpendingLimitHook.ts`
- `X402PaymentPolicy.ts`
- `DeFiExecutor.ts`

---

## On-Chain Integration Tests (Go)

**Location:** `testing/ai/integration-go/`
**Framework:** `go test`
**Requires:** Running Anvil instance with deployed contracts

14 tests across 5 suites. Feature parity with the TypeScript integration tests.

### Test Suites

| File                          | Tests | What it tests                                    |
|-------------------------------|-------|--------------------------------------------------|
| `agent_permission_test.go`    | ~3    | Agent creation, permission validation, signature checks |
| `spending_limit_test.go`      | ~3    | Spending limit enforcement and period resets      |
| `x402_payment_test.go`        | ~3    | X402 budget tracking and domain allowlists        |
| `defi_executor_test.go`       | ~3    | DeFi action dispatch and state verification       |
| `full_flow_test.go`           | ~2    | End-to-end wallet → agent → payment flows         |

### Supporting Infrastructure

- `helpers/accounts.go` — Test account setup from Anvil keys
- `helpers/client.go` — go-ethereum client initialization
- `helpers/tx.go` — Transaction building and submission helpers
- `config/config.go` — Anvil URL and chain configuration
- `deploy/deploy.go` + `deploy/bytecodes.go` — Contract deployment
- `x402/server.go` — Mock x402 server (net/http)
- `abis/` — Go ABI bindings for all 4 contracts

---

## Flow Orchestration Tests

**Location:** `software/ai/rest/`
**Framework:** Hono service with 12 scripted test flows

Not a traditional test suite — this is a Hono service that runs multi-step integration scenarios against the backend API and reports step-by-step results.

### Flows

| Category    | Flow                          | What it tests                                |
|-------------|-------------------------------|----------------------------------------------|
| Onboarding  | Single-call agent onboarding  | Wallet + policy + agent in one flow          |
| Onboarding  | Multi-agent setup             | Multiple agents with per-agent policies      |
| Payment     | X402 payment simulation       | Micropayments across multiple API domains    |
| Payment     | Budget exhaustion             | Spend to budget limit, verify rejection      |
| Lifecycle   | Full agent lifecycle          | Create → transact → revoke                   |
| Lifecycle   | Policy hot-update             | Change policy mid-lifecycle                  |
| Lifecycle   | Bulk cleanup                  | Mass deletion of agents and wallets          |
| Scenario    | DeFi trading bot              | Pair rotation, buy/sell encoding             |
| Scenario    | API marketplace consumer      | X402 micropayments to multiple APIs          |
| Scenario    | Multi-chain operations        | Operations across Base + Arbitrum + local    |

Each flow returns a step-by-step trace with timing and status per step.

---

## Running Tests

### All library tests
```bash
cd software/lib/policy && pnpm test
cd software/lib/x402 && pnpm test
cd software/lib/agent && pnpm test
cd software/lib/defi && pnpm test
```

### Backend tests
```bash
cd software/backend && pnpm test
```

### Smart contract tests
```bash
cd testing/ai/contracts && forge test
```

### On-chain integration tests (requires Anvil)
```bash
# Start Anvil
anvil --accounts 10 --balance 10000

# Deploy contracts (separate terminal)
cd testing/ai/contracts && forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545

# Run TypeScript integration tests
cd testing/ai/integration-ts && pnpm test

# Run Go integration tests
cd testing/ai/integration-go && go test ./tests/...
```

### Dashboard tests
```bash
cd software/ai/webapp && pnpm test
```
