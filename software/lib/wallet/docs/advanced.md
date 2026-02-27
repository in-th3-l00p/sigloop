# Advanced API

Import from `@sigloop/wallet/advanced` for full control over individual components.

## Composable Pipeline

```
signer -> validator -> account -> client -> send/sign
```

### Full Example

```ts
import {
  createSigner,
  createEcdsaValidator,
  createSmartAccount,
  createPaymaster,
  createAccountClient,
  sendTransaction,
  signMessage,
  verifySignature,
} from "@sigloop/wallet/advanced"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"

// 1. Signer
const signer = createSigner("0xPRIVATE_KEY")

// 2. Public client
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://sepolia.drpc.org"),
})

// 3. Validator
const validator = await createEcdsaValidator(publicClient, { signer })

// 4. Smart account
const account = await createSmartAccount(publicClient, { validator, index: 0n })

// 5. Paymaster
const paymasterClient = createPaymaster({
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
})

// 6. Account client
const client = createAccountClient({
  account,
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
  publicClient,
  paymaster: { type: "sponsor", paymasterClient },
})

// 7. Use it
const sig = await signMessage(client, "hello")
const hash = await sendTransaction(client, { to: "0x...", value: 0n })
```

## `buildWallet`

Shortcut that accepts the full `WalletConfig` with all advanced options:

```ts
import { buildWallet } from "@sigloop/wallet/advanced"

const wallet = await buildWallet("0xPRIVATE_KEY", {
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
  publicRpcUrl: "https://sepolia.drpc.org",
  index: 2n,
  kernelVersion: "0.3.1",
  entryPointVersion: "0.7",
  sponsorGas: true,
})
```

## Multiple Accounts from One Key

Use the `index` parameter to derive multiple smart accounts from a single private key:

```ts
for (let i = 0n; i < 3n; i++) {
  const account = await createSmartAccount(publicClient, { validator, index: i })
  console.log(`Account ${i}:`, account.address)
}
```

## Advanced Exports

### Functions

| Module | Functions |
|---|---|
| Signer | `createSigner`, `randomSigner`, `generatePrivateKey` |
| Validator | `createEcdsaValidator`, `signerToEcdsaValidator`, `getKernelAddressFromECDSA` |
| Account | `createSmartAccount`, `createKernelAccount` |
| Paymaster | `createPaymaster`, `createZeroDevPaymasterClient` |
| Client | `createAccountClient`, `createKernelAccountClient` |
| Transactions | `sendTransaction`, `sendTransactions`, `sendUserOperation`, `sendContractCall`, `encodeFunctionData` |
| Signing | `signMessage`, `signTypedData`, `verifySignature`, `verifyEIP6492Signature` |
| Gas | `getGasTokenAddress`, `getGasTokens`, `getERC20ApproveCall`, `getERC20PaymasterApproveCall`, `gasTokenAddresses` |
| Constants | `DEFAULT_ENTRY_POINT_VERSION`, `DEFAULT_KERNEL_VERSION`, `KERNEL_V3_1`, etc. |

### Types

| Type | Description |
|---|---|
| `WalletConfig` | Full config with `index`, `kernelVersion`, `entryPointVersion`, `publicRpcUrl` |
| `ValidatorConfig` | ECDSA validator options |
| `AccountConfig` | Smart account options |
| `PaymasterConfig` | Paymaster client options |
| `ClientConfig` | Account client options |
| `PaymasterOptions` | `{ type: "sponsor" }`, `{ type: "erc20", gasToken }`, or `{ type: "none" }` |
| `EntryPointVersion` | `"0.6" \| "0.7"` |
| `KernelVersion` | `"0.2.2" \| "0.2.3" \| ... \| "0.3.3"` |
