# Getting Started

[<< Back to README](README.md) | [Test Suites >>](test-suites.md)

This guide walks through setting up the environment, compiling dependencies, and running the Sigloop Go integration tests.

---

## 1. Install Prerequisites

### Go

The module requires Go 1.25.6 or later. Verify your installation:

```bash
go version
# go version go1.25.6 darwin/arm64
```

### Foundry (Anvil)

Install Foundry to get `anvil`, the local Ethereum node:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify:

```bash
anvil --version
```

## 2. Start Anvil

Anvil must be running before tests execute. Start it with default settings:

```bash
anvil
```

This launches a local Ethereum node at `http://127.0.0.1:8545` with chain ID `31337` and ten prefunded accounts. The tests rely on these exact defaults -- see [Configuration](configuration.md) for the full list of account keys.

Default Anvil output shows the prefunded accounts and their private keys. The test suite uses the same keys defined in `config/config.go`.

## 3. Install Go Dependencies

From the integration test root directory:

```bash
cd testing/ai/integration-go
go mod tidy
```

This resolves and downloads all dependencies declared in `go.mod`, primarily:

- `github.com/ethereum/go-ethereum v1.17.0` -- Ethereum client library, ABI encoding, crypto utilities

## 4. Compile Contracts (Already Done)

The Solidity contract bytecodes are pre-compiled and embedded as hex string constants in `deploy/bytecodes.go`. No Solidity compilation step is required to run the tests. The four bytecodes are:

| Constant | Contract |
|----------|----------|
| `ValidatorBytecode` | AgentPermissionValidator |
| `HookBytecode` | SpendingLimitHook |
| `X402PolicyBytecode` | X402PaymentPolicy |
| `ExecutorBytecode` | DeFiExecutor |

If you modify the Solidity source, recompile with `solc` or `forge build` and update the bytecode constants accordingly.

## 5. Run All Tests

```bash
go test ./tests/ -v
```

Expected output (abbreviated):

```
=== RUN   TestAddAgentAndGetPolicy
--- PASS: TestAddAgentAndGetPolicy (0.01s)
=== RUN   TestRemoveAgent
--- PASS: TestRemoveAgent (0.01s)
=== RUN   TestIsModuleTypeValidator
--- PASS: TestIsModuleTypeValidator (0.01s)
=== RUN   TestSetLimitsAndPreCheck
--- PASS: TestSetLimitsAndPreCheck (0.01s)
=== RUN   TestResetSpending
--- PASS: TestResetSpending (0.01s)
=== RUN   TestIsModuleTypeHook
--- PASS: TestIsModuleTypeHook (0.01s)
=== RUN   TestConfigureAndGetBudget
--- PASS: TestConfigureAndGetBudget (0.01s)
=== RUN   TestPreCheckRecordsSpending
--- PASS: TestPreCheckRecordsSpending (0.01s)
=== RUN   TestX402MockServerPaymentFlow
--- PASS: TestX402MockServerPaymentFlow (0.01s)
=== RUN   TestX402ServerReturns402WithoutPayment
--- PASS: TestX402ServerReturns402WithoutPayment (0.01s)
=== RUN   TestEncodeSwap
--- PASS: TestEncodeSwap (0.01s)
=== RUN   TestEncodeLending
--- PASS: TestEncodeLending (0.01s)
=== RUN   TestIsModuleTypeExecutor
--- PASS: TestIsModuleTypeExecutor (0.01s)
=== RUN   TestOnInstallOnUninstall
--- PASS: TestOnInstallOnUninstall (0.01s)
=== RUN   TestFullFlow
--- PASS: TestFullFlow (0.02s)
=== RUN   TestFullFlowBudgetExhaustion
--- PASS: TestFullFlowBudgetExhaustion (0.01s)
PASS
ok      github.com/sigloop/integration-go/tests
```

## 6. Run a Single Test

```bash
go test ./tests/ -v -run TestFullFlow
```

## 7. Run Tests for a Specific Module

Use Go's `-run` regex to target groups of tests:

```bash
# Agent permission tests only
go test ./tests/ -v -run "TestAddAgent|TestRemoveAgent|TestIsModuleTypeValidator"

# Spending limit tests only
go test ./tests/ -v -run "TestSetLimits|TestResetSpending|TestIsModuleTypeHook"

# x402 payment tests only
go test ./tests/ -v -run "TestConfigure|TestPreCheck|TestX402"

# DeFi executor tests only
go test ./tests/ -v -run "TestEncode|TestIsModuleTypeExecutor|TestOnInstall"

# Full flow tests only
go test ./tests/ -v -run "TestFullFlow"
```

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `dial tcp 127.0.0.1:8545: connection refused` | Start Anvil: `anvil` |
| `nonce too low` | Restart Anvil to reset state: Ctrl+C then `anvil` |
| `go: module not found` | Run `go mod tidy` in the project root |
| `gas estimation failed` | Verify the bytecodes in `deploy/bytecodes.go` are valid compiled output |

---

[<< Back to README](README.md) | [Test Suites >>](test-suites.md)
