# X402PaymentPolicy

[Back to Overview](./README.md) | [Previous: SpendingLimitHook](./spending-limit-hook.md) | [Next: DeFiExecutor](./defi-executor.md)

---

## Overview

| Property | Value |
|---|---|
| **File** | `src/modules/X402PaymentPolicy.sol` |
| **Module Type** | Hook (`typeId == 4`) |
| **ERC-7579 Role** | Pre/post-execution hook for HTTP 402 payment budget enforcement |
| **Depends on** | [`IHook`](./interfaces.md#ihook-interface) |

### Purpose

`X402PaymentPolicy` enforces budgets for HTTP 402 (Payment Required) micro-payments made by AI agents. The [HTTP 402 protocol](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402) enables machine-to-machine payments for API access. This hook ensures that:

1. No single request exceeds a per-request cap.
2. Daily spending stays within a daily budget (with automatic daily resets).
3. Lifetime spending stays within a total budget.
4. Payments are only made to pre-approved domains.

---

## Storage Layout

### `X402Budget` Struct

```solidity
struct X402Budget {
    uint256 maxPerRequest;
    uint256 dailyBudget;
    uint256 totalBudget;
    uint256 spent;
    uint256 dailySpent;
    uint256 lastReset;
    string[] allowedDomains;
}
```

| Field | Type | Description |
|---|---|---|
| `maxPerRequest` | `uint256` | Maximum payment amount allowed in a single request |
| `dailyBudget` | `uint256` | Maximum total payments allowed per day |
| `totalBudget` | `uint256` | Maximum lifetime budget for this agent |
| `spent` | `uint256` | Running total of all-time spending |
| `dailySpent` | `uint256` | Running total of spending in the current day |
| `lastReset` | `uint256` | The "day number" (`block.timestamp / 1 days`) when `dailySpent` was last reset |
| `allowedDomains` | `string[]` | List of domain names the agent is allowed to pay (stored on-chain for reference; enforcement may occur off-chain or in future versions) |

### `_budgets`

```solidity
mapping(address => mapping(address => X402Budget)) private _budgets;
```

| Key | Type | Description |
|---|---|---|
| 1st | `address` | Smart-account address |
| 2nd | `address` | Agent address |
| Value | `X402Budget` | The payment budget for this account-agent pair |

---

## Events

### `PaymentRecorded`

```solidity
event PaymentRecorded(address indexed account, address indexed agent, uint256 amount);
```

Emitted in `postCheck` after a successful payment pass-through.

| Parameter | Type | Indexed | Description |
|---|---|---|---|
| `account` | `address` | Yes | The smart account that paid |
| `agent` | `address` | Yes | The agent that initiated the payment |
| `amount` | `uint256` | No | The payment amount |

---

## Functions

### `onInstall`

```solidity
function onInstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `(address agent, uint256 maxPerRequest, uint256 dailyBudget, uint256 totalBudget, string[] domains)` |
| **Returns** | None |
| **Access Control** | Called by the smart account during module installation |

**Description**: Module installation callback. Initializes a fresh budget for the specified agent.

**Logic walkthrough**:
1. ABI-decode `data` into `(address agent, uint256 maxPerRequest, uint256 dailyBudget, uint256 totalBudget, string[] memory domains)`.
2. Load storage reference: `X402Budget storage budget = _budgets[msg.sender][agent]`.
3. Set all budget fields:
   - `budget.maxPerRequest = maxPerRequest`
   - `budget.dailyBudget = dailyBudget`
   - `budget.totalBudget = totalBudget`
   - `budget.spent = 0` (fresh start)
   - `budget.dailySpent = 0` (fresh start)
   - `budget.lastReset = block.timestamp / 1 days`
   - `budget.allowedDomains = domains`

---

### `onUninstall`

```solidity
function onUninstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `address` of the agent |
| **Returns** | None |
| **Access Control** | Called by the smart account during module uninstallation |

**Description**: Deletes the entire budget for the specified agent.

**Logic**: `delete _budgets[msg.sender][agent]`.

---

### `configureAgent`

```solidity
function configureAgent(address agent, X402Budget memory budget) external
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `agent` -- the agent address; `budget` -- a full `X402Budget` struct with the desired configuration |
| **Returns** | None |
| **Access Control** | Any caller (`msg.sender` is treated as the account) |

**Description**: Creates or updates a budget for an agent. Unlike `onInstall`, this copies the `spent` and `dailySpent` values from the input struct, allowing the caller to preserve or override accumulated spending.

**Logic walkthrough**:
1. Load storage: `X402Budget storage stored = _budgets[msg.sender][agent]`.
2. Copy all fields from the memory struct:
   - `stored.maxPerRequest = budget.maxPerRequest`
   - `stored.dailyBudget = budget.dailyBudget`
   - `stored.totalBudget = budget.totalBudget`
   - `stored.spent = budget.spent`
   - `stored.dailySpent = budget.dailySpent`
   - `stored.lastReset = block.timestamp / 1 days`
   - `stored.allowedDomains = budget.allowedDomains`

**Note**: `lastReset` is always set to the current day, regardless of the input value.

---

### `preCheck`

```solidity
function preCheck(
    address,
    uint256,
    bytes calldata msgData
) external override returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | (unnamed `address`), (unnamed `uint256`), `msgData` -- ABI-encoded `(address agent, uint256 amount)` |
| **Returns** | `bytes memory` -- encoded `(agent, amount)` tuple passed to `postCheck` |
| **Access Control** | Called by the smart account before execution |

**Description**: Pre-execution budget enforcement for a single payment request.

**Logic walkthrough**:

1. **Short-circuit**: If `msgData.length < 64`, returns `abi.encode(address(0), uint256(0))` -- no enforcement.

2. **Decode**: `(address agent, uint256 amount) = abi.decode(msgData, (address, uint256))`.

3. **Load budget**: `X402Budget storage budget = _budgets[msg.sender][agent]`.

4. **Per-request cap**: `require(amount <= budget.maxPerRequest, "X402: exceeds max per request")`.

5. **Daily reset**: If `currentDay > budget.lastReset`, reset `dailySpent` to `0` and update `lastReset`.

6. **Daily budget check**: `require(budget.dailySpent + amount <= budget.dailyBudget, "X402: daily budget exceeded")`.

7. **Total budget check**: `require(budget.spent + amount <= budget.totalBudget, "X402: total budget exceeded")`.

8. **Update counters**:
   - `budget.dailySpent += amount`
   - `budget.spent += amount`

9. **Return**: `abi.encode(agent, amount)`.

**Revert conditions**:

| Condition | Revert Message |
|---|---|
| `amount > budget.maxPerRequest` | `"X402: exceeds max per request"` |
| `dailySpent + amount > dailyBudget` | `"X402: daily budget exceeded"` |
| `spent + amount > totalBudget` | `"X402: total budget exceeded"` |

---

### `postCheck`

```solidity
function postCheck(bytes calldata hookData) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `hookData` -- data returned by `preCheck`, encoded as `(address agent, uint256 amount)` |
| **Returns** | None |
| **Access Control** | Called by the smart account after execution |

**Description**: Decodes the hook data and emits `PaymentRecorded`.

**Logic**:
1. `(address agent, uint256 amount) = abi.decode(hookData, (address, uint256))`.
2. `emit PaymentRecorded(msg.sender, agent, amount)`.

---

### `getBudget`

```solidity
function getBudget(address account, address agent) external view returns (X402Budget memory)
```

| | |
|---|---|
| **Visibility** | `external view` |
| **Parameters** | `account` -- the smart-account address; `agent` -- the agent address |
| **Returns** | `X402Budget memory` -- the full budget struct |

**Description**: Read-only query that returns the complete budget state for an account-agent pair. Includes all configuration fields and the current spend counters.

---

### `getRemainingBudget`

```solidity
function getRemainingBudget(address account, address agent) external view returns (uint256)
```

| | |
|---|---|
| **Visibility** | `external view` |
| **Parameters** | `account` -- the smart-account address; `agent` -- the agent address |
| **Returns** | `uint256` -- remaining lifetime budget (0 if exhausted) |

**Description**: Convenience function that returns how much of the total budget remains.

**Logic**:
```solidity
if (budget.spent >= budget.totalBudget) return 0;
return budget.totalBudget - budget.spent;
```

**Note**: This does not account for daily budget constraints. An agent may have remaining total budget but have exhausted the daily allowance.

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
| `configureAgent` | Anyone | `msg.sender` is used as the account key |
| `getBudget` | Anyone | Read-only |
| `getRemainingBudget` | Anyone | Read-only |

---

## Budget Lifecycle

```
1. configureAgent()          2. preCheck() per request     3. Daily auto-reset
   or onInstall()
   +-----------+             +------------------+          +-----------------+
   | Set caps: |             | Check & enforce: |          | If new day:     |
   | - perReq  |   ------>   | - perReq cap     |          |   dailySpent=0  |
   | - daily   |             | - daily cap      |          |   lastReset=now |
   | - total   |             | - total cap      |          +-----------------+
   | - domains |             | Update counters  |
   +-----------+             +------------------+
                                     |
                                     v
                             4. postCheck()
                             +------------------+
                             | emit             |
                             | PaymentRecorded  |
                             +------------------+
```

---

## Domain Allowlist

The `allowedDomains` field stores an array of domain strings on-chain. In the current implementation, domain enforcement is the responsibility of the off-chain SDK or relayer -- the `preCheck` function enforces only the numeric budget constraints. The domain list serves as an on-chain source of truth that off-chain components can query via `getBudget()`.

Future versions may add on-chain domain verification by accepting a domain hash in the `msgData` and checking it against the stored list.

---

## SDK Interaction Example

```typescript
import { ethers } from "ethers";

const policy = new ethers.Contract(policyAddress, policyABI, signer);

// Configure an agent with a payment budget
await policy.configureAgent(agentAddress, {
  maxPerRequest: ethers.parseEther("0.01"),   // max 0.01 ETH per API call
  dailyBudget: ethers.parseEther("0.5"),      // max 0.5 ETH per day
  totalBudget: ethers.parseEther("10"),        // max 10 ETH lifetime
  spent: 0n,
  dailySpent: 0n,
  lastReset: 0n,
  allowedDomains: ["api.example.com", "data.provider.io"],
});

// Check remaining budget
const remaining = await policy.getRemainingBudget(accountAddress, agentAddress);
console.log("Remaining:", ethers.formatEther(remaining));

// Get full budget details
const budget = await policy.getBudget(accountAddress, agentAddress);
console.log("Daily spent:", ethers.formatEther(budget.dailySpent));
console.log("Total spent:", ethers.formatEther(budget.spent));
console.log("Domains:", budget.allowedDomains);
```

---

[Back to Overview](./README.md) | [Previous: SpendingLimitHook](./spending-limit-hook.md) | [Next: DeFiExecutor](./defi-executor.md)
