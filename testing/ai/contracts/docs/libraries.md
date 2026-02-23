# Libraries

[Back to Overview](./README.md) | [Previous: Interfaces](./interfaces.md) | [Next: AgentPermissionValidator](./agent-permission-validator.md)

---

Sigloop includes two internal Solidity libraries that are consumed by the module contracts via `using ... for` directives.

- **`PolicyLib`** -- ABI encoding/decoding and time-window validation for [`AgentPolicy`](./interfaces.md#agentpolicy-struct).
- **`SpendingLib`** -- Rolling daily/weekly spending accounting with automatic period resets.

---

## PolicyLib

**File**: `src/libraries/PolicyLib.sol`

**Used by**: [`AgentPermissionValidator`](./agent-permission-validator.md) (via `using PolicyLib for AgentPolicy`)

### Purpose

`PolicyLib` provides three helper functions for working with the `AgentPolicy` struct:

1. ABI-encode a policy into `bytes` for storage or transmission.
2. ABI-decode `bytes` back into an `AgentPolicy`.
3. Check whether a policy is currently active (master switch + time window).

### Full Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AgentPolicy} from "../interfaces/IAgentPermission.sol";

library PolicyLib {
    function encodePolicy(AgentPolicy memory policy) internal pure returns (bytes memory) {
        return abi.encode(policy);
    }

    function decodePolicy(bytes memory data) internal pure returns (AgentPolicy memory) {
        return abi.decode(data, (AgentPolicy));
    }

    function isPolicyActive(AgentPolicy memory policy) internal view returns (bool) {
        if (!policy.active) return false;
        if (policy.validAfter > 0 && block.timestamp < policy.validAfter) return false;
        if (policy.validUntil > 0 && block.timestamp > policy.validUntil) return false;
        return true;
    }
}
```

### Functions

#### `encodePolicy`

```solidity
function encodePolicy(AgentPolicy memory policy) internal pure returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `internal pure` |
| **Parameters** | `policy` -- an `AgentPolicy` struct in memory |
| **Returns** | ABI-encoded `bytes` representation of the policy |

**Description**: Encodes an `AgentPolicy` struct into its ABI `bytes` form using `abi.encode`. Useful for passing a policy as opaque `bytes` data (e.g. in `onInstall` calldata).

---

#### `decodePolicy`

```solidity
function decodePolicy(bytes memory data) internal pure returns (AgentPolicy memory)
```

| | |
|---|---|
| **Visibility** | `internal pure` |
| **Parameters** | `data` -- ABI-encoded `bytes` previously produced by `encodePolicy` |
| **Returns** | The decoded `AgentPolicy` struct |

**Description**: Decodes ABI-encoded bytes back into an `AgentPolicy` struct. Reverts if the data does not conform to the expected layout.

---

#### `isPolicyActive`

```solidity
function isPolicyActive(AgentPolicy memory policy) internal view returns (bool)
```

| | |
|---|---|
| **Visibility** | `internal view` (reads `block.timestamp`) |
| **Parameters** | `policy` -- an `AgentPolicy` struct in memory |
| **Returns** | `true` if the policy is currently active, `false` otherwise |

**Description**: Performs three checks in order:

1. **Active flag** -- if `policy.active` is `false`, returns `false` immediately.
2. **validAfter** -- if `policy.validAfter > 0` and `block.timestamp < policy.validAfter`, the policy is not yet active. Returns `false`.
3. **validUntil** -- if `policy.validUntil > 0` and `block.timestamp > policy.validUntil`, the policy has expired. Returns `false`.

If all checks pass, returns `true`.

**Edge cases**:
- When `validAfter == 0`, the "not yet active" check is skipped (no start-time constraint).
- When `validUntil == 0`, the "expired" check is skipped (no end-time constraint).
- Both can be `0` to create a policy with no time bounds.

---

## SpendingLib

**File**: `src/libraries/SpendingLib.sol`

**Used by**: [`SpendingLimitHook`](./spending-limit-hook.md) (via `using SpendingLib for SpendingRecord`)

### Purpose

`SpendingLib` implements a rolling daily and weekly spending tracker. It automatically resets counters when a new day or week begins, then validates that a proposed spend does not exceed the configured limits.

### `SpendingRecord` Struct

```solidity
struct SpendingRecord {
    uint256 dailySpent;
    uint256 weeklySpent;
    uint256 lastDailyReset;
    uint256 lastWeeklyReset;
}
```

| Field | Type | Description |
|---|---|---|
| `dailySpent` | `uint256` | Running total of spending in the current day period |
| `weeklySpent` | `uint256` | Running total of spending in the current week period |
| `lastDailyReset` | `uint256` | The "day number" (`block.timestamp / 1 days`) when `dailySpent` was last reset |
| `lastWeeklyReset` | `uint256` | The "week number" (`block.timestamp / 1 weeks`) when `weeklySpent` was last reset |

### Full Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

struct SpendingRecord {
    uint256 dailySpent;
    uint256 weeklySpent;
    uint256 lastDailyReset;
    uint256 lastWeeklyReset;
}

library SpendingLib {
    function checkAndUpdateSpending(
        SpendingRecord storage record,
        uint256 amount,
        uint256 dailyLimit,
        uint256 weeklyLimit
    ) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / 1 weeks;

        if (currentDay > record.lastDailyReset) {
            record.dailySpent = 0;
            record.lastDailyReset = currentDay;
        }

        if (currentWeek > record.lastWeeklyReset) {
            record.weeklySpent = 0;
            record.lastWeeklyReset = currentWeek;
        }

        require(record.dailySpent + amount <= dailyLimit, "SpendingLib: daily limit exceeded");
        require(record.weeklySpent + amount <= weeklyLimit, "SpendingLib: weekly limit exceeded");

        record.dailySpent += amount;
        record.weeklySpent += amount;
    }
}
```

### Functions

#### `checkAndUpdateSpending`

```solidity
function checkAndUpdateSpending(
    SpendingRecord storage record,
    uint256 amount,
    uint256 dailyLimit,
    uint256 weeklyLimit
) internal
```

| | |
|---|---|
| **Visibility** | `internal` (mutates storage) |
| **Parameters** | `record` -- storage pointer to the `SpendingRecord` for this account/agent/token triple |
| | `amount` -- the amount being spent in this transaction |
| | `dailyLimit` -- the maximum allowed daily spending |
| | `weeklyLimit` -- the maximum allowed weekly spending |
| **Returns** | None (reverts on limit violation) |

**Description**: The core spending-enforcement function. It performs the following steps:

1. **Compute current periods**:
   - `currentDay = block.timestamp / 1 days` (integer division floors to a day number since epoch)
   - `currentWeek = block.timestamp / 1 weeks` (integer division floors to a week number since epoch)

2. **Daily reset check**: If `currentDay > record.lastDailyReset`, a new day has started. Resets `dailySpent` to `0` and updates `lastDailyReset`.

3. **Weekly reset check**: If `currentWeek > record.lastWeeklyReset`, a new week has started. Resets `weeklySpent` to `0` and updates `lastWeeklyReset`.

4. **Limit enforcement**:
   - Reverts with `"SpendingLib: daily limit exceeded"` if `dailySpent + amount > dailyLimit`.
   - Reverts with `"SpendingLib: weekly limit exceeded"` if `weeklySpent + amount > weeklyLimit`.

5. **Update totals**: Increments both `dailySpent` and `weeklySpent` by `amount`.

**Revert conditions**:

| Condition | Revert Message |
|---|---|
| `dailySpent + amount > dailyLimit` | `"SpendingLib: daily limit exceeded"` |
| `weeklySpent + amount > weeklyLimit` | `"SpendingLib: weekly limit exceeded"` |

**Important notes**:
- Days are defined as 86400-second periods aligned to the Unix epoch (UTC midnight).
- Weeks are defined as 604800-second periods aligned to the Unix epoch (Thursday 00:00 UTC).
- The function uses `storage` pointer semantics, so all mutations persist on-chain.
- There is no overflow protection beyond Solidity 0.8's built-in checked arithmetic.

---

[Back to Overview](./README.md) | [Previous: Interfaces](./interfaces.md) | [Next: AgentPermissionValidator](./agent-permission-validator.md)
