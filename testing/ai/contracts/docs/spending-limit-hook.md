# SpendingLimitHook

[Back to Overview](./README.md) | [Previous: AgentPermissionValidator](./agent-permission-validator.md) | [Next: X402PaymentPolicy](./x402-payment-policy.md)

---

## Overview

| Property | Value |
|---|---|
| **File** | `src/modules/SpendingLimitHook.sol` |
| **Module Type** | Hook (`typeId == 4`) |
| **ERC-7579 Role** | Pre/post-execution hook for spending enforcement |
| **Depends on** | [`IHook`](./interfaces.md#ihook-interface), [`SpendingRecord`](./libraries.md#spendingrecord-struct), [`SpendingLib`](./libraries.md#spendinglib) |

### Purpose

`SpendingLimitHook` enforces per-agent, per-token daily and weekly spending caps. It is installed as an ERC-7579 Hook module on a smart account. Every time the account executes an operation that involves token spending:

1. `preCheck` validates that the proposed spend does not exceed the agent's configured limits, automatically resetting counters at the start of each new day/week.
2. `postCheck` emits a `SpendingRecorded` event for off-chain indexing.

---

## Storage Layout

### `_records`

```solidity
mapping(address => mapping(address => mapping(address => SpendingRecord))) private _records;
```

| Key | Type | Description |
|---|---|---|
| 1st | `address` | Smart-account address |
| 2nd | `address` | Agent address |
| 3rd | `address` | Token address |
| Value | `SpendingRecord` | Rolling spend tracker (see [`SpendingLib`](./libraries.md#spendingrecord-struct)) |

### `_dailyLimits`

```solidity
mapping(address => mapping(address => mapping(address => uint256))) private _dailyLimits;
```

| Key | Type | Description |
|---|---|---|
| 1st | `address` | Smart-account address |
| 2nd | `address` | Agent address |
| 3rd | `address` | Token address |
| Value | `uint256` | Maximum allowed daily spending for this (account, agent, token) triple |

### `_weeklyLimits`

```solidity
mapping(address => mapping(address => mapping(address => uint256))) private _weeklyLimits;
```

Same structure as `_dailyLimits` but for weekly caps.

---

## Events

### `SpendingRecorded`

```solidity
event SpendingRecorded(
    address indexed account,
    address indexed agent,
    address indexed token,
    uint256 amount
);
```

Emitted in `postCheck` after a successful spend. All three address fields are `indexed` for efficient filtering by off-chain indexers.

| Parameter | Type | Indexed | Description |
|---|---|---|---|
| `account` | `address` | Yes | The smart account that spent |
| `agent` | `address` | Yes | The agent that initiated the spend |
| `token` | `address` | Yes | The token that was spent |
| `amount` | `uint256` | No | The amount spent |

---

## Functions

### `onInstall`

```solidity
function onInstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `(address agent, address token, uint256 dailyLimit, uint256 weeklyLimit)` |
| **Returns** | None |
| **Access Control** | Called by the smart account during module installation |

**Description**: Module installation callback. Decodes the configuration data and stores the daily and weekly limits for the specified agent-token pair.

**Logic walkthrough**:
1. ABI-decode `data` into `(address agent, address token, uint256 dailyLimit, uint256 weeklyLimit)`.
2. `_dailyLimits[msg.sender][agent][token] = dailyLimit`.
3. `_weeklyLimits[msg.sender][agent][token] = weeklyLimit`.

---

### `onUninstall`

```solidity
function onUninstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `(address agent, address token)` |
| **Returns** | None |
| **Access Control** | Called by the smart account during module uninstallation |

**Description**: Cleans up all state for the specified agent-token pair: deletes the spending record, daily limit, and weekly limit.

**Logic walkthrough**:
1. ABI-decode `data` into `(address agent, address token)`.
2. `delete _records[msg.sender][agent][token]`.
3. `delete _dailyLimits[msg.sender][agent][token]`.
4. `delete _weeklyLimits[msg.sender][agent][token]`.

---

### `preCheck`

```solidity
function preCheck(
    address msgSender,
    uint256,
    bytes calldata msgData
) external override returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `msgSender` -- the original caller address; (unnamed `uint256`) -- ETH value (unused); `msgData` -- ABI-encoded `(address agent, address token, uint256 amount)` |
| **Returns** | `bytes memory` -- encoded `(agent, token, amount)` tuple passed to `postCheck` |
| **Access Control** | Called by the smart account before execution |

**Description**: The pre-execution spending enforcement function.

**Logic walkthrough**:

1. **Short-circuit on insufficient data**: If `msgData.length < 96`, returns `abi.encode(msgSender, address(0), uint256(0))` -- no enforcement, no spend recorded.

2. **Decode parameters**: `(address agent, address token, uint256 amount) = abi.decode(msgData, (address, address, uint256))`.

3. **Load limits**:
   ```solidity
   uint256 dailyLimit = _dailyLimits[msg.sender][agent][token];
   uint256 weeklyLimit = _weeklyLimits[msg.sender][agent][token];
   ```

4. **Enforce limits**: If either `dailyLimit > 0` or `weeklyLimit > 0`, calls `_records[msg.sender][agent][token].checkAndUpdateSpending(amount, dailyLimit, weeklyLimit)`. This will:
   - Reset the daily counter if a new day has started.
   - Reset the weekly counter if a new week has started.
   - Revert with `"SpendingLib: daily limit exceeded"` or `"SpendingLib: weekly limit exceeded"` if the spend would exceed limits.
   - Increment the counters.

5. **Return hook data**: `return abi.encode(agent, token, amount)` for consumption by `postCheck`.

**Revert conditions**:

| Condition | Revert Message |
|---|---|
| `dailySpent + amount > dailyLimit` | `"SpendingLib: daily limit exceeded"` |
| `weeklySpent + amount > weeklyLimit` | `"SpendingLib: weekly limit exceeded"` |

---

### `postCheck`

```solidity
function postCheck(bytes calldata hookData) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `hookData` -- the data returned by `preCheck`, encoded as `(address agent, address token, uint256 amount)` |
| **Returns** | None |
| **Access Control** | Called by the smart account after execution |

**Description**: Post-execution callback. Decodes the hook data and emits the `SpendingRecorded` event.

**Logic walkthrough**:
1. `(address agent, address token, uint256 amount) = abi.decode(hookData, (address, address, uint256))`.
2. `emit SpendingRecorded(msg.sender, agent, token, amount)`.

---

### `setLimits`

```solidity
function setLimits(
    address agent,
    address token,
    uint256 dailyLimit,
    uint256 weeklyLimit
) external
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `agent` -- the agent address; `token` -- the token address; `dailyLimit` -- the new daily cap; `weeklyLimit` -- the new weekly cap |
| **Returns** | None |
| **Access Control** | Any caller (`msg.sender` is treated as the account) |

**Description**: Updates the spending limits for a specific agent-token pair. Can be called directly (outside of the `onInstall` flow) to adjust limits at any time.

**Logic**:
1. `_dailyLimits[msg.sender][agent][token] = dailyLimit`.
2. `_weeklyLimits[msg.sender][agent][token] = weeklyLimit`.

**Note**: This does not reset existing spending records. To also reset accumulated spending, call `resetSpending` separately.

---

### `getSpending`

```solidity
function getSpending(
    address account,
    address agent,
    address token
) external view returns (SpendingRecord memory)
```

| | |
|---|---|
| **Visibility** | `external view` |
| **Parameters** | `account` -- the smart-account address; `agent` -- the agent address; `token` -- the token address |
| **Returns** | `SpendingRecord memory` -- the current spending record |

**Description**: Read-only query for the current spending state. Returns the `SpendingRecord` struct including `dailySpent`, `weeklySpent`, `lastDailyReset`, and `lastWeeklyReset`.

---

### `resetSpending`

```solidity
function resetSpending(address agent, address token) external
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `agent` -- the agent address; `token` -- the token address |
| **Returns** | None |
| **Access Control** | Any caller (`msg.sender` is treated as the account) |

**Description**: Manually resets the spending record for a specific agent-token pair. Zeroes out `dailySpent`, `weeklySpent`, `lastDailyReset`, and `lastWeeklyReset`.

**Logic**: `delete _records[msg.sender][agent][token]`.

---

### `isModuleType`

```solidity
function isModuleType(uint256 typeId) external pure override returns (bool)
```

| | |
|---|---|
| **Visibility** | `external pure` |
| **Returns** | `true` if `typeId == 4`, `false` otherwise |

**Description**: ERC-7579 module-type introspection. This contract is a **Hook** (type `4`).

---

## Access Control

| Function | Who can call | Notes |
|---|---|---|
| `onInstall` | Smart account | During module installation |
| `onUninstall` | Smart account | During module uninstallation |
| `preCheck` | Smart account | Before execution; `msg.sender` is the account |
| `postCheck` | Smart account | After execution |
| `setLimits` | Anyone | `msg.sender` is used as the account key |
| `getSpending` | Anyone | Read-only |
| `resetSpending` | Anyone | `msg.sender` is used as the account key |

---

## Pre/Post Check Flow Diagram

```
Smart Account
     |
     | (1) preCheck(msgSender, value, abi.encode(agent, token, amount))
     v
SpendingLimitHook
     |
     |-- reset daily/weekly counters if new period
     |-- require(dailySpent + amount <= dailyLimit)
     |-- require(weeklySpent + amount <= weeklyLimit)
     |-- dailySpent += amount
     |-- weeklySpent += amount
     |-- return abi.encode(agent, token, amount)
     |
     v
Smart Account executes the operation
     |
     | (2) postCheck(hookData)
     v
SpendingLimitHook
     |
     |-- emit SpendingRecorded(account, agent, token, amount)
```

---

## SDK Interaction Example

```typescript
import { ethers } from "ethers";

const hook = new ethers.Contract(hookAddress, hookABI, signer);

// Set spending limits for an agent on USDC
await hook.setLimits(
  agentAddress,
  USDC_ADDRESS,
  ethers.parseUnits("100", 6),  // 100 USDC daily
  ethers.parseUnits("500", 6),  // 500 USDC weekly
);

// Query current spending
const record = await hook.getSpending(accountAddress, agentAddress, USDC_ADDRESS);
console.log("Daily spent:", ethers.formatUnits(record.dailySpent, 6));
console.log("Weekly spent:", ethers.formatUnits(record.weeklySpent, 6));

// Emergency reset
await hook.resetSpending(agentAddress, USDC_ADDRESS);
```

---

[Back to Overview](./README.md) | [Previous: AgentPermissionValidator](./agent-permission-validator.md) | [Next: X402PaymentPolicy](./x402-payment-policy.md)
