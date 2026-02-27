# @sigloop/wallet-server

AWS KMS-backed server-side wallets for ERC-4337 smart accounts.

## Install

```bash
pnpm add @sigloop/wallet-server @aws-sdk/client-kms viem
```

## Usage

```ts
import { createKmsWallet, loadKmsWallet } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"
import { sepolia } from "viem/chains"

const kmsClient = new KMSClient({ region: "us-east-1" })

const wallet = await createKmsWallet({
  kmsClient,
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
  sponsorGas: true,
  alias: "my-agent-wallet",
})

console.log(wallet.address)
console.log(wallet.keyId)

const signature = await wallet.signMessage("hello")
const valid = await wallet.verifySignature("hello", signature)

await wallet.sendTransaction({ to: "0x...", value: 0n })
```

## Documentation

See [docs/](docs/README.md) for the full API reference, guides, and examples.

## Scripts

```bash
pnpm build              # compile
pnpm test               # run tests
pnpm example:basic      # create KMS wallet, sign, verify, reload
pnpm example:composable # advanced composable API with KMS signer
```

## License

MIT
