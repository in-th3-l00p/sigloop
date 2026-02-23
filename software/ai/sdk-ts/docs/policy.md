# Policy

[<- Back to README](./README.md) | [Previous: Agent](./agent.md) | [Next: x402 ->](./x402.md)

---

The policy module defines on-chain rules that constrain what an agent's session key can do. Policies are composed from individual rules -- spending limits, contract allowlists, function allowlists, time windows, and rate limits -- combined with AND/OR logic. Policies are ABI-encoded and enforced by the on-chain session key validator.

```typescript
import {
  // Spending limits
  createSpendingLimit,
  createEthSpendingLimit,
  createUsdcSpendingLimit,
  // Allowlists
  createContractAllowlist,
  createFunctionAllowlist,
  mergeContractAllowlists,
  mergeContractAndFunctionAllowlists,
  // Time windows
  createTimeWindow,
  createTimeWindowFromDuration,
  createTimeWindowFromHours,
  createTimeWindowFromDays,
  isTimeWindowActive,
  getTimeWindowRemaining,
  // Rate limits
  createRateLimit,
  createRateLimitPerMinute,
  createRateLimitPerHour,
  createRateLimitPerDay,
  RateLimitTracker,
  // Composition
  composePolicy,
  extendPolicy,
  intersectPolicies,
  unionPolicies,
  removeRulesByType,
  getRulesByType,
} from "@sigloop/sdk";
```

---

## Spending Limits

### `SpendingLimitParams`

```typescript
interface SpendingLimitParams {
  tokenAddress: Address;
  maxPerTransaction: bigint;
  maxDaily: bigint;
  maxWeekly: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tokenAddress` | `Address` | The ERC-20 token address, or `0xEeee...eEEeE` for native ETH |
| `maxPerTransaction` | `bigint` | Maximum amount per single transaction |
| `maxDaily` | `bigint` | Maximum cumulative amount per 24-hour period |
| `maxWeekly` | `bigint` | Maximum cumulative amount per 7-day period |

---

### `createSpendingLimit`

Creates a spending limit policy rule for a specific token.

```typescript
function createSpendingLimit(params: SpendingLimitParams): SpendingLimit
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `SpendingLimitParams` | The spending limit configuration |

**Returns:** [`SpendingLimit`](./types.md#spendinglimit) -- A spending limit rule.

**Throws:**
- If `tokenAddress` is not a valid address
- If any amount is negative
- If `maxPerTransaction > maxDaily`
- If `maxDaily > maxWeekly`

**Example:**

```typescript
import { createSpendingLimit } from "@sigloop/sdk";

const limit = createSpendingLimit({
  tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  maxPerTransaction: 100_000000n,   // 100 USDC
  maxDaily: 500_000000n,            // 500 USDC
  maxWeekly: 2000_000000n,          // 2000 USDC
});
```

---

### `createEthSpendingLimit`

Convenience function that creates a spending limit for native ETH using the sentinel address `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`.

```typescript
function createEthSpendingLimit(
  maxPerTransaction: bigint,
  maxDaily: bigint,
  maxWeekly: bigint
): SpendingLimit
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `maxPerTransaction` | `bigint` | Max ETH per transaction (in wei) |
| `maxDaily` | `bigint` | Max ETH per day (in wei) |
| `maxWeekly` | `bigint` | Max ETH per week (in wei) |

