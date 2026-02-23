# Interfaces

[Back to Overview](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Libraries](./libraries.md)

---

This page documents the two interface files that define the contract-level ABIs and data structures used throughout the Sigloop module system.

- **`IERC7579Module.sol`** -- Standard ERC-7579 module interfaces and the ERC-4337 `PackedUserOperation` struct.
- **`IAgentPermission.sol`** -- The `AgentPolicy` struct that encodes scoped permissions for a delegated agent.

---

## `IERC7579Module.sol`

**File**: `src/interfaces/IERC7579Module.sol`

This file defines the three ERC-7579 module interfaces and the ERC-4337 `PackedUserOperation` struct used by the validator.

### `PackedUserOperation` Struct

The packed representation of an ERC-4337 user operation, passed into `validateUserOp`.

```solidity
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}
```

| Field | Type | Description |
|---|---|---|
| `sender` | `address` | The smart account originating the operation |
| `nonce` | `uint256` | Anti-replay nonce |
| `initCode` | `bytes` | Factory + init data for first-time account deployment (empty if account exists) |
| `callData` | `bytes` | The encoded call the account will execute |
| `accountGasLimits` | `bytes32` | Packed `verificationGasLimit` and `callGasLimit` |
| `preVerificationGas` | `uint256` | Gas paid to the bundler for pre-verification overhead |
| `gasFees` | `bytes32` | Packed `maxFeePerGas` and `maxPriorityFeePerGas` |
| `paymasterAndData` | `bytes` | Paymaster address + paymaster-specific data (empty if self-paying) |
| `signature` | `bytes` | The signature validated by the Validator module |

---

### `IValidator` Interface

**Module Type ID**: `1`

Validators authenticate user operations before they are executed by the smart account.

```solidity
interface IValidator {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external returns (uint256);
    function isModuleType(uint256 typeId) external pure returns (bool);
}
```

| Function | Visibility | Description |
|---|---|---|
| `onInstall(bytes calldata data)` | `external` | Called by the smart account when the module is installed. Receives initialization data. |
| `onUninstall(bytes calldata data)` | `external` | Called by the smart account when the module is uninstalled. Receives teardown data. |
| `validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash)` | `external` | Validates a user operation. Returns `0` for success, `1` for failure. |
| `isModuleType(uint256 typeId)` | `external pure` | Returns `true` if `typeId == 1`. |

**Implemented by**: [`AgentPermissionValidator`](./agent-permission-validator.md)

---

### `IHook` Interface

**Module Type ID**: `4`

Hooks are invoked before and after account execution, enabling pre- and post-execution checks.

```solidity
interface IHook {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function preCheck(
        address msgSender,
        uint256 value,
        bytes calldata msgData
    ) external returns (bytes memory);
    function postCheck(bytes calldata hookData) external;
    function isModuleType(uint256 typeId) external pure returns (bool);
}
```

| Function | Visibility | Description |
|---|---|---|
| `onInstall(bytes calldata data)` | `external` | Module installation callback with configuration data. |
| `onUninstall(bytes calldata data)` | `external` | Module uninstallation callback for cleanup. |
| `preCheck(address msgSender, uint256 value, bytes calldata msgData)` | `external` | Called before execution. Validates constraints (limits, budgets). Returns opaque `hookData` passed to `postCheck`. |
| `postCheck(bytes calldata hookData)` | `external` | Called after execution with the data returned by `preCheck`. Used for logging/events. |
| `isModuleType(uint256 typeId)` | `external pure` | Returns `true` if `typeId == 4`. |

**Implemented by**: [`SpendingLimitHook`](./spending-limit-hook.md), [`X402PaymentPolicy`](./x402-payment-policy.md)

---

### `IExecutor` Interface

**Module Type ID**: `2`

Executors perform actions on behalf of the smart account.

```solidity
interface IExecutor {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function executeFromExecutor(
        address account,
        bytes calldata data
    ) external returns (bytes memory);
    function isModuleType(uint256 typeId) external pure returns (bool);
}
```

| Function | Visibility | Description |
|---|---|---|
| `onInstall(bytes calldata data)` | `external` | Module installation callback. |
| `onUninstall(bytes calldata data)` | `external` | Module uninstallation callback. |
| `executeFromExecutor(address account, bytes calldata data)` | `external` | Executes an action. `account` is the calling smart account. `data` is module-specific encoded action data. Returns execution result bytes. |
| `isModuleType(uint256 typeId)` | `external pure` | Returns `true` if `typeId == 2`. |

**Implemented by**: [`DeFiExecutor`](./defi-executor.md)

---

## `IAgentPermission.sol`

**File**: `src/interfaces/IAgentPermission.sol`

Defines the `AgentPolicy` struct used by the [`AgentPermissionValidator`](./agent-permission-validator.md) to scope what an AI agent is allowed to do.

### `AgentPolicy` Struct

```solidity
struct AgentPolicy {
    address[] allowedTargets;
    bytes4[] allowedSelectors;
    uint256 maxAmountPerTx;
    uint256 dailyLimit;
    uint256 weeklyLimit;
    uint48 validAfter;
    uint48 validUntil;
    bool active;
}
```

| Field | Type | Description |
|---|---|---|
| `allowedTargets` | `address[]` | Contract addresses the agent may call. Empty array = any target allowed. |
| `allowedSelectors` | `bytes4[]` | Function selectors the agent may invoke. Empty array = any selector allowed. |
| `maxAmountPerTx` | `uint256` | Maximum `value` (in wei) the agent may send in a single transaction. |
| `dailyLimit` | `uint256` | Maximum aggregate spending per day (used by the policy, stored for reference). |
| `weeklyLimit` | `uint256` | Maximum aggregate spending per week (used by the policy, stored for reference). |
| `validAfter` | `uint48` | Unix timestamp after which the policy becomes active. `0` = immediately active. |
| `validUntil` | `uint48` | Unix timestamp after which the policy expires. `0` = no expiration. |
| `active` | `bool` | Master kill-switch. Must be `true` for the policy to be considered valid. |

### SDK Usage Example

```typescript
// Building an AgentPolicy from the SDK
const policy = {
  allowedTargets: ["0xBEEF..."],
  allowedSelectors: [
    ethers.id("transfer(address,uint256)").slice(0, 10)
  ],
  maxAmountPerTx: ethers.parseEther("1"),
  dailyLimit: ethers.parseEther("10"),
  weeklyLimit: ethers.parseEther("50"),
  validAfter: Math.floor(Date.now() / 1000),
  validUntil: Math.floor(Date.now() / 1000) + 86400 * 365,
  active: true,
};
```

---

[Back to Overview](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Libraries](./libraries.md)
