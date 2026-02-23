# Wallet

[<- Back to README](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Agent ->](./agent.md)

---

The wallet module creates and manages ERC-4337 smart accounts using the Kernel v0.3.1 account implementation with EntryPoint v0.7. It includes passkey-based authentication and a social recovery system with guardians.

```typescript
import {
  createWallet,
  getWalletAddress,
  createPasskeyCredential,
  createPasskeyAccount,
  authenticateWithPasskey,
  derivePasskeyAddress,
  addGuardian,
  removeGuardian,
  initiateRecovery,
  executeRecovery,
  getRecoveryRequest,
  cancelRecovery,
} from "@sigloop/sdk";
```

---

## Wallet Creation

### `createWallet`

Creates a new ERC-4337 smart account backed by a Kernel v0.3.1 account.

```typescript
function createWallet(params: CreateWalletParams): Promise<SigloopWallet>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | [`CreateWalletParams`](./types.md#createwalletparams) | Wallet creation parameters |

`CreateWalletParams` fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | `LocalAccount` | Yes | The viem local account that owns this wallet |
| `config` | [`WalletConfig`](./types.md#walletconfig) | Yes | Chain and endpoint configuration |

**Returns:** `Promise<SigloopWallet>` -- The created smart wallet object.

**Example:**

```typescript
import { createWallet, SupportedChain } from "@sigloop/sdk";
import { privateKeyToAccount } from "viem/accounts";

const owner = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

const wallet = await createWallet({
  owner,
  config: {
    chainId: SupportedChain.BaseSepolia,
    rpcUrl: "https://sepolia.base.org",
    bundlerUrl: "https://bundler.sepolia.base.org",
    paymasterUrl: "https://paymaster.sepolia.base.org",
    index: 0n,
  },
});

