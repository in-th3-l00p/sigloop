# Signing

## Message Signing

```ts
const signature = await wallet.signMessage("hello")
```

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
