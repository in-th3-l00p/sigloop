# KMS Keys

## Creating Keys

`createKey` creates a new KMS key and returns a ready-to-use signer. You can also create keys separately using `createKmsKey`:

```ts
import { createKmsKey } from "@sigloop/wallet-server"
import { KMSClient } from "@aws-sdk/client-kms"

const kmsClient = new KMSClient({ region: "us-east-1" })

const keyId = await createKmsKey({
  kmsClient,
  alias: "agent-key-1",
  description: "Production agent signer",
})
```

All keys are created with `ECC_SECG_P256K1` spec and `SIGN_VERIFY` usage.

## Key Aliases

Aliases provide human-readable names for KMS keys. Prefix with `alias/` or let the library add it:

```ts
const keyId = await createKmsKey({
  kmsClient,
  alias: "my-key",       // becomes alias/my-key
})
```

## Tags

Attach metadata to keys for cost allocation and organization:

```ts
const keyId = await createKmsKey({
  kmsClient,
  tags: {
    Environment: "production",
    Team: "agents",
    Purpose: "signer",
  },
})
```

## Multi-Region Keys

Create keys that can be replicated across AWS regions:

```ts
const keyId = await createKmsKey({
  kmsClient,
  multiRegion: true,
})
```

## Custom Key Policies

Pass a custom IAM key policy as a JSON string:

```ts
const keyId = await createKmsKey({
  kmsClient,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "AllowAgentSigning",
        Effect: "Allow",
        Principal: { AWS: "arn:aws:iam::123456789:role/agent-role" },
        Action: ["kms:Sign", "kms:GetPublicKey"],
        Resource: "*",
      },
    ],
  }),
})
```