console.log(wallet.address);           // "0x..."
console.log(wallet.entryPointVersion); // "0.7"
console.log(wallet.guardians);         // []
```

---

### `getWalletAddress`

Computes the counterfactual address of a smart wallet without deploying it.

```typescript
function getWalletAddress(
  owner: LocalAccount,
  config: WalletConfig
): Promise<`0x${string}`>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `owner` | `LocalAccount` | The owner account |
| `config` | [`WalletConfig`](./types.md#walletconfig) | Chain and endpoint configuration |

**Returns:** `Promise<\`0x${string}\`>` -- The predicted smart account address.

**Example:**

```typescript
import { getWalletAddress, SupportedChain } from "@sigloop/sdk";
import { privateKeyToAccount } from "viem/accounts";

const owner = privateKeyToAccount("0x...");

const address = await getWalletAddress(owner, {
  chainId: SupportedChain.Base,
});

console.log("Predicted address:", address);
```

---

## Passkey Authentication

### `PasskeyCredential`

```typescript
interface PasskeyCredential {
  id: string;
  publicKey: Hex;
  rawId: Uint8Array;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | The WebAuthn credential ID |
| `publicKey` | `Hex` | The public key in hex encoding |
| `rawId` | `Uint8Array` | The raw credential ID bytes |

### `PasskeyAuthResult`

```typescript
interface PasskeyAuthResult {
  credentialId: string;
  signature: Hex;
  authenticatorData: Hex;
  clientDataJSON: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `credentialId` | `string` | The credential ID used for authentication |
| `signature` | `Hex` | The assertion signature |
| `authenticatorData` | `Hex` | Authenticator data from the assertion |
| `clientDataJSON` | `string` | The client data JSON string |

---

### `createPasskeyCredential`

Creates a new WebAuthn credential (passkey) for wallet authentication. Requires a browser environment with WebAuthn support.

```typescript
function createPasskeyCredential(name: string): Promise<PasskeyCredential>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | A human-readable name for the credential |

**Returns:** `Promise<PasskeyCredential>` -- The created passkey credential.

**Example:**

```typescript
import { createPasskeyCredential } from "@sigloop/sdk";

const credential = await createPasskeyCredential("my-sigloop-wallet");
console.log("Credential ID:", credential.id);
console.log("Public key:", credential.publicKey);
```

---

### `createPasskeyAccount`

Wraps a passkey credential into a viem WebAuthn account that can be used as a smart account owner.

```typescript
function createPasskeyAccount(credential: {
  id: string;
  publicKey: Hex;
}): WebAuthnAccount
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `credential` | `{ id: string; publicKey: Hex }` | The passkey credential |

**Returns:** A viem `WebAuthnAccount` instance.

**Example:**

```typescript
import { createPasskeyCredential, createPasskeyAccount } from "@sigloop/sdk";

const credential = await createPasskeyCredential("my-wallet");
const account = createPasskeyAccount({
  id: credential.id,
  publicKey: credential.publicKey,
});
```

---

### `authenticateWithPasskey`

Performs a WebAuthn authentication assertion using an existing passkey credential. Requires a browser environment.

```typescript
function authenticateWithPasskey(
  credentialId: string,
  challenge: Hex
): Promise<PasskeyAuthResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `credentialId` | `string` | The credential ID to authenticate with |
| `challenge` | `Hex` | A hex-encoded challenge to sign |

**Returns:** `Promise<PasskeyAuthResult>` -- The authentication result with signature.

**Example:**

```typescript
import { authenticateWithPasskey } from "@sigloop/sdk";

const challenge = "0xdeadbeef...";
const result = await authenticateWithPasskey(credential.id, challenge);
console.log("Signature:", result.signature);
```

---

### `derivePasskeyAddress`

Derives an Ethereum address from a passkey public key by taking the last 20 bytes of the keccak256 hash.

```typescript
function derivePasskeyAddress(publicKey: Hex): Address
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `publicKey` | `Hex` | The passkey public key in hex |

**Returns:** `Address` -- The derived Ethereum address.

**Example:**

```typescript
import { derivePasskeyAddress } from "@sigloop/sdk";

const address = derivePasskeyAddress(credential.publicKey);
console.log("Derived address:", address);
```

---

## Social Recovery

The recovery module manages wallet guardians and implements a social recovery flow. Guardians are trusted addresses that can collectively authorize ownership transfer if the owner loses access.

### `RecoveryRequest`

```typescript
interface RecoveryRequest {
  newOwner: Address;
  executeAfter: bigint;
  guardiansApproved: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `newOwner` | `Address` | The address that will become the new owner |
| `executeAfter` | `bigint` | Unix timestamp after which recovery can be executed |
| `guardiansApproved` | `bigint` | Number of guardians that have approved |

---

### `addGuardian`

Adds a guardian address to the wallet. Throws if the guardian already exists.

```typescript
function addGuardian(wallet: SigloopWallet, guardian: Address): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `wallet` | [`SigloopWallet`](./types.md#sigloopwallet) | The wallet to add the guardian to |
| `guardian` | `Address` | The guardian address to add |

**Returns:** `Promise<Hex>` -- The encoded calldata for the `addGuardian` contract call.

**Throws:**
- If `guardian` is not a valid address
- If the guardian already exists on the wallet

**Example:**

```typescript
import { addGuardian } from "@sigloop/sdk";

const calldata = await addGuardian(wallet, "0xGuardianAddress...");
// Submit calldata as a UserOperation through the smart account
```

---

### `removeGuardian`

Removes a guardian from the wallet. Throws if the guardian is not found or if it is the last remaining guardian.

```typescript
function removeGuardian(wallet: SigloopWallet, guardian: Address): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `wallet` | [`SigloopWallet`](./types.md#sigloopwallet) | The wallet to remove the guardian from |
| `guardian` | `Address` | The guardian address to remove |

**Returns:** `Promise<Hex>` -- The encoded calldata for the `removeGuardian` contract call.

**Throws:**
- If `guardian` is not a valid address
- If the guardian is not found on the wallet
- If it is the last guardian (`"Cannot remove the last guardian"`)

**Example:**

```typescript
import { removeGuardian } from "@sigloop/sdk";

const calldata = await removeGuardian(wallet, "0xGuardianAddress...");
```

---

### `initiateRecovery`

Initiates a recovery process to transfer wallet ownership to a new address. Requires at least one guardian signature.

```typescript
function initiateRecovery(
  walletAddress: Address,
  newOwner: Address,
  guardianSignatures: Hex[],
  chainId: number
): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The address of the wallet being recovered |
| `newOwner` | `Address` | The address of the new owner |
| `guardianSignatures` | `Hex[]` | Array of guardian approval signatures |
| `chainId` | `number` | The chain ID where the wallet is deployed |

**Returns:** `Promise<Hex>` -- The encoded calldata for the `initiateRecovery` contract call.

**Throws:**
- If `walletAddress` or `newOwner` is not a valid address
- If `guardianSignatures` is empty

**Example:**

```typescript
import { initiateRecovery, SupportedChain } from "@sigloop/sdk";

const calldata = await initiateRecovery(
  wallet.address,
  "0xNewOwnerAddress...",
  ["0xSignature1...", "0xSignature2..."],
  SupportedChain.Base
);
```

---

### `executeRecovery`

Executes a pending recovery request after the timelock has elapsed.

```typescript
function executeRecovery(
  walletAddress: Address,
  newOwner: Address,
  chainId: number
): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The address of the wallet being recovered |
| `newOwner` | `Address` | The address of the new owner (must match the pending request) |
| `chainId` | `number` | The chain ID |

**Returns:** `Promise<Hex>` -- The encoded calldata for the `executeRecovery` contract call.

**Example:**

```typescript
import { executeRecovery, SupportedChain } from "@sigloop/sdk";

const calldata = await executeRecovery(
  wallet.address,
  "0xNewOwnerAddress...",
  SupportedChain.Base
);
```

---

### `getRecoveryRequest`

Reads the current recovery request from the on-chain contract. Returns `null` if no recovery is pending.

```typescript
function getRecoveryRequest(
  walletAddress: Address,
  chainId: number
): Promise<RecoveryRequest | null>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The wallet address to query |
| `chainId` | `number` | The chain ID |

**Returns:** `Promise<RecoveryRequest | null>` -- The pending recovery request, or `null` if none exists.

**Example:**

```typescript
import { getRecoveryRequest, SupportedChain } from "@sigloop/sdk";

const request = await getRecoveryRequest(wallet.address, SupportedChain.Base);
if (request) {
  console.log("Recovery pending for:", request.newOwner);
  console.log("Can execute after:", new Date(Number(request.executeAfter) * 1000));
  console.log("Guardians approved:", request.guardiansApproved);
}
```

---

### `cancelRecovery`

Cancels a pending recovery request. Can only be called by the current wallet owner.

```typescript
function cancelRecovery(walletAddress: Address): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The wallet address |

**Returns:** `Promise<Hex>` -- The encoded calldata for the `cancelRecovery` contract call.

**Example:**

```typescript
import { cancelRecovery } from "@sigloop/sdk";

const calldata = await cancelRecovery(wallet.address);
```

---

[<- Back to README](./README.md) | [Previous: Getting Started](./getting-started.md) | [Next: Agent ->](./agent.md)
