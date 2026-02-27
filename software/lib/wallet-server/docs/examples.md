# Examples

All examples live in the [`examples/`](../examples/) directory.

## Setup

Create an `examples/.env` file:

```
AWS_REGION=us-east-1
ZERODEV_RPC_URL=https://rpc.zerodev.app/api/v2/bundler/YOUR_PROJECT_ID
```

AWS credentials must be configured via environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), shared credentials file, or IAM role.

## Running

| Example | Run | Description |
|---|---|---|
| [basic-kms-wallet.ts](../examples/basic-kms-wallet.ts) | `pnpm example:basic` | Create KMS wallet, sign/verify messages, reload from key ID |
| [composable-kms.ts](../examples/composable-kms.ts) | `pnpm example:composable` | Build from individual KMS + smart account components (advanced API) |