**Returns:** [`SpendingLimit`](./types.md#spendinglimit)

**Example:**

```typescript
import { createEthSpendingLimit } from "@sigloop/sdk";

const ethLimit = createEthSpendingLimit(
  100000000000000000n,   // 0.1 ETH per tx
  500000000000000000n,   // 0.5 ETH per day
  2000000000000000000n   // 2 ETH per week
);
```

---

### `createUsdcSpendingLimit`

Convenience function that creates a spending limit for USDC given a chain-specific USDC address.

```typescript
function createUsdcSpendingLimit(
  maxPerTransaction: bigint,
  maxDaily: bigint,
  maxWeekly: bigint,
  chainUsdcAddress: Address
): SpendingLimit
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `maxPerTransaction` | `bigint` | Max USDC per transaction |
| `maxDaily` | `bigint` | Max USDC per day |
| `maxWeekly` | `bigint` | Max USDC per week |
| `chainUsdcAddress` | `Address` | The USDC contract address on the target chain |

**Returns:** [`SpendingLimit`](./types.md#spendinglimit)

**Example:**

```typescript
import { createUsdcSpendingLimit } from "@sigloop/sdk";

const usdcLimit = createUsdcSpendingLimit(
  100_000000n,
  500_000000n,
  2000_000000n,
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
);
```

---

## Allowlists

### `createContractAllowlist`

Creates a rule that restricts the agent to only interact with specific contract addresses. Addresses are deduplicated (case-insensitive).

```typescript
function createContractAllowlist(addresses: Address[]): ContractAllowlist
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `addresses` | `Address[]` | Array of allowed contract addresses |

**Returns:** [`ContractAllowlist`](./types.md#contractallowlist)

**Throws:**
- If `addresses` is empty
- If any address is invalid

**Example:**

```typescript
import { createContractAllowlist } from "@sigloop/sdk";

const allowlist = createContractAllowlist([
  "0x2626664c2603336E57B271c5C0b26F421741e481", // Uniswap router
  "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5", // Aave pool
]);
```

---

### `createFunctionAllowlist`

Creates a rule that restricts the agent to calling only specific functions on a given contract. Accepts either 4-byte hex selectors or human-readable function signatures (which are converted to selectors automatically).

```typescript
function createFunctionAllowlist(
  contract: Address,
  signatures: string[]
): FunctionAllowlist
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `contract` | `Address` | The contract address |
| `signatures` | `string[]` | Array of function signatures or 4-byte selectors |

**Returns:** [`FunctionAllowlist`](./types.md#functionallowlist)

**Throws:**
- If `contract` is not a valid address
- If `signatures` is empty

**Example:**

```typescript
import { createFunctionAllowlist } from "@sigloop/sdk";

const fnAllowlist = createFunctionAllowlist(
  "0x2626664c2603336E57B271c5C0b26F421741e481",
  [
    "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
    "0x5ae401dc", // raw selector also works
  ]
);
```

---

### `mergeContractAllowlists`

Merges multiple contract allowlists into one, deduplicating addresses.

```typescript
function mergeContractAllowlists(...allowlists: ContractAllowlist[]): ContractAllowlist
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `...allowlists` | `ContractAllowlist[]` | Two or more allowlists to merge |

**Returns:** [`ContractAllowlist`](./types.md#contractallowlist)

**Example:**

```typescript
import { createContractAllowlist, mergeContractAllowlists } from "@sigloop/sdk";

const defi = createContractAllowlist(["0xUniswap...", "0xAave..."]);
const bridges = createContractAllowlist(["0xBridge..."]);
const merged = mergeContractAllowlists(defi, bridges);
```

---

### `mergeContractAndFunctionAllowlists`

Combines a contract allowlist with function allowlists, merging the contracts from both.

```typescript
function mergeContractAndFunctionAllowlists(
  contracts: ContractAllowlist,
  functions: FunctionAllowlist[]
): { contracts: ContractAllowlist; functions: FunctionAllowlist[] }
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `contracts` | `ContractAllowlist` | A contract allowlist |
| `functions` | `FunctionAllowlist[]` | Array of function allowlists |

**Returns:** An object with the merged `contracts` allowlist and the original `functions` array.

**Example:**

```typescript
import {
  createContractAllowlist,
  createFunctionAllowlist,
  mergeContractAndFunctionAllowlists,
} from "@sigloop/sdk";

const contracts = createContractAllowlist(["0xRouter..."]);
const fns = [createFunctionAllowlist("0xPool...", ["function supply(address,uint256,address,uint16)"])];

const merged = mergeContractAndFunctionAllowlists(contracts, fns);
// merged.contracts includes both 0xRouter and 0xPool
```

---

## Time Windows

### `createTimeWindow`

Creates a time window rule from explicit Unix timestamps.

```typescript
function createTimeWindow(validAfter: number, validUntil: number): TimeWindow
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `validAfter` | `number` | Unix timestamp (seconds) when the window opens |
| `validUntil` | `number` | Unix timestamp (seconds) when the window closes |

**Returns:** [`TimeWindow`](./types.md#timewindow)

**Throws:**
- If `validAfter >= validUntil`
- If `validUntil` is in the past

**Example:**

```typescript
import { createTimeWindow } from "@sigloop/sdk";

const now = Math.floor(Date.now() / 1000);
const window = createTimeWindow(now, now + 86400); // next 24 hours
```

---

### `createTimeWindowFromDuration`

Creates a time window starting now with the given duration in seconds.

```typescript
function createTimeWindowFromDuration(durationSeconds: number): TimeWindow
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `durationSeconds` | `number` | Duration in seconds |

**Returns:** [`TimeWindow`](./types.md#timewindow)

**Throws:** If `durationSeconds` is not positive.

---

### `createTimeWindowFromHours`

Creates a time window starting now with the given duration in hours.

```typescript
function createTimeWindowFromHours(hours: number): TimeWindow
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `hours` | `number` | Duration in hours |

**Returns:** [`TimeWindow`](./types.md#timewindow)

**Example:**

```typescript
import { createTimeWindowFromHours } from "@sigloop/sdk";

const window = createTimeWindowFromHours(8); // valid for 8 hours
```

---

### `createTimeWindowFromDays`

Creates a time window starting now with the given duration in days.

```typescript
function createTimeWindowFromDays(days: number): TimeWindow
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `days` | `number` | Duration in days |

**Returns:** [`TimeWindow`](./types.md#timewindow)

**Example:**

```typescript
import { createTimeWindowFromDays } from "@sigloop/sdk";

const window = createTimeWindowFromDays(30); // valid for 30 days
```

---

### `isTimeWindowActive`

Checks whether the current time falls within the time window.

```typescript
function isTimeWindowActive(window: TimeWindow): boolean
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `window` | [`TimeWindow`](./types.md#timewindow) | The time window to check |

**Returns:** `boolean` -- `true` if `validAfter <= now < validUntil`.

---

### `getTimeWindowRemaining`

Returns the number of seconds remaining in the time window.

```typescript
function getTimeWindowRemaining(window: TimeWindow): number
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `window` | [`TimeWindow`](./types.md#timewindow) | The time window to check |

**Returns:** `number` -- Remaining seconds. Returns `0` if expired. If the window has not started yet, returns the full duration.

---

## Rate Limits

### `createRateLimit`

Creates a rate limit rule restricting the number of calls within an interval.

```typescript
function createRateLimit(maxCalls: number, intervalSeconds: number): RateLimit
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `maxCalls` | `number` | Maximum number of calls allowed |
| `intervalSeconds` | `number` | The rolling window in seconds |

**Returns:** [`RateLimit`](./types.md#ratelimit)

**Throws:**
- If `maxCalls` is not a positive integer
- If `intervalSeconds` is not a positive integer

**Example:**

```typescript
import { createRateLimit } from "@sigloop/sdk";

const limit = createRateLimit(100, 3600); // 100 calls per hour
```

---

### `createRateLimitPerMinute`

Shorthand for `createRateLimit(maxCalls, 60)`.

```typescript
function createRateLimitPerMinute(maxCalls: number): RateLimit
```

---

### `createRateLimitPerHour`

Shorthand for `createRateLimit(maxCalls, 3600)`.

```typescript
function createRateLimitPerHour(maxCalls: number): RateLimit
```

---

### `createRateLimitPerDay`

Shorthand for `createRateLimit(maxCalls, 86400)`.

```typescript
function createRateLimitPerDay(maxCalls: number): RateLimit
```

**Example:**

```typescript
import { createRateLimitPerMinute, createRateLimitPerHour, createRateLimitPerDay } from "@sigloop/sdk";

const perMin = createRateLimitPerMinute(5);
const perHour = createRateLimitPerHour(50);
const perDay = createRateLimitPerDay(200);
```

---

### `RateLimitTracker` (class)

A client-side rate limit tracker that maintains a sliding window of call timestamps. Useful for enforcing rate limits locally before submitting transactions.

```typescript
class RateLimitTracker {
  constructor(rateLimit: RateLimit)
  canProceed(): boolean
  recordCall(): void
  remainingCalls(): number
  nextAvailableTime(): number | null
  reset(): void
}
```

**Constructor:**

| Name | Type | Description |
|------|------|-------------|
| `rateLimit` | [`RateLimit`](./types.md#ratelimit) | The rate limit configuration |

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `canProceed()` | `boolean` | Returns `true` if another call is allowed within the current window |
| `recordCall()` | `void` | Records a call. Throws `"Rate limit exceeded"` if the limit is reached |
| `remainingCalls()` | `number` | Returns the number of remaining calls in the current window |
| `nextAvailableTime()` | `number \| null` | Returns the timestamp (ms) when the next call will be allowed, or `null` if one is available now |
| `reset()` | `void` | Clears all recorded calls |

**Example:**

```typescript
import { createRateLimitPerMinute, RateLimitTracker } from "@sigloop/sdk";

const limit = createRateLimitPerMinute(3);
const tracker = new RateLimitTracker(limit);

if (tracker.canProceed()) {
  tracker.recordCall();
  console.log("Remaining:", tracker.remainingCalls()); // 2
}

// When limit is reached:
const nextTime = tracker.nextAvailableTime();
if (nextTime) {
  console.log("Retry after:", new Date(nextTime));
}

tracker.reset(); // clear history
```

---

## Policy Composition

### `composePolicy`

Composes an array of policy rules into a complete `Policy` with an AND or OR operator. The policy is validated and ABI-encoded.

```typescript
function composePolicy(
  rules: PolicyRule[],
  operator?: "AND" | "OR"
): Policy
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `rules` | `PolicyRule[]` | -- | Array of policy rules to compose |
| `operator` | `"AND" \| "OR"` | `"AND"` | Logical operator for combining rules |

**Returns:** [`Policy`](./types.md#policy) -- A fully composed policy with a computed ID and encoded representation.

**Throws:** If `rules` is empty.

**Example:**

```typescript
import {
  composePolicy,
  createEthSpendingLimit,
  createContractAllowlist,
  createTimeWindowFromDays,
  createRateLimitPerHour,
} from "@sigloop/sdk";

const policy = composePolicy([
  createEthSpendingLimit(100000000000000000n, 500000000000000000n, 2000000000000000000n),
  createContractAllowlist(["0xRouter..."]),
  createTimeWindowFromDays(7),
  createRateLimitPerHour(20),
], "AND");

console.log("Policy ID:", policy.id);
console.log("Rule count:", policy.rules.length);
console.log("Operator:", policy.composition.operator);
console.log("Encoded:", policy.encoded);
```

---

### `extendPolicy`

Adds rules to an existing policy, preserving the original operator unless overridden.

```typescript
function extendPolicy(
  existing: Policy,
  additionalRules: PolicyRule[],
  operator?: "AND" | "OR"
): Policy
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `existing` | [`Policy`](./types.md#policy) | The policy to extend |
| `additionalRules` | `PolicyRule[]` | New rules to add |
| `operator` | `"AND" \| "OR"` | Optional operator override. Defaults to the existing policy's operator |

**Returns:** [`Policy`](./types.md#policy) -- A new policy with the combined rules.

**Example:**

```typescript
import { composePolicy, extendPolicy, createRateLimitPerDay, createEthSpendingLimit } from "@sigloop/sdk";

const base = composePolicy([
  createEthSpendingLimit(100000000000000000n, 500000000000000000n, 2000000000000000000n),
]);

const extended = extendPolicy(base, [createRateLimitPerDay(100)]);
```

---

### `intersectPolicies`

Combines two policies using the AND operator so all rules must be satisfied.

```typescript
function intersectPolicies(a: Policy, b: Policy): Policy
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `a` | [`Policy`](./types.md#policy) | First policy |
| `b` | [`Policy`](./types.md#policy) | Second policy |

**Returns:** [`Policy`](./types.md#policy) -- A new AND-composed policy with all rules from both inputs.

---

### `unionPolicies`

Combines two policies using the OR operator so any rule can be satisfied.

```typescript
function unionPolicies(a: Policy, b: Policy): Policy
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `a` | [`Policy`](./types.md#policy) | First policy |
| `b` | [`Policy`](./types.md#policy) | Second policy |

**Returns:** [`Policy`](./types.md#policy) -- A new OR-composed policy with all rules from both inputs.

---

### `removeRulesByType`

Removes all rules of a specific type from a policy.

```typescript
function removeRulesByType(
  policy: Policy,
  ruleType: PolicyRule["type"]
): Policy
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `policy` | [`Policy`](./types.md#policy) | The policy to modify |
| `ruleType` | `"spending" \| "contract-allowlist" \| "function-allowlist" \| "time-window" \| "rate-limit"` | The rule type to remove |

**Returns:** [`Policy`](./types.md#policy) -- A new policy without the specified rule type.

**Throws:** If removing all rules would leave the policy empty.

**Example:**

```typescript
import { composePolicy, removeRulesByType, createEthSpendingLimit, createRateLimitPerHour } from "@sigloop/sdk";

const policy = composePolicy([
  createEthSpendingLimit(100000000000000000n, 500000000000000000n, 2000000000000000000n),
  createRateLimitPerHour(10),
]);

const withoutRateLimit = removeRulesByType(policy, "rate-limit");
```

---

### `getRulesByType`

Extracts all rules of a specific type from a policy.

```typescript
function getRulesByType<T extends PolicyRule["type"]>(
  policy: Policy,
  ruleType: T
): Extract<PolicyRule, { type: T }>[]
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `policy` | [`Policy`](./types.md#policy) | The policy to query |
| `ruleType` | `T` | The rule type to filter by |

**Returns:** An array of rules matching the specified type, properly narrowed.

**Example:**

```typescript
import { composePolicy, getRulesByType, createEthSpendingLimit, createRateLimitPerHour } from "@sigloop/sdk";

const policy = composePolicy([
  createEthSpendingLimit(100000000000000000n, 500000000000000000n, 2000000000000000000n),
  createRateLimitPerHour(10),
]);

const spendingRules = getRulesByType(policy, "spending");
// spendingRules is typed as SpendingLimit[]
console.log(spendingRules[0].maxDaily); // 500000000000000000n
```

---

[<- Back to README](./README.md) | [Previous: Agent](./agent.md) | [Next: x402 ->](./x402.md)
