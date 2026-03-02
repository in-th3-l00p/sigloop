# @sigloop/wallet

ERC-4337 smart wallets powered by ZeroDev Kernel.

## Install

```bash
pnpm add @sigloop/wallet viem
```

## Usage

```ts
import { createWallet, loadWallet } from "@sigloop/wallet"
import { sepolia } from "viem/chains"

const wallet = await createWallet({
  chain: sepolia,
  rpcUrl: "https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID",
})

console.log(wallet.address)
console.log(wallet.privateKey)

const signature = await wallet.signMessage("hello")
const valid = await wallet.verifySignature("hello", signature)

await wallet.sendTransaction({ to: "0x...", value: 0n })
```

## Documentation

See [docs/](docs/README.md) for the full API reference, guides, and examples.

## Scripts

```bash
pnpm build           # compile
pnpm test            # run tests
pnpm example:basic   # create wallet, sign, verify
pnpm example:send    # send transactions
pnpm example:contract # ERC-20 contract calls
pnpm example:composable # advanced composable API
```

## License

MIT
