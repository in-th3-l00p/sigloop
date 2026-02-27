# Signing

## Message Signing

```ts
const signature = await wallet.signMessage("hello")
```

All signing operations are delegated to AWS KMS. The private key never leaves the HSM.

## Signature Verification

```ts
const valid = await wallet.verifySignature("hello", signature)
```

Uses EIP-6492 verification, which works for both deployed and counterfactual (not yet deployed) smart accounts.

## Typed Data (EIP-712)

```ts
const signature = await wallet.signTypedData({
  domain: { name: "MyApp", version: "1", chainId: 1 },
  types: { Order: [{ name: "amount", type: "uint256" }] },
  primaryType: "Order",
  message: { amount: 100n },
})
```

## How KMS Signing Works

1. The message hash is sent to AWS KMS
2. KMS signs the digest using `ECDSA_SHA_256` with the secp256k1 key
3. The DER-encoded signature is parsed into `(r, s)` components
4. `s` is normalized to the lower half of the curve (EIP-2)
5. Recovery ID `v` (27 or 28) is determined by trial recovery
