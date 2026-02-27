# Advanced API

Import from `@sigloop/wallet-server/advanced` for full control over individual KMS primitives.

## Composable Pipeline

```
KMS key -> SPKI public key -> Ethereum address + viem signer
```

### Full Example

```ts
import {
  createKmsKey,
  createKmsSigner,
  getKmsPublicKey,
  deriveEthAddressFromSpki,
} from "@sigloop/wallet-server/advanced"
import { KMSClient } from "@aws-sdk/client-kms"

const kmsClient = new KMSClient({ region: "us-east-1" })

const keyId = await createKmsKey({ kmsClient, alias: "composable-demo" })

const spki = await getKmsPublicKey({ kmsClient, keyId })
const { address, publicKey } = deriveEthAddressFromSpki(spki)

const { signer } = await createKmsSigner({ kmsClient, keyId })

const signature = await signer.signMessage({ message: "hello" })
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

## Advanced Exports

### Functions

| Module | Functions |
|---|---|
| Key | `createKey`, `loadKey` |
| KMS Client | `createKmsKey`, `getKmsPublicKey` |
| KMS Signer | `createKmsSigner` |
| KMS Public Key | `deriveEthAddressFromSpki`, `extractUncompressedPublicKey` |
| KMS Signature | `parseDerSignature`, `normalizeS`, `toEthSignature` |
| Constants | `SECP256K1_N`, `SECP256K1_HALF_N`, `DER_SEQUENCE_TAG`, `DER_INTEGER_TAG`, etc. |

### Types

| Type | Description |
|---|---|
| `KmsKey` | Result of `createKey`/`loadKey` with keyId, address, publicKey, and signer |
| `CreateKmsKeyConfig` | KMS key creation options (alias, tags, policy, multi-region) |
| `KmsConfig` | Base config with `kmsClient` and `keyId` |
| `KmsSignerResult` | Result of `createKmsSigner` with signer, address, and public key |
| `DerSignature` | Parsed DER signature with `r` and `s` as bigints |
