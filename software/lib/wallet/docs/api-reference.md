# API Reference

All exports from `@sigloop/wallet`.

## Functions

### `createWallet(config: CreateWalletConfig): Promise<Wallet>`

Generates a new private key and creates a smart account.

### `loadWallet(config: LoadWalletConfig): Promise<Wallet>`

Restores a wallet from an existing private key.

### `generatePrivateKey(): Hex`

Returns a random private key.

### `encodeFunctionData({ abi, functionName, args }): Hex`

ABI-encodes a contract function call.

### `getGasTokenAddress(chainId: number, symbol: string): Address | undefined`

Looks up a gas token address by chain ID and symbol (e.g. `"USDC"`).

### `getGasTokens(chainId: number): Record<string, Address> | undefined`

Returns all available gas tokens for a chain.

## Types

### `Wallet`

```ts
type Wallet = {
  address: Address
  privateKey: Hex

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

### `CreateWalletConfig`

```ts
type CreateWalletConfig = {
  chain: Chain         // viem chain (e.g. sepolia, mainnet)
  rpcUrl: string       // ZeroDev bundler RPC URL
  sponsorGas?: boolean // enable gas sponsorship
  gasToken?: Address   // pay gas with ERC-20 token
}
```

### `LoadWalletConfig`

```ts
type LoadWalletConfig = {
  privateKey: Hex
  chain: Chain
  rpcUrl: string
  sponsorGas?: boolean
  gasToken?: Address
}
```

### `TransactionRequest`

```ts
type TransactionRequest = {
  to: Address
  value?: bigint  // defaults to 0n
  data?: Hex      // defaults to "0x"
}
```
