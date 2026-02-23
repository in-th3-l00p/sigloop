# Deployment

[Back to Overview](./README.md) | [Previous: DeFiExecutor](./defi-executor.md) | [Next: Testing](./testing.md)

---

## Overview

All four Sigloop modules are deployed via a single Foundry script: `script/Deploy.s.sol`. The script deploys each module as an independent contract and logs the deployed addresses.

---

## Deploy Script Source

**File**: `script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/modules/AgentPermissionValidator.sol";
import "../src/modules/SpendingLimitHook.sol";
import "../src/modules/X402PaymentPolicy.sol";
import "../src/modules/DeFiExecutor.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        AgentPermissionValidator validator = new AgentPermissionValidator();
        SpendingLimitHook spendingHook = new SpendingLimitHook();
        X402PaymentPolicy paymentPolicy = new X402PaymentPolicy();
        DeFiExecutor defiExecutor = new DeFiExecutor();

        console.log("AgentPermissionValidator:", address(validator));
        console.log("SpendingLimitHook:", address(spendingHook));
        console.log("X402PaymentPolicy:", address(paymentPolicy));
        console.log("DeFiExecutor:", address(defiExecutor));

        vm.stopBroadcast();
    }
}
```

### What the script does

1. Calls `vm.startBroadcast()` to begin recording transactions for on-chain submission.
2. Deploys four contracts using `new`:
   - `AgentPermissionValidator` -- Validator (type 1)
   - `SpendingLimitHook` -- Hook (type 4)
   - `X402PaymentPolicy` -- Hook (type 4)
   - `DeFiExecutor` -- Executor (type 2)
3. Logs each deployed address to the console.
4. Calls `vm.stopBroadcast()` to finalize.

None of the constructors take arguments, so the deployments are straightforward `CREATE` operations.

---

## Deploying to Anvil (Local)

### Step 1: Start Anvil

```bash
anvil
```

Anvil starts a local EVM node on `http://127.0.0.1:8545` with 10 pre-funded accounts. The default private key for account 0 is:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Step 2: Deploy

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

### Step 3: Verify output

The script will print the deployed addresses:

```
== Logs ==
  AgentPermissionValidator: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  SpendingLimitHook:        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  X402PaymentPolicy:        0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  DeFiExecutor:             0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

(Actual addresses will vary depending on deployer nonce.)

---

## Deploying to a Testnet

### Prerequisites

Set the following environment variables:

```bash
export RPC_URL="https://sepolia.base.org"          # or any testnet RPC
export DEPLOYER_PRIVATE_KEY="0x..."                 # your deployer private key
export ETHERSCAN_API_KEY="..."                      # for contract verification
```

### Deploy

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Flags explained

| Flag | Description |
|---|---|
| `--rpc-url` | The JSON-RPC endpoint of the target network |
| `--private-key` | The deployer's private key (must have ETH for gas) |
| `--broadcast` | Actually send transactions (without this, it is a dry run) |
| `--verify` | Verify source code on Etherscan/Basescan after deployment |
| `--etherscan-api-key` | API key for the block explorer's verification API |

### Dry run (simulation only)

Omit `--broadcast` to simulate the deployment without sending transactions:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Deploying to Mainnet

The same script works for mainnet. Ensure you:

1. Use a mainnet RPC URL.
2. Use a funded deployer key.
3. Double-check gas prices (`--with-gas-price` flag if needed).
4. Run a dry run first (without `--broadcast`).

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --with-gas-price 30gwei
```

---

## Post-Deployment: Installing Modules

After deployment, the modules must be **installed** into the target ERC-7579 smart account. This is done via the account's `installModule` function (defined by ERC-7579).

### Install the Validator

```typescript
// From the SDK / account owner
const installData = abiCoder.encode(
  ["address", "tuple(address[],bytes4[],uint256,uint256,uint256,uint48,uint48,bool)"],
  [agentAddress, policy]
);

await account.installModule(
  1,                    // module type: Validator
  validatorAddress,     // deployed AgentPermissionValidator address
  installData           // encoded (agent, policy)
);
```

### Install the Spending Hook

```typescript
const installData = abiCoder.encode(
  ["address", "address", "uint256", "uint256"],
  [agentAddress, tokenAddress, dailyLimit, weeklyLimit]
);

await account.installModule(
  4,                    // module type: Hook
  spendingHookAddress,  // deployed SpendingLimitHook address
  installData
);
```

### Install the X402 Payment Policy

```typescript
const installData = abiCoder.encode(
  ["address", "uint256", "uint256", "uint256", "string[]"],
  [agentAddress, maxPerRequest, dailyBudget, totalBudget, allowedDomains]
);

await account.installModule(
  4,                      // module type: Hook
  paymentPolicyAddress,   // deployed X402PaymentPolicy address
  installData
);
```

### Install the DeFi Executor

```typescript
// No install data needed (onInstall is a no-op)
await account.installModule(
  2,                    // module type: Executor
  defiExecutorAddress,  // deployed DeFiExecutor address
  "0x"                  // empty bytes
);
```

---

## Deployed Addresses

After deployment, record the addresses in your configuration. Example `.env` format:

```bash
AGENT_PERMISSION_VALIDATOR=0x...
SPENDING_LIMIT_HOOK=0x...
X402_PAYMENT_POLICY=0x...
DEFI_EXECUTOR=0x...
```

These addresses are deterministic based on the deployer address and nonce, but will differ across networks.

---

[Back to Overview](./README.md) | [Previous: DeFiExecutor](./defi-executor.md) | [Next: Testing](./testing.md)
