# API Reference

All exports from `@sigloop/wallet-server`.

## Functions

### `createKey(config: CreateKmsKeyConfig): Promise<KmsKey>`

Creates a new KMS key and returns a signer with derived Ethereum address.

### `loadKey(config: KmsConfig): Promise<KmsKey>`

Loads an existing KMS key by ID and returns a signer with derived Ethereum address.

### `createKmsKey(config: CreateKmsKeyConfig): Promise<string>`

Creates a secp256k1 KMS key and returns its key ID. Lower-level than `createKey`.

## Types

### `KmsKey`

```ts
type KmsKey = {
  keyId: string
  address: Address
  publicKey: Hex
  signer: LocalAccount
}
```

### `CreateKmsKeyConfig`

```ts
type CreateKmsKeyConfig = {
  kmsClient: KMSClient
  alias?: string
  description?: string
  tags?: Record<string, string>
  policy?: string
  multiRegion?: boolean
}
```

### `KmsConfig`

```ts
type KmsConfig = {
  kmsClient: KMSClient
  keyId: string
}
```

### `KmsSignerResult`

```ts
type KmsSignerResult = {
  signer: LocalAccount
  address: Address
  publicKey: Hex
}
```

### `DerSignature`

```ts
type DerSignature = {
  r: bigint
  s: bigint
}
```
