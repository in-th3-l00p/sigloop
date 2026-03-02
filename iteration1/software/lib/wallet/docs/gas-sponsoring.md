# Gas Sponsoring

## Sponsored Gas

Enable `sponsorGas` to make transactions gasless for the user. Gas is paid by your ZeroDev project's paymaster.

```ts
const wallet = await loadWallet({
  privateKey: "0x...",
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
  sponsorGas: true,
})

await wallet.sendTransaction({ to: "0x...", value: 0n })
```

Requires gas sponsoring policies configured in your [ZeroDev dashboard](https://dashboard.zerodev.app).

## ERC-20 Gas Tokens

Pay gas fees with ERC-20 tokens instead of the native currency.

```ts
import { loadWallet, getGasTokenAddress } from "@sigloop/wallet"
import { sepolia } from "viem/chains"

const wallet = await loadWallet({
  privateKey: "0x...",
  chain: sepolia,
  rpcUrl: BUNDLER_RPC_URL,
  gasToken: getGasTokenAddress(sepolia.id, "USDC"),
})
```

### Lookup Available Tokens

```ts
import { getGasTokenAddress, getGasTokens } from "@sigloop/wallet"

// single token
const usdc = getGasTokenAddress(11155111, "USDC")

// all tokens for a chain
const tokens = getGasTokens(11155111)
// { USDC: "0x...", DAI: "0x...", ... }
```
