# Examples

All examples live in the [`examples/`](../examples/) directory.

## Setup

Create an `examples/.env` file:

```
AWS_REGION=us-east-1
```

AWS credentials must be configured via environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), shared credentials file, or IAM role.

## Running

| Example | Run | Description |
|---|---|---|
| [basic-kms-key.ts](../examples/basic-kms-key.ts) | `pnpm example:basic` | Create KMS key, sign a message, reload from key ID |
| [composable-kms.ts](../examples/composable-kms.ts) | `pnpm example:composable` | Use individual KMS primitives (advanced API) |
