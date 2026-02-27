# Examples

All examples live in the [`examples/`](../examples/) directory.

## Setup

Create an `examples/.env` file:

```
ZERODEV_RPC_URL=https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID
PRIVATE_KEY=0x...
PUBLIC_RPC_URL=https://sepolia.drpc.org
```

`PRIVATE_KEY` is optional for `basic-wallet.ts` (it generates one). `PUBLIC_RPC_URL` is only used by `composable.ts`.

## Running

| Example | Run | Description |
|---|---|---|
| [basic-wallet.ts](../examples/basic-wallet.ts) | `pnpm example:basic` | Create wallet, sign/verify messages, reload |
| [send-transaction.ts](../examples/send-transaction.ts) | `pnpm example:send` | Send single and batch transactions |
| [contract-call.ts](../examples/contract-call.ts) | `pnpm example:contract` | ERC-20 transfers, gas token lookup |
| [composable.ts](../examples/composable.ts) | `pnpm example:composable` | Build from individual components (advanced API) |
