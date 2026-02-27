# Advanced API

Import from `@sigloop/wallet-server/advanced` for full control over individual components.

## Composable Pipeline

```
KMS key -> KMS signer -> validator -> account -> client -> send/sign
```

### Full Example

```ts
import { createKmsSigner, createKmsKey } from "@sigloop/wallet-server/advanced"
import {
  createEcdsaValidator,
  createSmartAccount,
  createPaymaster,
  createAccountClient,
  signMessage,
  verifySignature,
} from "@sigloop/wallet/advanced"
import { KMSClient } from "@aws-sdk/client-kms"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"

const kmsClient = new KMSClient({ region: "us-east-1" })

// 1. Create KMS key
const keyId = await createKmsKey({ kmsClient, alias: "composable-demo" })

// 2. Create KMS signer
const { signer, address, publicKey } = await createKmsSigner({ kmsClient, keyId })

// 3. Public client
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://sepolia.drpc.org"),
})

// 4. Validator
const validator = await createEcdsaValidator(publicClient, { signer })

// 5. Smart account
const account = await createSmartAccount(publicClient, { validator, index: 0n })

// 6. Paymaster
const paymasterClient = createPaymaster({
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
})

// 7. Account client
const client = createAccountClient({
  account,
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
  publicClient,
  paymaster: { type: "sponsor", paymasterClient },
})

// 8. Use it
const sig = await signMessage(client, "hello")
const hash = await sendTransaction(client, { to: "0x...", value: 0n })
```

## KMS Internals

For low-level access to KMS cryptographic primitives:

```ts
import {
  getKmsPublicKey,
  deriveEthAddressFromSpki,
  extractUncompressedPublicKey,
  parseDerSignature,
  normalizeS,
  toEthSignature,
} from "@sigloop/wallet-server/advanced"
```

### Deriving an Address from a KMS Key

```ts
const spki = await getKmsPublicKey({ kmsClient, keyId })
const { address, publicKey } = deriveEthAddressFromSpki(spki)
```

### Parsing DER Signatures

```ts
const { r, s } = parseDerSignature(derBytes)
const normalizedS = normalizeS(s)
```

## Multiple Accounts from One KMS Key

Use the `index` parameter to derive multiple smart accounts from a single KMS key:

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
| Wallet | `createKmsWallet`, `loadKmsWallet` |
| KMS Client | `createKmsKey`, `getKmsPublicKey` |
| KMS Signer | `createKmsSigner` |
| KMS Public Key | `deriveEthAddressFromSpki`, `extractUncompressedPublicKey` |
| KMS Signature | `parseDerSignature`, `normalizeS`, `toEthSignature` |
| Constants | `SECP256K1_N`, `SECP256K1_HALF_N`, `DER_SEQUENCE_TAG`, `DER_INTEGER_TAG`, etc. |

### Types

| Type | Description |
|---|---|
| `KmsWalletConfig` | Config for loading an existing KMS wallet |
| `CreateKmsWalletConfig` | Config for creating a new KMS wallet with key options |
| `CreateKmsKeyConfig` | KMS key creation options (alias, tags, policy, multi-region) |
| `KmsConfig` | Base config with `kmsClient` and `keyId` |
| `KmsSignerResult` | Result of `createKmsSigner` with signer, address, and public key |
| `DerSignature` | Parsed DER signature with `r` and `s` as bigints |
| `EntryPointVersion` | `"0.6" \| "0.7"` |
| `KernelVersion` | `"0.2.2" \| "0.2.3" \| ... \| "0.3.3"` |
