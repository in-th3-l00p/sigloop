# Sigloop Go Integration Tests

Comprehensive integration test suite for the Sigloop smart contract modules, written in Go and executed against a local Anvil (Foundry) Ethereum node.

## What These Tests Cover

The Sigloop integration tests verify the on-chain behavior of four core ERC-7579 smart account modules and an off-chain x402 payment protocol mock:

| Module | Type | Purpose |
|--------|------|---------|
| **AgentPermissionValidator** | Validator (type 1) | Manages per-agent permission policies including allowed targets, selectors, spending limits, and time bounds |
| **SpendingLimitHook** | Hook (type 4) | Enforces daily and weekly spending caps per agent/token pair with automatic period resets |
| **X402PaymentPolicy** | Hook (type 4) | Controls agent budgets for HTTP 402 micro-payments with per-request, daily, and total budget limits |
| **DeFiExecutor** | Executor (type 2) | Encodes and executes DeFi operations (swaps, lending supply/withdraw) on behalf of a smart account |

Additionally, a **mock x402 server and client transport** simulate the full HTTP 402 payment negotiation flow.

## Repository Structure

```
integration-go/
├── abis/                  # ABI JSON definitions for each contract
│   ├── validator.go
│   ├── hook.go
│   ├── x402policy.go
│   └── executor.go
├── config/                # Anvil RPC settings and prefunded account keys
│   └── config.go
├── deploy/                # Contract bytecodes and bulk deployment logic
│   ├── bytecodes.go
│   └── deploy.go
├── helpers/               # Ethereum client, account, and transaction utilities
│   ├── client.go
│   ├── accounts.go
│   └── tx.go
├── x402/                  # Mock x402 HTTP server and auto-paying client
│   ├── types.go
│   ├── server.go
│   └── client.go
├── tests/                 # All test files
│   ├── agent_permission_test.go
│   ├── spending_limit_test.go
│   ├── x402_payment_test.go
│   ├── defi_executor_test.go
│   └── full_flow_test.go
├── go.mod
└── go.sum
```

## Prerequisites

- **Go** 1.25.6 or later
- **Foundry** (Anvil) -- local Ethereum development node
- **go-ethereum** v1.17.0 (dependency managed via `go.mod`)

## Test Summary

| Test File | Tests | Description |
|-----------|-------|-------------|
| `agent_permission_test.go` | 3 | Add/remove agents, query policies, module type checks |
| `spending_limit_test.go` | 3 | Set limits, preCheck spending tracking, reset spending, module type |
| `x402_payment_test.go` | 4 | Configure budgets, preCheck budget recording, mock server payment flow, 402 without payment |
| `defi_executor_test.go` | 4 | Encode swap, encode lending, module type, install/uninstall lifecycle |
| `full_flow_test.go` | 2 | End-to-end multi-module integration, budget exhaustion scenario |

**Total: 16 test functions**

## Table of Contents

1. [Getting Started](getting-started.md) -- environment setup, compilation, running tests
2. [Test Suites](test-suites.md) -- detailed documentation of every test function
3. [Deployment](deployment.md) -- the `deploy` package and `DeployAll` workflow
4. [ABIs](abis.md) -- contract ABI definitions and their structure
5. [Helpers](helpers.md) -- client, account, and transaction utilities
6. [x402 Mock System](x402-mock.md) -- mock server, auto-paying transport, types
7. [Configuration](configuration.md) -- Anvil settings and account keys

## Quick Start

```bash
# Start Anvil
anvil

# In another terminal
cd testing/ai/integration-go
go mod tidy
go test ./tests/ -v
```

See [Getting Started](getting-started.md) for the full walkthrough.
