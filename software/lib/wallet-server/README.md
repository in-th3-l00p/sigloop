# @sigloop/wallet-server

AWS KMS key management for Ethereum signers. Creates and loads secp256k1 keys in AWS KMS, exposing them as viem-compatible signers.

## Install

```bash
pnpm add @sigloop/wallet-server @aws-sdk/client-kms viem
```

## Usage

```ts
import { createKey, loadKey } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"

const kmsClient = new KMSClient({ region: "us-east-1" })

const key = await createKey({
  kmsClient,
  alias: "my-agent-key",
})

console.log(key.address)
console.log(key.keyId)

const signature = await key.signer.signMessage({ message: "hello" })

const reloaded = await loadKey({ kmsClient, keyId: key.keyId })
```

## Documentation

See [docs/](docs/README.md) for the full API reference, guides, and examples.

## Scripts

```bash
pnpm build              # compile
pnpm test               # run tests
pnpm example:basic      # create KMS key, sign, reload
pnpm example:composable # advanced composable API with KMS primitives
```

## License

MIT
