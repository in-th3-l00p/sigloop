# DeFiExecutor

[Back to Overview](./README.md) | [Previous: X402PaymentPolicy](./x402-payment-policy.md) | [Next: Deployment](./deployment.md)

---

## Overview

| Property | Value |
|---|---|
| **File** | `src/modules/DeFiExecutor.sol` |
| **Module Type** | Executor (`typeId == 2`) |
| **ERC-7579 Role** | Executes DeFi actions on behalf of the smart account |
| **Depends on** | [`IExecutor`](./interfaces.md#iexecutor-interface) |

### Purpose

`DeFiExecutor` provides a structured, type-safe way for AI agents to execute DeFi operations through a smart account. Instead of passing raw calldata, agents encode their intent as a `DeFiAction` struct with an explicit `ActionType`. The module then:

1. Decodes the action struct.
2. Validates the target address is non-zero.
3. Executes a low-level `call` to the target with the encoded function data and ETH value.
4. Returns the call result or reverts on failure.

The module also exposes pure encoding helper functions (`encodeSwap`, `encodeLending`) that the SDK can call off-chain to produce correctly-formatted action data.

---

## Types

### `ActionType` Enum

```solidity
enum ActionType { Swap, Supply, Borrow, Repay, Stake, Unstake }
```

| Value | Integer | Description |
|---|---|---|
| `Swap` | `0` | Token swap via a DEX router |
| `Supply` | `1` | Supply/deposit into a lending pool |
| `Borrow` | `2` | Borrow from a lending pool |
| `Repay` | `3` | Repay a loan |
| `Stake` | `4` | Stake tokens in a staking contract |
| `Unstake` | `5` | Unstake/withdraw staked tokens |

### `DeFiAction` Struct

```solidity
struct DeFiAction {
    ActionType actionType;
    address target;
    bytes data;
    uint256 value;
}
```

| Field | Type | Description |
|---|---|---|
| `actionType` | `ActionType` | The type of DeFi operation (for off-chain categorization and logging) |
| `target` | `address` | The contract to call (e.g. DEX router, lending pool) |
| `data` | `bytes` | The ABI-encoded function call to execute on the target |
| `value` | `uint256` | ETH value to send with the call (in wei) |

---

## Storage Layout

This contract is **stateless**. It has no storage variables. All behavior is determined by the action data passed to `executeFromExecutor`.

---

## Events

This contract does not emit any events. Execution results are returned to the caller. Consider using [`SpendingLimitHook`](./spending-limit-hook.md) in conjunction for post-execution event emission.

---

## Functions

### `onInstall`

```solidity
function onInstall(bytes calldata) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | (unused) |
| **Returns** | None |

**Description**: No-op. The DeFiExecutor is stateless and requires no initialization.

---

### `onUninstall`

```solidity
function onUninstall(bytes calldata) external override
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | (unused) |
| **Returns** | None |

**Description**: No-op. Nothing to clean up.

---

### `executeFromExecutor`

```solidity
function executeFromExecutor(
    address,
    bytes calldata data
) external override returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `external` |
| **Parameters** | (unnamed `address` -- the account, unused in this implementation); `data` -- ABI-encoded `DeFiAction` struct |
| **Returns** | `bytes memory` -- the raw return data from the target contract call |
| **Access Control** | Called by the smart account |

**Description**: The core execution function. Decodes a `DeFiAction` and performs a low-level call to the target.

**Logic walkthrough**:

1. **Decode action**: `DeFiAction memory action = abi.decode(data, (DeFiAction))`.

2. **Validate target**: `require(action.target != address(0), "DeFiExecutor: zero target")`. Prevents calls to the zero address.

3. **Execute call**:
   ```solidity
   (bool success, bytes memory result) = action.target.call{value: action.value}(action.data);
   ```
   Performs a low-level call with the specified ETH value and calldata.

4. **Check result**: `require(success, "DeFiExecutor: execution failed")`. Reverts if the external call failed.

5. **Return**: Returns the raw `result` bytes from the external call.

**Revert conditions**:

| Condition | Revert Message |
|---|---|
| `action.target == address(0)` | `"DeFiExecutor: zero target"` |
| External call returns `false` | `"DeFiExecutor: execution failed"` |

---

### `encodeSwap`

```solidity
function encodeSwap(
    address router,
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minOut
) external pure returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `external pure` |
| **Parameters** | `router` -- DEX router address; `tokenIn` -- input token; `tokenOut` -- output token; `amountIn` -- amount of input token; `minOut` -- minimum acceptable output amount (slippage protection) |
| **Returns** | `bytes memory` -- ABI-encoded `DeFiAction` ready for `executeFromExecutor` |

**Description**: Pure encoding helper for building a swap action. Constructs a `DeFiAction` with:
- `actionType = ActionType.Swap`
- `target = router`
- `data = abi.encodeWithSignature("swap(address,address,uint256,uint256)", tokenIn, tokenOut, amountIn, minOut)`
- `value = 0`

**Logic walkthrough**:
1. Encode the swap function call:
   ```solidity
   bytes memory swapData = abi.encodeWithSignature(
       "swap(address,address,uint256,uint256)",
       tokenIn, tokenOut, amountIn, minOut
   );
   ```
2. Wrap in a `DeFiAction` struct.
3. ABI-encode the struct and return.

**SDK usage**:
```typescript
// Off-chain: use the contract's encodeSwap to get properly formatted data
const encoded = await executor.encodeSwap(
  routerAddress,
  USDC_ADDRESS,
  WETH_ADDRESS,
  parseUnits("100", 6),
  parseEther("0.04"),
);

// Then pass `encoded` to executeFromExecutor
await executor.executeFromExecutor(accountAddress, encoded);
```

---

### `encodeLending`

```solidity
function encodeLending(
    address pool,
    address asset,
    uint256 amount,
    bool isSupply
) external pure returns (bytes memory)
```

| | |
|---|---|
| **Visibility** | `external pure` |
| **Parameters** | `pool` -- lending pool address; `asset` -- the token to supply or borrow; `amount` -- the amount; `isSupply` -- `true` for supply, `false` for borrow |
| **Returns** | `bytes memory` -- ABI-encoded `DeFiAction` ready for `executeFromExecutor` |

**Description**: Pure encoding helper for building a lending supply or borrow action.

**Logic walkthrough**:

1. **Encode the lending call** based on `isSupply`:
   - If `isSupply == true`:
     ```solidity
     lendData = abi.encodeWithSignature("supply(address,uint256)", asset, amount);
     ```
     Action type is set to `ActionType.Supply`.
   - If `isSupply == false`:
     ```solidity
     lendData = abi.encodeWithSignature("borrow(address,uint256)", asset, amount);
     ```
     Action type is set to `ActionType.Borrow`.

2. Wrap in a `DeFiAction` struct with `target = pool`, `value = 0`.

3. ABI-encode the struct and return.

**SDK usage**:
```typescript
// Supply 1000 USDC to a lending pool
const supplyData = await executor.encodeLending(
  poolAddress,
  USDC_ADDRESS,
  parseUnits("1000", 6),
  true,  // isSupply = true
);
await executor.executeFromExecutor(accountAddress, supplyData);

// Borrow 0.5 ETH from the pool
const borrowData = await executor.encodeLending(
  poolAddress,
  WETH_ADDRESS,
  parseEther("0.5"),
  false,  // isSupply = false (borrow)
);
await executor.executeFromExecutor(accountAddress, borrowData);
```

---

### `isModuleType`

```solidity
function isModuleType(uint256 typeId) external pure override returns (bool)
```

| | |
|---|---|
| **Visibility** | `external pure` |
| **Returns** | `true` if `typeId == 2`, `false` otherwise |

**Description**: ERC-7579 module-type introspection. This contract is an **Executor** (type `2`).

---

## Access Control

| Function | Who can call | Notes |
|---|---|---|
| `onInstall` | Smart account | No-op |
| `onUninstall` | Smart account | No-op |
| `executeFromExecutor` | Smart account / Anyone | No access restriction in the contract itself; rely on the smart account framework and validator to gate access |
| `encodeSwap` | Anyone | Pure function, no state access |
| `encodeLending` | Anyone | Pure function, no state access |

**Important**: `executeFromExecutor` does not perform any authentication. It relies on the ERC-7579 smart account to only invoke it after the Validator has approved the operation. Calling `executeFromExecutor` directly from an EOA will execute the action as the DeFiExecutor contract itself (not as the smart account).

---

## Execution Flow

```
SDK / Agent
    |
    | (1) encodeSwap(router, tokenIn, tokenOut, amountIn, minOut)
    |     --> returns ABI-encoded DeFiAction
    v
Smart Account
    |
    | (2) AgentPermissionValidator.validateUserOp() -- checks agent signature + policy
    | (3) SpendingLimitHook.preCheck() -- checks spending limits
    |
    | (4) DeFiExecutor.executeFromExecutor(account, encodedAction)
    |         |
    |         | (4a) Decode DeFiAction
    |         | (4b) Validate target != address(0)
    |         | (4c) target.call{value}(data)
    |         | (4d) Require success
    |         | (4e) Return result
    |
    | (5) SpendingLimitHook.postCheck() -- emit SpendingRecorded
    v
Done
```

---

## Full Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IExecutor} from "../interfaces/IERC7579Module.sol";

contract DeFiExecutor is IExecutor {
    enum ActionType { Swap, Supply, Borrow, Repay, Stake, Unstake }

    struct DeFiAction {
        ActionType actionType;
        address target;
        bytes data;
        uint256 value;
    }

    function onInstall(bytes calldata) external override {}

    function onUninstall(bytes calldata) external override {}

    function executeFromExecutor(
        address,
        bytes calldata data
    ) external override returns (bytes memory) {
        DeFiAction memory action = abi.decode(data, (DeFiAction));
        require(action.target != address(0), "DeFiExecutor: zero target");
        (bool success, bytes memory result) = action.target.call{value: action.value}(action.data);
        require(success, "DeFiExecutor: execution failed");
        return result;
    }

    function encodeSwap(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minOut
    ) external pure returns (bytes memory) {
        bytes memory swapData = abi.encodeWithSignature(
            "swap(address,address,uint256,uint256)",
            tokenIn, tokenOut, amountIn, minOut
        );
        DeFiAction memory action = DeFiAction({
            actionType: ActionType.Swap,
            target: router,
            data: swapData,
            value: 0
        });
        return abi.encode(action);
    }

    function encodeLending(
        address pool,
        address asset,
        uint256 amount,
        bool isSupply
    ) external pure returns (bytes memory) {
        bytes memory lendData;
        if (isSupply) {
            lendData = abi.encodeWithSignature("supply(address,uint256)", asset, amount);
        } else {
            lendData = abi.encodeWithSignature("borrow(address,uint256)", asset, amount);
        }
        DeFiAction memory action = DeFiAction({
            actionType: isSupply ? ActionType.Supply : ActionType.Borrow,
            target: pool,
            data: lendData,
            value: 0
        });
        return abi.encode(action);
    }

    function isModuleType(uint256 typeId) external pure override returns (bool) {
        return typeId == 2;
    }
}
```

---

[Back to Overview](./README.md) | [Previous: X402PaymentPolicy](./x402-payment-policy.md) | [Next: Deployment](./deployment.md)
