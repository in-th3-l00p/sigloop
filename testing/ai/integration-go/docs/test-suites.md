# Test Suites

[<< Back to README](README.md) | [Getting Started](getting-started.md) | [Deployment >>](deployment.md)

Detailed documentation of every test function across all five test files. Each entry includes the function name, what it verifies, the execution flow, and key assertions.

---

## Table of Contents

- [agent_permission_test.go](#agent_permission_testgo)
  - [deployValidator (helper)](#deployvalidator-helper)
  - [TestAddAgentAndGetPolicy](#testaddagentandgetpolicy)
  - [TestRemoveAgent](#testremoveagent)
  - [TestIsModuleTypeValidator](#testismoduletypevalidator)
- [spending_limit_test.go](#spending_limit_testgo)
  - [deployHook (helper)](#deployhook-helper)
  - [TestSetLimitsAndPreCheck](#testsetlimitsandprecheck)
  - [TestResetSpending](#testresetspending)
  - [TestIsModuleTypeHook](#testismoduletypehook)
  - [mustType (utility)](#musttype-utility)
- [x402_payment_test.go](#x402_payment_testgo)
  - [deployX402 (helper)](#deployx402-helper)
  - [TestConfigureAndGetBudget](#testconfigureandgetbudget)
  - [TestPreCheckRecordsSpending](#testprecheckrecordsspending)
  - [TestX402MockServerPaymentFlow](#testx402mockserverpaymentflow)
  - [TestX402ServerReturns402WithoutPayment](#testx402serverreturns402withoutpayment)
- [defi_executor_test.go](#defi_executor_testgo)
  - [deployExecutor (helper)](#deployexecutor-helper)
  - [TestEncodeSwap](#testencodeswap)
  - [TestEncodeLending](#testencodelending)
  - [TestIsModuleTypeExecutor](#testismoduletypeexecutor)
  - [TestOnInstallOnUninstall](#testoninstallonuninstall)
- [full_flow_test.go](#full_flow_testgo)
  - [TestFullFlow](#testfullflow)
  - [TestFullFlowBudgetExhaustion](#testfullflowbudgetexhaustion)

---

## agent_permission_test.go

**File:** `tests/agent_permission_test.go`

Tests the `AgentPermissionValidator` contract -- the ERC-7579 validator module (type 1) that manages per-agent permission policies on smart accounts.

### deployValidator (helper)

```go
func deployValidator(t *testing.T) (common.Address, abi.ABI, helpers.Account)
```

Test helper (marked with `t.Helper()`) that deploys a fresh `AgentPermissionValidator` contract. Returns the deployed contract address, its parsed ABI, and the deployer account (Anvil account index 0).

**Flow:**
1. Connect to Anvil via `helpers.NewAnvilClient()`
2. Load deployer account (index 0) via `helpers.GetAccount(0)`
3. Parse `AgentPermissionValidatorABI` JSON string
4. Decode `ValidatorBytecode` hex string
5. Deploy via `helpers.DeployContract()`
6. Return contract address, ABI, and deployer account

---

### TestAddAgentAndGetPolicy

```go
func TestAddAgentAndGetPolicy(t *testing.T)
```

**What it tests:** Adding an agent with a full permission policy and reading it back correctly.

**Flow:**
1. **Deploy** -- Calls `deployValidator()` to deploy a fresh contract
2. **Configure** -- Creates an agent (account index 1) with a policy:
   - `allowedTargets`: `[0x1111...1111]`
   - `allowedSelectors`: `[0xa9059cbb]` (ERC-20 `transfer` selector)
   - `maxAmountPerTx`: 1,000,000
   - `dailyLimit`: 5,000,000
   - `weeklyLimit`: 20,000,000
   - `validAfter`: 0 (no start bound)
   - `validUntil`: 0 (no end bound)
   - `active`: true
3. **Act** -- Calls `addAgent(agent, policy)` via `helpers.SendTx()`
4. **Assert** -- Calls `getPolicy(owner, agent)` via `client.CallContract()` and verifies:
   - `policy.Active == true`
   - `policy.MaxAmountPerTx == 1,000,000`
   - `len(policy.AllowedTargets) == 1`

**Key code:**

```go
input, err := parsedABI.Pack("addAgent", agent.Address, struct {
    AllowedTargets   []common.Address
    AllowedSelectors [][4]byte
    MaxAmountPerTx   *big.Int
    DailyLimit       *big.Int
    WeeklyLimit      *big.Int
    ValidAfter       *big.Int
    ValidUntil       *big.Int
    Active           bool
}{
    AllowedTargets:   allowedTargets,
    AllowedSelectors: allowedSelectors,
    MaxAmountPerTx:   big.NewInt(1000000),
    DailyLimit:       big.NewInt(5000000),
    WeeklyLimit:      big.NewInt(20000000),
    ValidAfter:       big.NewInt(0),
    ValidUntil:       big.NewInt(0),
    Active:           true,
})
```

---

### TestRemoveAgent

```go
func TestRemoveAgent(t *testing.T)
```

**What it tests:** Adding an agent and then removing it, verifying the policy is fully cleared.

**Flow:**
1. **Deploy** -- `deployValidator()`
2. **Configure** -- Add agent (account index 2) with a policy (`maxAmountPerTx`: 500,000, `active`: true)
3. **Act** -- Call `removeAgent(agent)` to revoke permissions
4. **Assert** -- Read policy via `getPolicy()` and verify:
   - `policy.Active == false`
   - `policy.MaxAmountPerTx == 0`

---

### TestIsModuleTypeValidator

```go
func TestIsModuleTypeValidator(t *testing.T)
```

**What it tests:** The `isModuleType` function correctly identifies the contract as a validator (type 1) and rejects other types.

**Flow:**
1. **Deploy** -- `deployValidator()`
2. **Assert (positive)** -- Call `isModuleType(1)` and verify it returns `true`
3. **Assert (negative)** -- Call `isModuleType(2)` and verify it returns `false`

---

## spending_limit_test.go

**File:** `tests/spending_limit_test.go`

Tests the `SpendingLimitHook` contract -- the ERC-7579 hook module (type 4) that enforces daily and weekly spending limits per agent/token pair.

### deployHook (helper)

```go
func deployHook(t *testing.T) (common.Address, abi.ABI, helpers.Account)
```

Identical pattern to `deployValidator` but deploys the `SpendingLimitHook` contract using `SpendingLimitHookABI` and `HookBytecode`.

---

### TestSetLimitsAndPreCheck

```go
func TestSetLimitsAndPreCheck(t *testing.T)
```

**What it tests:** Setting spending limits for an agent/token pair, then running a `preCheck` that records spending, and verifying the tracked amounts.

**Flow:**
1. **Deploy** -- `deployHook()`
2. **Configure** -- Call `setLimits(agent, token, dailyLimit=1000000, weeklyLimit=5000000)` for agent (index 1) and token `0x2222...2222`
3. **Act** -- Call `preCheck(owner, 0, encodedData)` where `encodedData` encodes `(agent, token, amount=500000)` using raw ABI argument packing
4. **Assert** -- Call `getSpending(owner, agent, token)` and verify:
   - `spending.DailySpent == 500,000`
   - `spending.WeeklySpent == 500,000`

**Key code -- preCheck data encoding:**

```go
preCheckData, err := abi.Arguments{
    {Type: mustType("address")},
    {Type: mustType("address")},
    {Type: mustType("uint256")},
}.Pack(agent.Address, token, big.NewInt(500000))
```

---

### TestResetSpending

```go
func TestResetSpending(t *testing.T)
```

**What it tests:** Recording spending via `preCheck`, then resetting it via `resetSpending`, and verifying counters return to zero.

**Flow:**
1. **Deploy** -- `deployHook()`
2. **Configure** -- `setLimits(agent, token, 2000000, 10000000)` for agent (index 3) and token `0x3333...3333`
3. **Act (spend)** -- `preCheck` with amount 100,000
4. **Act (reset)** -- Call `resetSpending(agent, token)`
5. **Assert** -- `getSpending()` returns:
   - `spending.DailySpent == 0`
   - `spending.WeeklySpent == 0`

---

### TestIsModuleTypeHook

```go
func TestIsModuleTypeHook(t *testing.T)
```

**What it tests:** The hook correctly identifies as module type 4.

**Flow:**
1. **Deploy** -- `deployHook()`
2. **Assert** -- `isModuleType(4)` returns `true`

---

### mustType (utility)

```go
func mustType(t string) abi.Type
```

A convenience utility used across multiple test files. Wraps `abi.NewType()` and discards the error, intended for well-known type strings like `"address"`, `"uint256"`, etc. Used when manually encoding `preCheck` calldata with `abi.Arguments.Pack()`.

```go
func mustType(t string) abi.Type {
    typ, _ := abi.NewType(t, "", nil)
    return typ
}
```

---

## x402_payment_test.go

**File:** `tests/x402_payment_test.go`

Tests the `X402PaymentPolicy` contract (on-chain budget management) and the mock x402 HTTP payment flow (off-chain negotiation).

### deployX402 (helper)

```go
func deployX402(t *testing.T) (common.Address, abi.ABI, helpers.Account)
```

Deploys a fresh `X402PaymentPolicy` contract using `X402PaymentPolicyABI` and `X402PolicyBytecode`.

---

### TestConfigureAndGetBudget

```go
func TestConfigureAndGetBudget(t *testing.T)
```

**What it tests:** Configuring an agent's x402 payment budget and reading it back.

**Flow:**
1. **Deploy** -- `deployX402()`
2. **Configure** -- Call `configureAgent(agent, budget)` for agent (index 4) with:
   - `maxPerRequest`: 100,000
   - `dailyBudget`: 500,000
   - `totalBudget`: 2,000,000
   - `spent`: 0
   - `dailySpent`: 0
   - `lastReset`: 0
   - `allowedDomains`: `["api.example.com"]`
3. **Assert** -- Call `getBudget(owner, agent)` and verify:
   - `budget.MaxPerRequest == 100,000`
   - `budget.TotalBudget == 2,000,000`

---

### TestPreCheckRecordsSpending

```go
func TestPreCheckRecordsSpending(t *testing.T)
```

**What it tests:** The `preCheck` hook correctly deducts from the agent's total budget.

**Flow:**
1. **Deploy** -- `deployX402()`
2. **Configure** -- Agent (index 5) with `maxPerRequest=200000`, `totalBudget=5000000`
3. **Act** -- `preCheck` with amount 150,000 encoded as `(agent, amount)`
4. **Assert** -- `getRemainingBudget(owner, agent)` returns `4,850,000` (5,000,000 - 150,000)

---

### TestX402MockServerPaymentFlow

```go
func TestX402MockServerPaymentFlow(t *testing.T)
```

**What it tests:** The full off-chain x402 payment negotiation: client hits a paywall, auto-negotiates payment, and the server records it.

**Flow:**
1. **Configure** -- Create a `MockX402Server` with a payment requirement:
   - scheme: `"exact"`, network: `"base-sepolia"`, maxAmount: `"1000"`, resource: `"/api/data"`
2. **Act** -- Create an `X402Client` with agent (index 6) private key, then `GET /api/data`
   - The transport receives a 402, extracts requirements, signs a payment, retries with `X-PAYMENT` header
3. **Assert:**
   - Response status is `200 OK`
   - `server.GetPayments()` has exactly 1 payment
   - Payment amount is `"1000"`
   - Payment sender matches the agent's address

---

### TestX402ServerReturns402WithoutPayment

```go
func TestX402ServerReturns402WithoutPayment(t *testing.T)
```

**What it tests:** A plain HTTP client (no x402 transport) receives a `402 Payment Required` response from the mock server.

**Flow:**
1. **Configure** -- `MockX402Server` with requirement for `"/api/premium"` at amount `"500"`
2. **Act** -- Standard `http.Client{}` (no auto-payment) sends `GET /api/premium`
3. **Assert** -- Response status is `402`

---

## defi_executor_test.go

**File:** `tests/defi_executor_test.go`

Tests the `DeFiExecutor` contract -- the ERC-7579 executor module (type 2) that encodes and dispatches DeFi operations.

### deployExecutor (helper)

```go
func deployExecutor(t *testing.T) (common.Address, abi.ABI, helpers.Account)
```

Deploys a fresh `DeFiExecutor` contract using `DeFiExecutorABI` and `ExecutorBytecode`.

---

### TestEncodeSwap

```go
func TestEncodeSwap(t *testing.T)
```

**What it tests:** The `encodeSwap` pure function produces non-empty encoded swap operation data.

**Flow:**
1. **Deploy** -- `deployExecutor()`
2. **Act** -- Call `encodeSwap(router, tokenIn, tokenOut, amountIn=1000, minOut=900)` where:
   - `router`: `0x4444...4444`
   - `tokenIn`: `0x5555...5555`
   - `tokenOut`: `0x6666...6666`
3. **Assert** -- The returned byte array is not empty

---

### TestEncodeLending

```go
func TestEncodeLending(t *testing.T)
```

**What it tests:** The `encodeLending` pure function produces non-empty encoded lending operation data.

**Flow:**
1. **Deploy** -- `deployExecutor()`
2. **Act** -- Call `encodeLending(pool, asset, amount=5000, isSupply=true)` where:
   - `pool`: `0x7777...7777`
   - `asset`: `0x8888...8888`
3. **Assert** -- The returned byte array is not empty

---

### TestIsModuleTypeExecutor

```go
func TestIsModuleTypeExecutor(t *testing.T)
```

**What it tests:** The executor correctly identifies as module type 2 and rejects type 1.

**Flow:**
1. **Deploy** -- `deployExecutor()`
2. **Assert (positive)** -- `isModuleType(2)` returns `true`
3. **Assert (negative)** -- `isModuleType(1)` returns `false`

---

### TestOnInstallOnUninstall

```go
func TestOnInstallOnUninstall(t *testing.T)
```

**What it tests:** The `onInstall` and `onUninstall` lifecycle callbacks execute without reverting.

**Flow:**
1. **Deploy** -- `deployExecutor()`
2. **Act** -- Call `onInstall(emptyBytes)` via `SendTx()` -- no revert
3. **Act** -- Call `onUninstall(emptyBytes)` via `SendTx()` -- no revert

**Key code:**

```go
installInput, err := parsedABI.Pack("onInstall", []byte{})
_, _, err = helpers.SendTx(client, deployer.Key, &addr, installInput, nil)

uninstallInput, err := parsedABI.Pack("onUninstall", []byte{})
_, _, err = helpers.SendTx(client, deployer.Key, &addr, uninstallInput, nil)
```

---

## full_flow_test.go

**File:** `tests/full_flow_test.go`

End-to-end integration tests that deploy all four contracts together via `deploy.DeployAll()` and exercise the complete Sigloop workflow.

### TestFullFlow

```go
func TestFullFlow(t *testing.T)
```

**What it tests:** A complete multi-module integration: agent permissions, x402 payment negotiation, budget tracking, and spending hook enforcement working together.

**Flow:**

1. **Deploy all contracts** -- `deploy.DeployAll(client, owner)` deploys Validator, Hook, X402Policy, and Executor
2. **Register agent on Validator** -- `addAgent(agent, policy)` where:
   - `allowedTargets`: `[contracts.Executor]` (the Executor contract itself)
   - `maxAmountPerTx`: 1,000,000
   - `active`: true
3. **Verify policy** -- `getPolicy()` confirms `policy.Active == true`
4. **Configure x402 budget** -- `configureAgent(agent, budget)` on X402Policy:
   - `maxPerRequest`: 100,000
   - `dailyBudget`: 500,000
   - `totalBudget`: 2,000,000
   - `allowedDomains`: `["api.example.com", "data.example.com"]`
5. **x402 payment flow** -- Start `MockX402Server` with requirement for `"/api/premium-data"` at amount `"50000"`, then the agent's `X402Client` performs a GET
6. **Verify payment** -- Response is `200 OK`, `server.GetPayments()` has 1 entry, sender matches agent
7. **Record on-chain spending** -- `preCheck` on X402Policy with amount 50,000
8. **Verify remaining budget** -- `getRemainingBudget()` returns `1,950,000`
9. **Configure spending hook** -- `setLimits(agent, zeroAddress, daily=1000000, weekly=5000000)` on Hook
10. **Hook preCheck** -- Record 50,000 spending through the hook
11. **Verify hook spending** -- `getSpending()` returns `dailySpent == 50,000`

---

### TestFullFlowBudgetExhaustion

```go
func TestFullFlowBudgetExhaustion(t *testing.T)
```

**What it tests:** Budget consumption approaching exhaustion -- making multiple payments that deplete the budget and verifying the remaining amount is correct.

**Flow:**

1. **Deploy** -- `deploy.DeployAll()`
2. **Configure tight budget** -- Agent (index 7) with:
   - `maxPerRequest`: 100
   - `dailyBudget`: 250
   - `totalBudget`: 250
3. **Spend twice** -- Loop 2 iterations, each calling `preCheck` with amount 100 (total: 200)
4. **Assert** -- `getRemainingBudget()` returns `50` (250 - 200)

**Key code:**

```go
for i := 0; i < 2; i++ {
    preCheckData, err := abi.Arguments{
        {Type: mustType("address")},
        {Type: mustType("uint256")},
    }.Pack(agent.Address, big.NewInt(100))
    // ...
    _, _, err = helpers.SendTx(client, owner.Key, &contracts.X402Policy, preCheckInput, nil)
}
```

---

[<< Getting Started](getting-started.md) | [Deployment >>](deployment.md)
