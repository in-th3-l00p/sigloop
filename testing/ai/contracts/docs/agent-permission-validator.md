# AgentPermissionValidator

[Back to Overview](./README.md) | [Previous: Libraries](./libraries.md) | [Next: SpendingLimitHook](./spending-limit-hook.md)

---

## Overview

| Property | Value |
|---|---|
| **File** | `src/modules/AgentPermissionValidator.sol` |
| **Module Type** | Validator (`typeId == 1`) |
| **ERC-7579 Role** | Authenticates user-operations before account execution |
| **Depends on** | [`IValidator`](./interfaces.md#ivalidator-interface), [`PackedUserOperation`](./interfaces.md#packeduseroperation-struct), [`AgentPolicy`](./interfaces.md#agentpolicy-struct), [`PolicyLib`](./libraries.md#policylib) |

### Purpose

`AgentPermissionValidator` is the core permission layer of the Sigloop system. It allows a smart-account owner to delegate scoped, time-bounded authority to one or more AI agent addresses. When a user-operation arrives signed by an agent, the validator:

1. Recovers the agent's address from an ECDSA signature.
2. Looks up the `AgentPolicy` for that `(account, agent)` pair.
3. Checks that the policy is active (not expired, not deactivated).
4. Verifies the call target is in the allowlist (if one is configured).
5. Verifies the function selector is in the allowlist (if one is configured).
6. Verifies the transaction value does not exceed `maxAmountPerTx`.

Returns `0` (success) or `1` (failure).

---

## Storage Layout

```solidity
mapping(address => mapping(address => AgentPolicy)) private _policies;
```

| Mapping Key | Type | Description |
|---|---|---|
| First key | `address` | The smart-account address (owner) |
| Second key | `address` | The agent address |
| Value | `AgentPolicy` | The permission policy for this account-agent pair |

The `_policies` mapping is the only state variable. Each smart account can have independent policies for multiple agents.

---

## Full Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IValidator, PackedUserOperation} from "../interfaces/IERC7579Module.sol";
import {AgentPolicy} from "../interfaces/IAgentPermission.sol";
import {PolicyLib} from "../libraries/PolicyLib.sol";

contract AgentPermissionValidator is IValidator {
    using PolicyLib for AgentPolicy;

    mapping(address => mapping(address => AgentPolicy)) private _policies;

    // ... functions documented below
}
```

---

## Functions

### `onInstall`

```solidity
function onInstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `(address agent, AgentPolicy policy)` |
| **Returns** | None |
| **Access Control** | Called by the smart account during module installation |

**Description**: Module installation callback. Decodes the `data` parameter into an `(address, AgentPolicy)` tuple and stores the policy for the `(msg.sender, agent)` pair.

**Logic walkthrough**:
1. ABI-decode `data` into `(address agent, AgentPolicy memory policy)`.
2. Call internal `_setPolicy(msg.sender, agent, policy)` to persist to storage.

**Example encoding** (SDK):
```typescript
const installData = ethers.AbiCoder.defaultAbiCoder().encode(
  ["address", "tuple(address[],bytes4[],uint256,uint256,uint256,uint48,uint48,bool)"],
  [agentAddress, policy]
);
```

---

### `onUninstall`

```solidity
function onUninstall(bytes calldata data) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `data` -- ABI-encoded `address` of the agent to remove |
| **Returns** | None |
| **Access Control** | Called by the smart account during module uninstallation |

**Description**: Module uninstallation callback. Decodes the agent address and deletes the stored policy.

**Logic walkthrough**:
1. ABI-decode `data` into `address agent`.
2. `delete _policies[msg.sender][agent]`.

---

### `validateUserOp`

```solidity
function validateUserOp(
    PackedUserOperation calldata userOp,
    bytes32 userOpHash
) external override returns (uint256)
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `userOp` -- the packed user operation; `userOpHash` -- ERC-4337 hash of the operation |
| **Returns** | `uint256` -- `0` for valid, `1` for invalid |
| **Access Control** | Called by the smart account's `validateUserOp` flow |

**Description**: The primary validation function. Authenticates an agent's signature and enforces the associated policy constraints.

**Logic walkthrough**:

1. **Signature length check**: If `userOp.signature.length < 85`, return `1`. The signature format is `[20 bytes agent address][65 bytes ECDSA signature (r, s, v)]`.

2. **Extract agent address**: `agent = address(bytes20(sig[0:20]))` -- the first 20 bytes of the signature encode the agent's address.

3. **Extract ECDSA signature**: `ecdsaSig = sig[20:85]` -- the next 65 bytes are the raw ECDSA signature.

4. **Recover signer**:
   ```solidity
   bytes32 ethHash = keccak256(
       abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
   );
   (bytes32 r, bytes32 s, uint8 v) = _splitSignature(ecdsaSig);
   address recovered = ecrecover(ethHash, v, r, s);
   ```
   If `recovered != agent`, return `1`.

5. **Load policy**: `AgentPolicy storage policy = _policies[userOp.sender][agent]`.

6. **Check policy is active**: `if (!policy.isPolicyActive()) return 1` -- uses `PolicyLib.isPolicyActive` which checks `active`, `validAfter`, and `validUntil`.

7. **Target validation** (if `callData.length >= 36`):
   - Extract `target = abi.decode(userOp.callData[4:36], (address))`.
   - If `_isTargetAllowed(policy, target)` returns `false`, return `1`.

8. **Selector validation** (if `callData.length >= 4`):
   - Extract `selector = bytes4(userOp.callData[0:4])`.
   - If `_isSelectorAllowed(policy, selector)` returns `false`, return `1`.

9. **Value validation** (if `callData.length >= 68`):
   - Extract `value = abi.decode(userOp.callData[36:68], (uint256))`.
   - If `value > policy.maxAmountPerTx`, return `1`.

10. **Success**: Return `0`.

**Signature format diagram**:
```
|<--- 20 bytes --->|<---------- 65 bytes ---------->|
| agent address    | r (32) | s (32) | v (1)        |
```

---

### `addAgent`

```solidity
function addAgent(address agent, AgentPolicy calldata policy) external
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `agent` -- the agent address to authorize; `policy` -- the permission policy |
| **Returns** | None |
| **Access Control** | Any caller (typically the account owner via direct call or UserOp) |

**Description**: Adds or updates an agent's policy. The caller (`msg.sender`) is treated as the smart-account address.

**Logic**: Calls `_setPolicy(msg.sender, agent, policy)`.

**SDK usage**:
```typescript
const tx = await validator.addAgent(agentAddress, {
  allowedTargets: [tokenContract],
  allowedSelectors: [transferSelector],
  maxAmountPerTx: parseEther("1"),
  dailyLimit: parseEther("10"),
  weeklyLimit: parseEther("50"),
  validAfter: now,
  validUntil: now + 365 * 86400,
  active: true,
});
```

---

### `removeAgent`

```solidity
function removeAgent(address agent) external
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | `agent` -- the agent address to revoke |
| **Returns** | None |
| **Access Control** | Any caller (typically the account owner) |

**Description**: Revokes all permissions for an agent by deleting their policy. This is the emergency kill-switch for revoking delegation.

**Logic**: `delete _policies[msg.sender][agent]`.

---

### `getPolicy`

```solidity
function getPolicy(address account, address agent) external view returns (AgentPolicy memory)
```

| | |
|---|---|
| **Visibility** | `external view` |
| **Parameters** | `account` -- the smart-account address; `agent` -- the agent address |
| **Returns** | `AgentPolicy memory` -- the stored policy (zeroed struct if none exists) |

**Description**: Read-only function for querying the current policy for a given account-agent pair. Useful for the SDK to display current permissions to the user.

---

### `isModuleType`

```solidity
function isModuleType(uint256 typeId) external pure override returns (bool)
```

| | |
|---|---|
| **Visibility** | `external pure` |
| **Parameters** | `typeId` -- the ERC-7579 module type identifier |
| **Returns** | `true` if `typeId == 1`, `false` otherwise |

**Description**: ERC-7579 module-type introspection. This contract is a **Validator** (type `1`).

---

## Internal Functions

### `_setPolicy`

```solidity
function _setPolicy(address account, address agent, AgentPolicy memory policy) internal
```

Copies every field from the memory `policy` into the storage slot at `_policies[account][agent]`. Performs field-by-field assignment because Solidity does not support direct assignment from memory to storage for structs containing dynamic arrays.

**Fields copied**: `allowedTargets`, `allowedSelectors`, `maxAmountPerTx`, `dailyLimit`, `weeklyLimit`, `validAfter`, `validUntil`, `active`.

---

### `_isTargetAllowed`

```solidity
function _isTargetAllowed(AgentPolicy storage policy, address target) internal view returns (bool)
```

- If `policy.allowedTargets.length == 0`, returns `true` (open allowlist -- any target permitted).
- Otherwise, iterates through `allowedTargets` and returns `true` if `target` is found.
- Returns `false` if the target is not in the list.

---

### `_isSelectorAllowed`

```solidity
function _isSelectorAllowed(AgentPolicy storage policy, bytes4 selector) internal view returns (bool)
```

- If `policy.allowedSelectors.length == 0`, returns `true` (open allowlist -- any selector permitted).
- Otherwise, iterates through `allowedSelectors` and returns `true` if `selector` is found.
- Returns `false` if the selector is not in the list.

---

### `_splitSignature`

```solidity
function _splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v)
```

Uses inline assembly to split a 65-byte ECDSA signature into its `r`, `s`, and `v` components:

```solidity
assembly {
    r := mload(add(sig, 32))
    s := mload(add(sig, 64))
    v := byte(0, mload(add(sig, 96)))
}
```

---

## Events

This contract does not emit any events. Policy changes are tracked by monitoring `addAgent` and `removeAgent` transactions. Consider the [`SpendingLimitHook`](./spending-limit-hook.md) for post-execution event emission.

---

## Access Control

| Function | Who can call | Notes |
|---|---|---|
| `onInstall` | Smart account | During ERC-7579 module installation |
| `onUninstall` | Smart account | During ERC-7579 module uninstallation |
| `validateUserOp` | Smart account / EntryPoint | During ERC-4337 validation phase |
| `addAgent` | Anyone | `msg.sender` is used as the account key, so only the account itself can set its own policies |
| `removeAgent` | Anyone | Same `msg.sender`-as-account pattern |
| `getPolicy` | Anyone | Read-only |

---

## SDK Interaction Example

```typescript
import { ethers } from "ethers";

// 1. Deploy or get reference to the validator
const validator = new ethers.Contract(validatorAddress, validatorABI, signer);

// 2. Create a policy for an AI agent
const policy = {
  allowedTargets: ["0xBEEF..."],
  allowedSelectors: [
    ethers.id("transfer(address,uint256)").slice(0, 10),
  ],
  maxAmountPerTx: ethers.parseEther("1"),
  dailyLimit: ethers.parseEther("10"),
  weeklyLimit: ethers.parseEther("50"),
  validAfter: Math.floor(Date.now() / 1000),
  validUntil: Math.floor(Date.now() / 1000) + 86400 * 365,
  active: true,
};

// 3. Grant the agent permissions
await validator.addAgent(agentAddress, policy);

// 4. Later, revoke
await validator.removeAgent(agentAddress);

// 5. Query current policy
const currentPolicy = await validator.getPolicy(accountAddress, agentAddress);
console.log("Active:", currentPolicy.active);
```

---

[Back to Overview](./README.md) | [Previous: Libraries](./libraries.md) | [Next: SpendingLimitHook](./spending-limit-hook.md)
