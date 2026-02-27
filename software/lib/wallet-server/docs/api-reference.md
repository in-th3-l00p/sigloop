# API Reference

All exports from `@sigloop/wallet-server`.

## Functions

### `createKmsWallet(config: CreateKmsWalletConfig): Promise<KmsWallet>`

Creates a new KMS key and builds a smart account around it.

### `loadKmsWallet(config: KmsWalletConfig): Promise<KmsWallet>`

Restores a wallet from an existing KMS key ID.

### `createKmsKey(config: CreateKmsKeyConfig): Promise<string>`

Creates a secp256k1 KMS key and returns its key ID.

## Types

### `KmsWallet`

```ts
type KmsWallet = {
  address: Address
  keyId: string
  publicKey: Hex

  sendTransaction(tx: TransactionRequest): Promise<Hex>
  sendTransactions(txs: TransactionRequest[]): Promise<Hex>
  sendContractCall(params: {
    address: Address
    abi: Abi
    functionName: string
    args?: unknown[]
    value?: bigint
  }): Promise<Hex>

  signMessage(message: string): Promise<Hex>
  signTypedData(typedData: TypedDataDefinition): Promise<Hex>
  verifySignature(message: string, signature: Hex): Promise<boolean>
}
```

### `KmsWalletConfig`

```ts
type KmsWalletConfig = {
  kmsClient: KMSClient
  keyId: string
  chain: Chain
  rpcUrl: string
  publicRpcUrl?: string
  index?: bigint
  sponsorGas?: boolean
  gasToken?: Address
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
}
```

### `CreateKmsWalletConfig`

```ts
type CreateKmsWalletConfig = {
  kmsClient: KMSClient
  chain: Chain
  rpcUrl: string
  publicRpcUrl?: string
  index?: bigint
  sponsorGas?: boolean
  gasToken?: Address
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
  alias?: string
  description?: string
  tags?: Record<string, string>
  policy?: string
  multiRegion?: boolean
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

### `EntryPointVersion`

```ts
type EntryPointVersion = "0.6" | "0.7"
```

### `KernelVersion`

```ts
type KernelVersion =
  | "0.2.2" | "0.2.3" | "0.2.4"
  | "0.3.0" | "0.3.1" | "0.3.2" | "0.3.3"
```
