# Deployment

[Back to README](./README.md) | [Previous: Test Suites](./test-suites.md) | [Next: ABIs](./abis.md)

---

## Overview

The deployment module (`src/deploy.ts`) handles loading compiled Solidity bytecode from Foundry JSON artifacts and deploying all four Sigloop contracts to the local Anvil devnet. Every test suite calls `deployAll()` in its `beforeAll` hook, meaning each suite gets a fresh set of contract instances.

---

## Source File

**Path:** `src/deploy.ts`

---

## Bytecode Loading

### `loadBytecode(contractName: string): Hex`

Reads the compiled bytecode from Foundry's output directory.

```typescript
function loadBytecode(contractName: string): Hex {
  const artifactPath = join(CONTRACTS_OUT_DIR, `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
  return artifact.bytecode.object as Hex;
}
```

**How it works:**
1. Computes the artifact path relative to `src/deploy.ts`:
   ```
   ../../contracts/out/<ContractName>.sol/<ContractName>.json
   ```
   This resolves to `testing/ai/contracts/out/` from the integration-ts root.
2. Reads and parses the JSON artifact synchronously.
3. Extracts `artifact.bytecode.object`, which is the creation bytecode as a hex string (e.g., `"0x6080604052..."`).

**Expected artifact structure** (subset):
```json
{
  "bytecode": {
    "object": "0x6080604052..."
  }
}
```

This is the standard Foundry JSON artifact format produced by `forge build`.

---

## Contract Deployment

### `deployContract(walletClient, publicClient, bytecode): Promise<Address>`

Deploys a single contract and returns its on-chain address.

```typescript
async function deployContract(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  bytecode: Hex
): Promise<`0x${string}`> {
  const hash = await walletClient.deployContract({
    abi: [],
    bytecode,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) {
    throw new Error("Contract deployment failed: no address returned");
  }
  return receipt.contractAddress;
}
```

**Key details:**
- Uses viem's `deployContract` with an empty ABI (`abi: []`) since the contracts have no constructor arguments.
- Waits for the transaction receipt to confirm deployment.
- Throws if the receipt does not contain a contract address (deployment failure).

---

## Batch Deployment

### `deployAll(walletClient, publicClient): Promise<DeployedContracts>`

Deploys all four contracts sequentially and returns their addresses.

```typescript
export async function deployAll(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>
): Promise<DeployedContracts> {
  const agentPermissionValidator = await deployContract(walletClient, publicClient, loadBytecode("AgentPermissionValidator"));
  const spendingLimitHook        = await deployContract(walletClient, publicClient, loadBytecode("SpendingLimitHook"));
  const x402PaymentPolicy        = await deployContract(walletClient, publicClient, loadBytecode("X402PaymentPolicy"));
  const deFiExecutor             = await deployContract(walletClient, publicClient, loadBytecode("DeFiExecutor"));

  return { agentPermissionValidator, spendingLimitHook, x402PaymentPolicy, deFiExecutor };
}
```

**Deployment order:** AgentPermissionValidator -> SpendingLimitHook -> X402PaymentPolicy -> DeFiExecutor

Deployments are sequential (not parallel) because each `deployContract` call must complete before the next nonce is available on the deployer account.

---

## `DeployedContracts` Interface

```typescript
export interface DeployedContracts {
  agentPermissionValidator: `0x${string}`;
  spendingLimitHook: `0x${string}`;
  x402PaymentPolicy: `0x${string}`;
  deFiExecutor: `0x${string}`;
}
```

All test files import this interface to access deployed contract addresses.

---

## Usage in Tests

Every test suite follows this pattern:

```typescript
import { deployAll, type DeployedContracts } from "../deploy.js";
import { getPublicClient, getWalletClient } from "../helpers/anvil.js";
import { deployer } from "../helpers/accounts.js";

describe("SomeContract", () => {
  let contracts: DeployedContracts;
  const publicClient = getPublicClient();
  const deployerClient = getWalletClient(deployer.privateKey);

  beforeAll(async () => {
    contracts = await deployAll(deployerClient, publicClient);
  });

  it("should do something", async () => {
    // Use contracts.agentPermissionValidator, contracts.spendingLimitHook, etc.
  });
});
```

---

## Dependency Chain

```
forge build
    |
    v
contracts/out/<Name>.sol/<Name>.json   (Foundry artifact)
    |
    v
loadBytecode("<Name>")                 (reads .bytecode.object)
    |
    v
deployContract(wallet, public, hex)    (deploys to Anvil)
    |
    v
DeployedContracts                      (returned to test suite)
```

---

[Back to README](./README.md) | [Previous: Test Suites](./test-suites.md) | [Next: ABIs](./abis.md)
