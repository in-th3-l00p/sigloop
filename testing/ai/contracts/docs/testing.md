# Testing

[Back to Overview](./README.md) | [Previous: Deployment](./deployment.md)

---

## Overview

The Sigloop test suite uses [Foundry's `forge test`](https://book.getfoundry.sh/forge/tests) framework. Every module has a dedicated test file that validates both the happy path and edge-case / revert conditions.

| Test File | Contract Under Test | Tests |
|---|---|---|
| `test/AgentPermissionValidator.t.sol` | [`AgentPermissionValidator`](./agent-permission-validator.md) | 7 |
| `test/DeFiExecutor.t.sol` | [`DeFiExecutor`](./defi-executor.md) | 6 |
| `test/SpendingLimitHook.t.sol` | [`SpendingLimitHook`](./spending-limit-hook.md) | 7 |
| `test/X402PaymentPolicy.t.sol` | [`X402PaymentPolicy`](./x402-payment-policy.md) | 7 |

---

## Running Tests

### Run all tests

```bash
forge test
```

### Run with verbose output (see pass/fail for each test)

```bash
forge test -vv
```

### Run with full call traces (debug failing tests)

```bash
forge test -vvvv
```

### Run a single test file

```bash
forge test --match-path test/AgentPermissionValidator.t.sol
```

### Run a single test function

```bash
forge test --match-test testAddAgentAndValidate
```

### Gas report

```bash
forge test --gas-report
```

---

## Test Suite: `AgentPermissionValidator.t.sol`

**File**: `test/AgentPermissionValidator.t.sol`

### Setup

```solidity
function setUp() public {
    validator = new AgentPermissionValidator();
    account = address(this);
    agentKey = 0xA11CE;
    agent = vm.addr(agentKey);
    targetContract = address(0xBEEF);
}
```

- Deploys a fresh `AgentPermissionValidator`.
- Uses `vm.addr(0xA11CE)` to derive a deterministic agent address from a known private key.
- Sets `targetContract` to `0xBEEF`.

### Helper: `_createPolicy`

Creates a standard `AgentPolicy` with:
- `allowedTargets`: `[0xBEEF]`
- `allowedSelectors`: `[transfer(address,uint256)]`
- `maxAmountPerTx`: `1 ether`
- `dailyLimit`: `10 ether`
- `weeklyLimit`: `50 ether`
- `validAfter`: `block.timestamp`
- `validUntil`: `block.timestamp + 365 days`
- `active`: `true`

### Helper: `_buildUserOp`

Constructs a `PackedUserOperation` with:
1. `callData` encoding the target, value, and selector.
2. A `userOpHash` derived from `keccak256(abi.encode(sender, nonce, callData))`.
3. An ECDSA signature using the agent's private key (`vm.sign`), packed as `[agent address (20 bytes)][r (32)][s (32)][v (1)]`.

### Tests

| Test | What it validates |
|---|---|
| `testAddAgentAndValidate` | Agent with a valid policy and signature is accepted (returns `0`). Covers the full happy path: add policy, build signed UserOp, validate. |
| `testUnauthorizedTargetFails` | UserOp targeting `0xDEAD` (not in `allowedTargets`) is rejected (returns `1`). Validates target allowlist enforcement. |
| `testOverLimitAmountFails` | UserOp with `value = 2 ether` (exceeds `maxAmountPerTx = 1 ether`) is rejected (returns `1`). Validates per-transaction amount cap. |
| `testExpiredTimeWindowFails` | Policy with `validUntil = 500` validated at `block.timestamp = 1000` is rejected (returns `1`). Validates time-window expiration via `PolicyLib.isPolicyActive`. |
| `testRemoveAgent` | After `removeAgent(agent)`, the same previously-valid UserOp is rejected (returns `1`). Validates that policy deletion works. |
| `testGetPolicy` | After `addAgent`, `getPolicy` returns the correct `maxAmountPerTx`, `active`, and `allowedTargets[0]`. Validates read-only policy retrieval. |
| `testIsModuleType` | `isModuleType(1)` returns `true`; `isModuleType(2)` and `isModuleType(4)` return `false`. Validates ERC-7579 type introspection. |

---

## Test Suite: `DeFiExecutor.t.sol`

**File**: `test/DeFiExecutor.t.sol`

### Mock Contracts

The test file defines two mock contracts:

#### `MockRouter`

```solidity
contract MockRouter {
    event SwapExecuted(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut);

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut)
        external returns (bool)
    {
        emit SwapExecuted(tokenIn, tokenOut, amountIn, minOut);
        return true;
    }
}
```

Simulates a DEX router with a `swap` function that emits an event and returns `true`.

#### `MockPool`

```solidity
contract MockPool {
    event SupplyExecuted(address asset, uint256 amount);
    event BorrowExecuted(address asset, uint256 amount);

    function supply(address asset, uint256 amount) external returns (bool) {
        emit SupplyExecuted(asset, amount);
        return true;
    }

    function borrow(address asset, uint256 amount) external returns (bool) {
        emit BorrowExecuted(asset, amount);
        return true;
    }
}
```

Simulates a lending pool with `supply` and `borrow` functions.

### Setup

```solidity
function setUp() public {
    executor = new DeFiExecutor();
    router = new MockRouter();
    pool = new MockPool();
    tokenA = address(0xA);
    tokenB = address(0xB);
}
```

### Tests

| Test | What it validates |
|---|---|
| `testEncodeAndExecuteSwap` | `encodeSwap` produces valid data that `executeFromExecutor` can decode and execute against the `MockRouter`. Verifies the full encode-then-execute round-trip for swaps. |
| `testEncodeLendingSupply` | `encodeLending(..., true)` produces valid supply action data. Executes successfully against `MockPool.supply`. |
| `testEncodeLendingBorrow` | `encodeLending(..., false)` produces valid borrow action data. Executes successfully against `MockPool.borrow`. |
| `testZeroTargetReverts` | A `DeFiAction` with `target = address(0)` reverts with `"DeFiExecutor: zero target"`. |
| `testExecutionWithBadCallReverts` | A `DeFiAction` calling a non-existent function on `MockRouter` reverts with `"DeFiExecutor: execution failed"`. |
| `testIsModuleType` | `isModuleType(2)` returns `true`; `isModuleType(1)` and `isModuleType(4)` return `false`. |

---

## Test Suite: `SpendingLimitHook.t.sol`

**File**: `test/SpendingLimitHook.t.sol`

### Setup

```solidity
function setUp() public {
    hook = new SpendingLimitHook();
    account = address(this);
    agent = address(0xA1);
    token = address(0x7040);
    hook.setLimits(agent, token, 10 ether, 50 ether);
}
```

Configures the hook with a daily limit of `10 ether` and weekly limit of `50 ether` for the test agent-token pair.

### Tests

| Test | What it validates |
|---|---|
| `testSpendWithinLimits` | Spending `5 ether` succeeds and correctly updates `dailySpent` and `weeklySpent` to `5 ether`. |
| `testSpendOverDailyLimitReverts` | Spending `5 ether` then `6 ether` (total `11 ether` > daily limit `10 ether`) reverts with `"SpendingLib: daily limit exceeded"`. |
| `testDailyResetWorks` | Spending `9 ether`, warping forward 1 day, then spending `9 ether` again succeeds. After the reset, `dailySpent` is `9 ether` (only the second spend). |
| `testWeeklyLimitTracking` | Spending `9 ether` per day for 5 days (total `45 ether`), then attempting `6 ether` (would be `51 ether` > weekly `50 ether`) reverts with `"SpendingLib: weekly limit exceeded"`. |
| `testResetSpending` | After spending `5 ether`, calling `resetSpending` zeroes out both `dailySpent` and `weeklySpent`. |
| `testPostCheckEmitsEvent` | Calling `postCheck` with encoded hook data does not revert. (Event emission is implicitly validated by Foundry if `vm.expectEmit` were used, but this test validates no revert.) |
| `testIsModuleType` | `isModuleType(4)` returns `true`; `isModuleType(1)` returns `false`. |

---

## Test Suite: `X402PaymentPolicy.t.sol`

**File**: `test/X402PaymentPolicy.t.sol`

### Setup

```solidity
function setUp() public {
    policy = new X402PaymentPolicy();
    account = address(this);
    agent = address(0xA1);

    string[] memory domains = new string[](1);
    domains[0] = "api.example.com";

    X402PaymentPolicy.X402Budget memory budget = X402PaymentPolicy.X402Budget({
        maxPerRequest: 1 ether,
        dailyBudget: 5 ether,
        totalBudget: 20 ether,
        spent: 0,
        dailySpent: 0,
        lastReset: 0,
        allowedDomains: domains
    });

    policy.configureAgent(agent, budget);
}
```

Configures the policy with:
- `maxPerRequest`: `1 ether`
- `dailyBudget`: `5 ether`
- `totalBudget`: `20 ether`
- `allowedDomains`: `["api.example.com"]`

### Tests

| Test | What it validates |
|---|---|
| `testPaymentWithinBudget` | Paying `0.5 ether` succeeds. `getRemainingBudget` returns `19.5 ether`. |
| `testPaymentOverPerRequestCapReverts` | Paying `2 ether` (> `maxPerRequest = 1 ether`) reverts with `"X402: exceeds max per request"`. |
| `testBudgetExhaustionStopsPayments` | 20 payments of `1 ether` each (across multiple days to avoid daily limit) exhaust the `20 ether` total budget. The 21st payment reverts with `"X402: total budget exceeded"`. |
| `testDailyReset` | 5 payments of `1 ether` exhaust the `5 ether` daily budget. A 6th payment reverts with `"X402: daily budget exceeded"`. After warping 1 day, a new `1 ether` payment succeeds with `dailySpent = 1 ether` and `spent = 6 ether`. |
| `testGetBudget` | `getBudget` returns the correct `maxPerRequest` and `totalBudget` values. |
| `testPostCheckEmitsEvent` | Calling `postCheck` with encoded hook data does not revert. |
| `testIsModuleType` | `isModuleType(4)` returns `true`; `isModuleType(1)` and `isModuleType(2)` return `false`. |

---

## Adding New Tests

### Step 1: Create a test file

Create a new file in `test/` following the naming convention `<ContractName>.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/modules/YourContract.sol";

contract YourContractTest is Test {
    YourContract public target;

    function setUp() public {
        target = new YourContract();
        // ... initialization
    }

    function testSomething() public {
        // Arrange
        // ...

        // Act
        // ...

        // Assert
        assertEq(actual, expected);
    }

    function testSomethingReverts() public {
        vm.expectRevert("Expected revert message");
        target.functionThatShouldRevert();
    }
}
```

### Step 2: Common Foundry cheatcodes used in this project

| Cheatcode | Usage | Example |
|---|---|---|
| `vm.addr(privateKey)` | Derive address from private key | `agent = vm.addr(0xA11CE)` |
| `vm.sign(privateKey, digest)` | Sign a digest with a private key | `(v, r, s) = vm.sign(agentKey, ethHash)` |
| `vm.warp(timestamp)` | Set `block.timestamp` | `vm.warp(block.timestamp + 1 days)` |
| `vm.expectRevert(msg)` | Expect the next call to revert | `vm.expectRevert("SpendingLib: daily limit exceeded")` |

### Step 3: Run your new tests

```bash
forge test --match-path test/YourContract.t.sol -vv
```

### Testing tips

- **Isolation**: Each `test*` function runs in a fresh EVM state starting from `setUp()`. Tests do not share state.
- **Time manipulation**: Use `vm.warp()` to test daily/weekly reset logic. Remember that `1 days = 86400` seconds.
- **Signature testing**: Use `vm.sign()` to produce valid ECDSA signatures and `vm.addr()` to derive the corresponding address.
- **Revert testing**: Always use `vm.expectRevert()` immediately before the call that should revert. The revert message must match exactly.
- **Gas optimization**: Run `forge test --gas-report` to identify expensive operations in your tests.

---

[Back to Overview](./README.md) | [Previous: Deployment](./deployment.md)
