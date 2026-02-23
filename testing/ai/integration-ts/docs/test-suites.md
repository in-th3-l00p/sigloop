# Test Suites

[Back to README](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Deployment](./deployment.md)

---

This document describes every test case across all five test suites. Each suite uses a shared `beforeAll` hook that deploys all four contracts via `deployAll()` before any test runs.

---

## Table of Contents

- [1. AgentPermissionValidator](#1-agentpermissionvalidator)
- [2. SpendingLimitHook](#2-spendinglimithook)
- [3. X402PaymentPolicy](#3-x402paymentpolicy)
- [4. DeFiExecutor](#4-defiexecutor)
- [5. Full Flow Integration](#5-full-flow-integration)

---

## 1. AgentPermissionValidator

**File:** `src/tests/agent-permission.test.ts`

**Actors:** `deployer` (deploys contracts), `walletOwner` (account owner who manages policies), `agent` (authorized agent), `unauthorized` (unregistered agent)

### Test Cases

#### 1.1 `should deploy successfully`

| Aspect | Detail |
|---|---|
| **What it tests** | Contract deployment produces on-chain bytecode. |
| **Flow** | Deploy all contracts -> call `getCode()` on the validator address -> assert code length > 2 (not just `0x`). |

#### 1.2 `should report correct module type`

| Aspect | Detail |
|---|---|
| **What it tests** | `isModuleType` correctly identifies the contract as a Validator (type 1) and not a Hook (type 4). |
| **Flow** | Call `isModuleType(1n)` -> expect `true`. Call `isModuleType(4n)` -> expect `false`. |

#### 1.3 `should add an agent with policy`

| Aspect | Detail |
|---|---|
| **What it tests** | The wallet owner can register an agent with a full `AgentPolicy` struct and retrieve it. |
| **Flow** | Owner calls `addAgent(agent, policy)` where the policy includes: `allowedTargets: [zeroAddress]`, `allowedSelectors: ["0xa9059cbb"]` (ERC-20 `transfer`), `maxAmountPerTx: 1 ETH`, `dailyLimit: 5 ETH`, `weeklyLimit: 20 ETH`, `active: true` -> call `getPolicy(owner, agent)` -> assert `active`, `maxAmountPerTx`, target count, selector count all match. |

#### 1.4 `should return inactive policy for unregistered agent`

| Aspect | Detail |
|---|---|
| **What it tests** | Querying a policy for an agent that was never registered returns a zeroed-out, inactive policy. |
| **Flow** | Call `getPolicy(owner, unauthorized)` -> assert `active === false`, `maxAmountPerTx === 0n`. |

#### 1.5 `should remove an agent`

| Aspect | Detail |
|---|---|
| **What it tests** | Adding then removing an agent correctly deactivates the policy. |
| **Flow** | Owner calls `addAgent(unauthorized, policy)` -> owner calls `removeAgent(unauthorized)` -> call `getPolicy(owner, unauthorized)` -> assert `active === false`. |

#### 1.6 `should validate user operation with correct agent signature`

| Aspect | Detail |
|---|---|
| **What it tests** | `validateUserOp` returns `0` (success) when the UserOp signature is produced by the registered agent's private key. |
| **Flow** | Owner calls `addAgent(agent, policy)` -> agent signs `keccak256("test-op")` -> build combined signature (`agentAddress ++ ecdsaSig`) -> construct a `PackedUserOperation` with callData encoding `(bytes4, address, uint256)` -> simulate `validateUserOp(userOp, userOpHash)` -> assert result is `0n` (valid). |

#### 1.7 `should reject user operation with wrong signer`

| Aspect | Detail |
|---|---|
| **What it tests** | `validateUserOp` returns `1` (failure) when the ECDSA signature does not match the agent address embedded in the combined signature. |
| **Flow** | `unauthorized` signs the hash but the combined signature still claims to be from `agent` -> simulate `validateUserOp` -> assert result is `1n` (invalid). |

---

## 2. SpendingLimitHook

**File:** `src/tests/spending-limit.test.ts`

**Actors:** `deployer`, `walletOwner`, `agent`

Uses a synthetic token address `0x0000...0001` for limit tracking.

### Test Cases

#### 2.1 `should deploy successfully`

| Aspect | Detail |
|---|---|
| **What it tests** | Contract deployment produces on-chain bytecode. |
| **Flow** | Deploy -> `getCode()` -> assert length > 2. |

#### 2.2 `should report correct module type`

| Aspect | Detail |
|---|---|
| **What it tests** | `isModuleType` returns `true` for Hook (type 4) and `false` for Validator (type 1). |
| **Flow** | `isModuleType(4n)` -> `true`. `isModuleType(1n)` -> `false`. |

#### 2.3 `should set spending limits`

| Aspect | Detail |
|---|---|
| **What it tests** | Owner can set daily and weekly limits for an agent on a specific token, and the initial spending is zero. |
| **Flow** | Owner calls `setLimits(agent, token, 10_000_000, 50_000_000)` -> call `getSpending(owner, agent, token)` -> assert `dailySpent === 0n`, `weeklySpent === 0n`. |

#### 2.4 `should track spending via preCheck`

| Aspect | Detail |
|---|---|
| **What it tests** | Calling `preCheck` with encoded `(agent, token, amount)` increments both daily and weekly spending counters. |
| **Flow** | Set limits -> encode `(agent, token, 3_000_000)` as `msgData` -> call `preCheck(agent, 0, msgData)` -> call `getSpending` -> assert `dailySpent === 3_000_000n`, `weeklySpent === 3_000_000n`. |

#### 2.5 `should enforce daily spending limit`

| Aspect | Detail |
|---|---|
| **What it tests** | A `preCheck` call that would exceed the daily limit reverts. |
| **Flow** | Set limits with `dailyLimit = 5_000_000` -> attempt `preCheck` with amount `5_000_001` -> expect transaction to revert. |

#### 2.6 `should enforce weekly spending limit`

| Aspect | Detail |
|---|---|
| **What it tests** | A `preCheck` call that would exceed the weekly limit reverts, even if the daily limit is not breached. |
| **Flow** | Set limits with `dailyLimit = 50_000_000` (high) and `weeklyLimit = 5_000_000` (low) -> attempt `preCheck` with amount `5_000_001` -> expect revert. |

#### 2.7 `should reset spending`

| Aspect | Detail |
|---|---|
| **What it tests** | Owner can reset an agent's spending counters to zero for a specific token. |
| **Flow** | Set limits -> `preCheck` with `5_000_000` -> call `resetSpending(agent, token)` -> call `getSpending` -> assert `dailySpent === 0n`, `weeklySpent === 0n`. |

#### 2.8 `should emit SpendingRecorded on postCheck`

| Aspect | Detail |
|---|---|
| **What it tests** | Calling `postCheck` with hook data emits at least one log event. |
| **Flow** | Encode `(agent, token, 1_000_000)` as hookData -> call `postCheck(hookData)` -> get receipt -> assert `logs.length > 0`. |

---

## 3. X402PaymentPolicy

**File:** `src/tests/x402-payment.test.ts`

**Actors:** `deployer`, `walletOwner`, `agent`

Starts a mock x402 HTTP server on port `18402` in `beforeAll` and tears it down in `afterAll`.

### Test Cases

#### 3.1 `should deploy successfully`

| Aspect | Detail |
|---|---|
| **What it tests** | Contract deployment produces on-chain bytecode. |
| **Flow** | Deploy -> `getCode()` -> assert length > 2. |

#### 3.2 `should report correct module type`

| Aspect | Detail |
|---|---|
| **What it tests** | `isModuleType` returns `true` for Hook (type 4). |
| **Flow** | `isModuleType(4n)` -> `true`. |

#### 3.3 `should configure agent budget`

| Aspect | Detail |
|---|---|
| **What it tests** | Owner can set a full `X402Budget` for an agent and read it back. |
| **Flow** | Owner calls `configureAgent(agent, budget)` with `maxPerRequest: 2_000_000`, `dailyBudget: 10_000_000`, `totalBudget: 50_000_000`, `allowedDomains: ["api.example.com"]` -> call `getBudget(owner, agent)` -> assert all fields match and `spent === 0n`. |

#### 3.4 `should track spending via preCheck`

| Aspect | Detail |
|---|---|
| **What it tests** | Calling `preCheck` with encoded `(agent, amount)` increments both `spent` and `dailySpent`. |
| **Flow** | Configure budget -> encode `(agent, 1_000_000)` -> call `preCheck` -> call `getBudget` -> assert `spent === 1_000_000n`, `dailySpent === 1_000_000n`. |

#### 3.5 `should reject payment exceeding max per request`

| Aspect | Detail |
|---|---|
| **What it tests** | A payment that exceeds `maxPerRequest` reverts. |
| **Flow** | Configure with `maxPerRequest: 500_000` -> attempt `preCheck` with `1_000_000` -> expect revert. |

#### 3.6 `should reject payment exceeding total budget`

| Aspect | Detail |
|---|---|
| **What it tests** | A payment that exceeds `totalBudget` reverts. |
| **Flow** | Configure with `totalBudget: 2_000_000` -> attempt `preCheck` with `3_000_000` -> expect revert. |

#### 3.7 `should return remaining budget`

| Aspect | Detail |
|---|---|
| **What it tests** | `getRemainingBudget` correctly returns `totalBudget - spent`. |
| **Flow** | Configure with `totalBudget: 50_000_000` -> `preCheck` with `1_500_000` -> call `getRemainingBudget` -> assert `48_500_000n`. |

#### 3.8 `should handle x402 payment flow with mock server`

| Aspect | Detail |
|---|---|
| **What it tests** | The full HTTP 402 handshake: initial request gets 402, client signs and retries with `X-PAYMENT` header, server returns 200. |
| **Flow** | Call `x402Fetch("http://127.0.0.1:18402/api/data", agentClient)` -> assert `paymentMade === true`, `amountPaid === "1000000"`, `response.status === 200`, `body.paymentVerified === true`. |

#### 3.9 `should emit PaymentRecorded on postCheck`

| Aspect | Detail |
|---|---|
| **What it tests** | Calling `postCheck` with hook data emits at least one log event. |
| **Flow** | Encode `(agent, 500_000)` -> call `postCheck` -> assert `receipt.logs.length > 0`. |

---

## 4. DeFiExecutor

**File:** `src/tests/defi-executor.test.ts`

**Actors:** `deployer`, `walletOwner`

### Test Cases

#### 4.1 `should deploy successfully`

| Aspect | Detail |
|---|---|
| **What it tests** | Contract deployment produces on-chain bytecode. |
| **Flow** | Deploy -> `getCode()` -> assert length > 2. |

#### 4.2 `should report correct module type`

| Aspect | Detail |
|---|---|
| **What it tests** | `isModuleType` returns `true` for Executor (type 2) and `false` for Validator (type 1). |
| **Flow** | `isModuleType(2n)` -> `true`. `isModuleType(1n)` -> `false`. |

#### 4.3 `should encode swap action`

| Aspect | Detail |
|---|---|
| **What it tests** | `encodeSwap` returns non-empty bytes encoding a token swap. |
| **Flow** | Call `encodeSwap(router, tokenIn, tokenOut, 1_000_000, 950_000)` using synthetic addresses -> assert result is defined and length > 2. |

#### 4.4 `should encode lending supply action`

| Aspect | Detail |
|---|---|
| **What it tests** | `encodeLending` with `isSupply = true` returns non-empty bytes. |
| **Flow** | Call `encodeLending(pool, asset, 5_000_000, true)` -> assert result is defined and length > 2. |

#### 4.5 `should encode lending borrow action`

| Aspect | Detail |
|---|---|
| **What it tests** | `encodeLending` with `isSupply = false` (borrow) returns non-empty bytes. |
| **Flow** | Call `encodeLending(pool, asset, 3_000_000, false)` -> assert result is defined and length > 2. |

#### 4.6 `should reject execution with zero target`

| Aspect | Detail |
|---|---|
| **What it tests** | `executeFromExecutor` reverts when the target address in the action is `address(0)`. |
| **Flow** | Encode a `DeFiAction` tuple with `target: zeroAddress` -> call `executeFromExecutor(owner, actionData)` -> expect revert. |

#### 4.7 `should execute action against a target that accepts calls`

| Aspect | Detail |
|---|---|
| **What it tests** | `executeFromExecutor` successfully forwards a call to a valid target and returns its result. |
| **Flow** | Encode an action with `target = deFiExecutor` itself and `data = encodeFunctionData("isModuleType", [2n])` -> simulate `executeFromExecutor` -> decode the returned bytes as `isModuleType` result -> assert `true`. |

---

## 5. Full Flow Integration

**File:** `src/tests/full-flow.test.ts`

**Actors:** `deployer`, `walletOwner`, `agent`, `unauthorized`

Starts a mock x402 HTTP server on port `18403`. This suite exercises all four contracts together in realistic multi-step scenarios.

### Test Cases

#### 5.1 `should complete end-to-end: deploy -> add agent -> set policy -> x402 payment -> check budget`

| Aspect | Detail |
|---|---|
| **What it tests** | The complete lifecycle: deploy contracts, register an agent, configure spending limits and x402 budget, make an HTTP 402 payment, record spending on-chain, and verify budget deduction. |
| **Flow** | 1. Verify contracts deployed (`getCode`). 2. Owner calls `addAgent` on validator with a generous policy. 3. Owner calls `setLimits` on spending hook for `tokenAddress`. 4. Owner calls `configureAgent` on x402 policy with `totalBudget: 50_000_000`. 5. Agent calls `x402Fetch` -> gets 402 -> signs -> gets 200. 6. Owner calls `preCheck` on x402 policy to record the payment amount. 7. Read `getBudget` -> assert `spent === paymentAmount`. 8. Read `getRemainingBudget` -> assert `50_000_000 - paymentAmount`. |

#### 5.2 `should validate agent signature in full flow`

| Aspect | Detail |
|---|---|
| **What it tests** | Agent signature validation succeeds in the context of a fully deployed system. |
| **Flow** | Agent signs `keccak256("full-flow-test")` -> build combined signature -> construct UserOp -> simulate `validateUserOp` -> assert result `0n`. |

#### 5.3 `should reject unauthorized agent in full flow`

| Aspect | Detail |
|---|---|
| **What it tests** | An unauthorized agent's UserOp is rejected by the validator. |
| **Flow** | `unauthorized` signs `keccak256("unauthorized-flow")` -> combined signature uses `unauthorized.address` -> simulate `validateUserOp` -> assert result `1n`. |

#### 5.4 `should enforce x402 budget limits after multiple payments`

| Aspect | Detail |
|---|---|
| **What it tests** | After multiple payments exhaust the total budget, further payments revert. |
| **Flow** | Configure agent with `totalBudget: 3_000_000`, `maxPerRequest: 1_500_000` -> `preCheck` with `1_500_000` (success) -> `preCheck` with `1_500_000` (success, total now 3M) -> `preCheck` with `1_000_000` (expect revert) -> `getRemainingBudget` -> assert `0n`. |

#### 5.5 `should track spending through spending limit hook`

| Aspect | Detail |
|---|---|
| **What it tests** | The spending limit hook correctly records spend amounts. |
| **Flow** | Encode `(agent, tokenAddress, 2_000_000)` -> call `preCheck` on spending hook -> call `getSpending` -> assert `dailySpent === 2_000_000n`, `weeklySpent === 2_000_000n`. |

#### 5.6 `should encode and validate DeFi executor actions`

| Aspect | Detail |
|---|---|
| **What it tests** | DeFi executor can encode a swap and correctly reports its module type, all within the full-flow context. |
| **Flow** | Call `encodeSwap(router, tokenIn, tokenOut, 1_000_000, 950_000)` -> assert non-empty. Call `isModuleType(2n)` -> assert `true`. |

---

## Test Count Summary

| Suite | Test Cases |
|---|---|
| AgentPermissionValidator | 6 |
| SpendingLimitHook | 8 |
| X402PaymentPolicy | 9 |
| DeFiExecutor | 7 |
| Full Flow Integration | 7 (including the budget-limit sub-scenario) |
| **Total** | **37** |

---

[Back to README](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Deployment](./deployment.md)
