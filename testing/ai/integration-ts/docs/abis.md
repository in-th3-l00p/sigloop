# ABI Definitions

[Back to README](./README.md) | [Previous: Deployment](./deployment.md) | [Next: Helpers](./helpers.md)

---

Each contract's ABI is defined as a TypeScript `as const` array in the `src/abis/` directory. These are used with viem's `readContract`, `writeContract`, and `simulateContract` methods throughout the tests.

---

## Table of Contents

- [AgentPermissionValidator](#agentpermissionvalidator)
- [SpendingLimitHook](#spendinglimithook)
- [X402PaymentPolicy](#x402paymentpolicy)
- [DeFiExecutor](#defiexecutor)

---

## AgentPermissionValidator

**File:** `src/abis/AgentPermissionValidator.ts`

**Module type:** Validator (1)

### Structs

#### `AgentPolicy`

| Field | Type | Description |
|---|---|---|
| `allowedTargets` | `address[]` | Contract addresses the agent is permitted to call |
| `allowedSelectors` | `bytes4[]` | Function selectors the agent is permitted to invoke |
| `maxAmountPerTx` | `uint256` | Maximum value (wei) per single transaction |
| `dailyLimit` | `uint256` | Maximum total value (wei) per day |
| `weeklyLimit` | `uint256` | Maximum total value (wei) per week |
| `validAfter` | `uint48` | Unix timestamp after which the policy is valid (0 = no restriction) |
| `validUntil` | `uint48` | Unix timestamp until which the policy is valid (0 = no expiry) |
| `active` | `bool` | Whether the policy is currently active |

#### `PackedUserOperation`

| Field | Type |
|---|---|
| `sender` | `address` |
| `nonce` | `uint256` |
| `initCode` | `bytes` |
| `callData` | `bytes` |
| `accountGasLimits` | `bytes32` |
| `preVerificationGas` | `uint256` |
| `gasFees` | `bytes32` |
| `paymasterAndData` | `bytes` |
| `signature` | `bytes` |

### Functions

| Function | Mutability | Inputs | Outputs | Description |
|---|---|---|---|---|
| `onInstall(bytes data)` | nonpayable | Installation data | -- | Module lifecycle: called when module is installed on an account |
| `onUninstall(bytes data)` | nonpayable | Uninstall data | -- | Module lifecycle: called when module is removed from an account |
| `addAgent(address agent, AgentPolicy policy)` | nonpayable | Agent address, policy struct | -- | Register an agent with a specific permission policy |
| `removeAgent(address agent)` | nonpayable | Agent address | -- | Deactivate and remove an agent's policy |
| `getPolicy(address account, address agent)` | view | Account owner, agent | `AgentPolicy` | Read the stored policy for a given account-agent pair |
| `validateUserOp(PackedUserOperation userOp, bytes32 userOpHash)` | nonpayable | UserOp struct, hash | `uint256` | Validate a UserOp signature. Returns `0` for valid, `1` for invalid |
| `isModuleType(uint256 typeId)` | pure | Module type ID | `bool` | Returns `true` if `typeId === 1` (Validator) |

### Usage Example

```typescript
import { AgentPermissionValidatorAbi } from "../abis/AgentPermissionValidator.js";

// Add an agent
await ownerClient.writeContract({
  address: contracts.agentPermissionValidator,
  abi: AgentPermissionValidatorAbi,
  functionName: "addAgent",
  args: [agentAddress, {
    allowedTargets: [],
    allowedSelectors: [],
    maxAmountPerTx: 1000000000000000000n,
    dailyLimit: 5000000000000000000n,
    weeklyLimit: 20000000000000000000n,
    validAfter: 0,
    validUntil: 0,
    active: true,
  }],
});

// Read a policy
const policy = await publicClient.readContract({
  address: contracts.agentPermissionValidator,
  abi: AgentPermissionValidatorAbi,
  functionName: "getPolicy",
  args: [ownerAddress, agentAddress],
});
```

---

## SpendingLimitHook

**File:** `src/abis/SpendingLimitHook.ts`

**Module type:** Hook (4)

### Structs

#### `SpendingRecord`

| Field | Type | Description |
|---|---|---|
| `dailySpent` | `uint256` | Amount spent in the current daily period |
| `weeklySpent` | `uint256` | Amount spent in the current weekly period |
| `lastDailyReset` | `uint256` | Timestamp of last daily counter reset |
| `lastWeeklyReset` | `uint256` | Timestamp of last weekly counter reset |

### Functions

| Function | Mutability | Inputs | Outputs | Description |
|---|---|---|---|---|
| `onInstall(bytes data)` | nonpayable | Installation data | -- | Module lifecycle hook |
| `onUninstall(bytes data)` | nonpayable | Uninstall data | -- | Module lifecycle hook |
| `setLimits(address agent, address token, uint256 dailyLimit, uint256 weeklyLimit)` | nonpayable | Agent, token, limits | -- | Set spending caps for a specific agent-token pair |
| `getSpending(address account, address agent, address token)` | view | Account, agent, token | `SpendingRecord` | Read current spending state |
| `resetSpending(address agent, address token)` | nonpayable | Agent, token | -- | Reset spending counters to zero |
| `preCheck(address msgSender, uint256, bytes msgData)` | nonpayable | Sender, value, encoded data | `bytes` | Hook called before execution; records and validates spending |
| `postCheck(bytes hookData)` | nonpayable | Data from preCheck | -- | Hook called after execution; emits events |
| `isModuleType(uint256 typeId)` | pure | Module type ID | `bool` | Returns `true` if `typeId === 4` (Hook) |

### Events

| Event | Parameters | Description |
|---|---|---|
| `SpendingRecorded` | `account` (indexed), `agent` (indexed), `token` (indexed), `amount` | Emitted when spending is recorded |

### Usage Example

```typescript
import { SpendingLimitHookAbi } from "../abis/SpendingLimitHook.js";

// Set daily/weekly limits
await ownerClient.writeContract({
  address: contracts.spendingLimitHook,
  abi: SpendingLimitHookAbi,
  functionName: "setLimits",
  args: [agentAddress, tokenAddress, 10000000n, 50000000n],
});

// Check current spending
const spending = await publicClient.readContract({
  address: contracts.spendingLimitHook,
  abi: SpendingLimitHookAbi,
  functionName: "getSpending",
  args: [ownerAddress, agentAddress, tokenAddress],
});
// spending.dailySpent, spending.weeklySpent, etc.
```

---

## X402PaymentPolicy

**File:** `src/abis/X402PaymentPolicy.ts`

**Module type:** Hook (4)

### Structs

#### `X402Budget`

| Field | Type | Description |
|---|---|---|
| `maxPerRequest` | `uint256` | Maximum payment per single HTTP request |
| `dailyBudget` | `uint256` | Maximum total daily spending |
| `totalBudget` | `uint256` | Absolute lifetime budget cap |
| `spent` | `uint256` | Cumulative total spent |
| `dailySpent` | `uint256` | Amount spent in the current daily period |
| `lastReset` | `uint256` | Timestamp of last daily counter reset |
| `allowedDomains` | `string[]` | Domain allow-list for x402 endpoints |

### Functions

| Function | Mutability | Inputs | Outputs | Description |
|---|---|---|---|---|
| `onInstall(bytes data)` | nonpayable | Installation data | -- | Module lifecycle hook |
| `onUninstall(bytes data)` | nonpayable | Uninstall data | -- | Module lifecycle hook |
| `configureAgent(address agent, X402Budget budget)` | nonpayable | Agent, budget struct | -- | Set the x402 payment budget for an agent |
| `getBudget(address account, address agent)` | view | Account, agent | `X402Budget` | Read the stored budget |
| `getRemainingBudget(address account, address agent)` | view | Account, agent | `uint256` | Returns `totalBudget - spent` |
| `preCheck(address, uint256, bytes msgData)` | nonpayable | Sender, value, encoded data | `bytes` | Validates and records a payment against the budget |
| `postCheck(bytes hookData)` | nonpayable | Hook data | -- | Post-execution hook; emits events |
| `isModuleType(uint256 typeId)` | pure | Module type ID | `bool` | Returns `true` if `typeId === 4` (Hook) |

### Events

| Event | Parameters | Description |
|---|---|---|
| `PaymentRecorded` | `account` (indexed), `agent` (indexed), `amount` | Emitted when a payment is recorded |

### Usage Example

```typescript
import { X402PaymentPolicyAbi } from "../abis/X402PaymentPolicy.js";

// Configure an agent's x402 budget
await ownerClient.writeContract({
  address: contracts.x402PaymentPolicy,
  abi: X402PaymentPolicyAbi,
  functionName: "configureAgent",
  args: [agentAddress, {
    maxPerRequest: 2000000n,
    dailyBudget: 10000000n,
    totalBudget: 50000000n,
    spent: 0n,
    dailySpent: 0n,
    lastReset: 0n,
    allowedDomains: ["api.example.com"],
  }],
});

// Check remaining budget
const remaining = await publicClient.readContract({
  address: contracts.x402PaymentPolicy,
  abi: X402PaymentPolicyAbi,
  functionName: "getRemainingBudget",
  args: [ownerAddress, agentAddress],
});
```

---

## DeFiExecutor

**File:** `src/abis/DeFiExecutor.ts`

**Module type:** Executor (2)

### Functions

| Function | Mutability | Inputs | Outputs | Description |
|---|---|---|---|---|
| `onInstall(bytes data)` | nonpayable | Installation data | -- | Module lifecycle hook |
| `onUninstall(bytes data)` | nonpayable | Uninstall data | -- | Module lifecycle hook |
| `executeFromExecutor(address, bytes data)` | nonpayable | Caller address, encoded action data | `bytes` | Execute a DeFi action; reverts on zero-address target |
| `encodeSwap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut)` | pure | Swap parameters | `bytes` | Encode a DEX swap action |
| `encodeLending(address pool, address asset, uint256 amount, bool isSupply)` | pure | Lending parameters | `bytes` | Encode a lending supply or borrow action |
| `isModuleType(uint256 typeId)` | pure | Module type ID | `bool` | Returns `true` if `typeId === 2` (Executor) |

### DeFiAction Tuple (used in tests)

The `executeFromExecutor` function expects its `data` parameter to be an ABI-encoded tuple:

```typescript
const defiActionAbiParams = [
  {
    type: "tuple",
    components: [
      { name: "actionType", type: "uint8" },   // 0 = generic, etc.
      { name: "target", type: "address" },      // Target contract address
      { name: "data", type: "bytes" },          // Calldata for the target
      { name: "value", type: "uint256" },       // ETH value to send
    ],
  },
] as const;
```

### Usage Example

```typescript
import { DeFiExecutorAbi } from "../abis/DeFiExecutor.js";

// Encode a swap
const swapData = await publicClient.readContract({
  address: contracts.deFiExecutor,
  abi: DeFiExecutorAbi,
  functionName: "encodeSwap",
  args: [routerAddr, tokenInAddr, tokenOutAddr, 1000000n, 950000n],
});

// Execute an action
const actionData = encodeAbiParameters(defiActionAbiParams, [{
  actionType: 0,
  target: targetAddress,
  data: innerCallData,
  value: 0n,
}]);

const result = await publicClient.simulateContract({
  address: contracts.deFiExecutor,
  abi: DeFiExecutorAbi,
  functionName: "executeFromExecutor",
  args: [callerAddress, actionData],
  account: callerAddress,
});
```

---

## Module Type Reference

| Type ID | Module Kind | Contract |
|---|---|---|
| 1 | Validator | AgentPermissionValidator |
| 2 | Executor | DeFiExecutor |
| 4 | Hook | SpendingLimitHook, X402PaymentPolicy |

---

[Back to README](./README.md) | [Previous: Deployment](./deployment.md) | [Next: Helpers](./helpers.md)
