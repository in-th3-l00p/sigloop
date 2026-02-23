# Utils

[<- Back to README](./README.md) | [Previous: Types](./types.md)

---

The utils module provides low-level encoding and validation helpers used internally by the SDK. All functions are also exported from the package root for advanced use cases.

```typescript
import {
  // Encoding
  encodePolicy,
  decodePolicy,
  computePolicyId,
  encodeSessionKeyData,
  encodeGuardianData,
  encodeBridgeData,
  generateNonce,
  // Validation
  validateAddress,
  validateAmount,
  validateHex,
  validatePolicy,
  validateChainId,
  validateUrl,
} from "@sigloop/sdk";
```

---

## Encoding

Source: `src/utils/encoding.ts`

### `encodePolicy`

ABI-encodes a complete policy into a single hex string. Encodes each rule individually based on its type, then packs them with the composition operator flag.

```typescript
function encodePolicy(policy: Policy): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `policy` | [`Policy`](./types.md#policy) | The policy to encode |

**Returns:** `Hex` -- ABI-encoded bytes: `(uint8 composition, bytes[] rules)`.

**Encoding scheme:**
- Composition flag: `0` = AND, `1` = OR
- Each rule is encoded based on its type:
  - `spending`: `(uint8 ruleType=0, uint256 maxPerTx, uint256 maxDaily, uint256 maxWeekly, address token)`
  - `contract-allowlist`: `(uint8 ruleType=1, address[] contracts)`
  - `function-allowlist`: `(uint8 ruleType=2, address contract, bytes4[] selectors)`
  - `time-window`: `(uint8 ruleType=3, uint48 validAfter, uint48 validUntil)`
  - `rate-limit`: `(uint8 ruleType=4, uint32 maxCalls, uint32 interval)`

**Example:**

```typescript
import { encodePolicy, composePolicy, createRateLimitPerHour } from "@sigloop/sdk";

const policy = composePolicy([createRateLimitPerHour(10)]);
const encoded = encodePolicy(policy);
console.log("Encoded:", encoded); // "0x..."
```

---

### `decodePolicy`

Decodes ABI-encoded policy data back into its composition operator and raw rule bytes.

```typescript
function decodePolicy(encoded: Hex): {
  composition: "AND" | "OR";
  rules: Hex[];
}
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `encoded` | `Hex` | The ABI-encoded policy bytes |

**Returns:** An object with:
- `composition` -- `"AND"` or `"OR"`
- `rules` -- Array of individually encoded rule bytes

**Example:**

```typescript
import { decodePolicy } from "@sigloop/sdk";

const decoded = decodePolicy("0x...");
console.log("Operator:", decoded.composition); // "AND" or "OR"
console.log("Rule count:", decoded.rules.length);
```

---

### `computePolicyId`

Computes a unique identifier for a set of policy rules by hashing the encoded rules with keccak256.

```typescript
function computePolicyId(rules: PolicyRule[]): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `rules` | `PolicyRule[]` | The rules to hash |

**Returns:** `Hex` -- A 32-byte keccak256 hash.

**Example:**

```typescript
import { computePolicyId, createRateLimitPerHour, createEthSpendingLimit } from "@sigloop/sdk";

const id = computePolicyId([
  createEthSpendingLimit(100000000000000000n, 500000000000000000n, 2000000000000000000n),
  createRateLimitPerHour(10),
]);
console.log("Policy ID:", id);
```

---

### `encodeSessionKeyData`

ABI-encodes session key registration data for the on-chain validator.

```typescript
function encodeSessionKeyData(
  sessionPublicKey: Address,
  validAfter: number,
  validUntil: number,
  policyData: Hex
): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionPublicKey` | `Address` | The session key's public address |
| `validAfter` | `number` | Unix timestamp when the key becomes valid |
| `validUntil` | `number` | Unix timestamp when the key expires |
| `policyData` | `Hex` | ABI-encoded policy data (from `encodePolicy`) |

**Returns:** `Hex` -- ABI-encoded `(address sessionKey, uint48 validAfter, uint48 validUntil, bytes policyData)`.

**Example:**

```typescript
import { encodeSessionKeyData, encodePolicy, composePolicy, createRateLimitPerHour } from "@sigloop/sdk";

const policy = composePolicy([createRateLimitPerHour(5)]);
const policyData = encodePolicy(policy);

const sessionData = encodeSessionKeyData(
  "0xSessionKeyAddress...",
  1700000000,
  1700086400,
  policyData
);
```

---

### `encodeGuardianData`

ABI-encodes guardian configuration for the social recovery module.

```typescript
function encodeGuardianData(guardians: Address[], threshold: number): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `guardians` | `Address[]` | Array of guardian addresses |
| `threshold` | `number` | Minimum number of guardians required for recovery |

**Returns:** `Hex` -- ABI-encoded `(address[] guardians, uint8 threshold)`.

**Example:**

```typescript
import { encodeGuardianData } from "@sigloop/sdk";

const encoded = encodeGuardianData(
  ["0xGuardian1...", "0xGuardian2...", "0xGuardian3..."],
  2 // 2-of-3 threshold
);
```

---

### `encodeBridgeData`

ABI-encodes bridge operation metadata.

```typescript
function encodeBridgeData(
  sourceChain: number,
  destChain: number,
  token: Address,
  amount: bigint,
  recipient: Address
): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sourceChain` | `number` | Source chain ID |
| `destChain` | `number` | Destination chain ID |
| `token` | `Address` | Token being bridged |
| `amount` | `bigint` | Amount being bridged |
| `recipient` | `Address` | Recipient on the destination chain |

**Returns:** `Hex` -- ABI-encoded `(uint32 sourceChain, uint32 destChain, address token, uint256 amount, address recipient)`.

**Example:**

```typescript
import { encodeBridgeData, SupportedChain } from "@sigloop/sdk";

const data = encodeBridgeData(
  SupportedChain.Base,
  SupportedChain.Arbitrum,
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  1000000000000000000n,
  "0xRecipient..."
);
```

---

### `generateNonce`

Generates a cryptographically random 32-byte nonce using the Web Crypto API.

```typescript
function generateNonce(): Hex
```

**Returns:** `Hex` -- A random 32-byte hex string (66 characters including `0x` prefix).

**Example:**

```typescript
import { generateNonce } from "@sigloop/sdk";

const nonce = generateNonce();
console.log("Nonce:", nonce); // "0x3a7f..."
```

---

## Validation

Source: `src/utils/validation.ts`

All validation functions throw an `Error` with a descriptive message if validation fails. When validation succeeds, the function either returns `true` (for type guards) or `void`.

---

### `validateAddress`

Validates that a string is a valid Ethereum address using viem's `isAddress`.

```typescript
function validateAddress(address: string): address is Address
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `address` | `string` | The string to validate |

**Returns:** `true` (type guard narrowing to `Address`).

**Throws:** `"Invalid address: <address>"` if not a valid Ethereum address.

**Example:**

```typescript
import { validateAddress } from "@sigloop/sdk";

validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"); // true
validateAddress("not-an-address"); // throws Error
```

---

### `validateAmount`

Validates that a bigint amount is non-negative.

```typescript
function validateAmount(amount: bigint, label?: string): void
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `amount` | `bigint` | -- | The amount to validate |
| `label` | `string` | `"amount"` | A label used in the error message |

**Throws:** `"<label> must be non-negative, got <amount>"` if amount is negative.

**Example:**

```typescript
import { validateAmount } from "@sigloop/sdk";

validateAmount(100n);            // OK
validateAmount(0n);              // OK
validateAmount(-1n, "deposit");  // throws: "deposit must be non-negative, got -1"
```

---

### `validateHex`

Validates that a string is a valid hex value using viem's `isHex`.

```typescript
function validateHex(value: string): value is Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `string` | The string to validate |

**Returns:** `true` (type guard narrowing to `Hex`).

**Throws:** `"Invalid hex value: <value>"` if not valid hex.

**Example:**

```typescript
import { validateHex } from "@sigloop/sdk";

validateHex("0xdeadbeef"); // true
validateHex("not-hex");    // throws Error
```

---

### `validatePolicy`

Validates a complete policy object: checks that it has at least one rule, a valid composition operator, and that each individual rule is well-formed.

```typescript
function validatePolicy(policy: Policy): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `policy` | [`Policy`](./types.md#policy) | The policy to validate |

**Throws:**
- `"Policy must have at least one rule"` if `rules` is empty
- `"Policy must have a composition"` if `composition` is missing
- `"Invalid composition operator: <op>"` if operator is not AND or OR
- Various rule-specific errors (invalid addresses, negative amounts, empty allowlists, etc.)

**Example:**

```typescript
import { validatePolicy, composePolicy, createRateLimitPerHour } from "@sigloop/sdk";

const policy = composePolicy([createRateLimitPerHour(5)]);
validatePolicy(policy); // OK, no error thrown
```

---

### `validateChainId`

Validates that a chain ID is one of the supported values (8453, 42161, 84532, 421614).

```typescript
function validateChainId(chainId: number): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | `number` | The chain ID to validate |

**Throws:** `"Unsupported chain ID: <chainId>. Supported: 8453, 42161, 84532, 421614"` if not supported.

**Example:**

```typescript
import { validateChainId } from "@sigloop/sdk";

validateChainId(8453);   // OK
validateChainId(1);      // throws: "Unsupported chain ID: 1. Supported: 8453, 42161, 84532, 421614"
```

---

### `validateUrl`

Validates that a string is a valid URL by attempting to construct a `URL` object.

```typescript
function validateUrl(url: string): void
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | The URL string to validate |

**Throws:** `"Invalid URL: <url>"` if the string cannot be parsed as a URL.

**Example:**

```typescript
import { validateUrl } from "@sigloop/sdk";

validateUrl("https://api.example.com/v1"); // OK
validateUrl("not a url");                  // throws Error
```

---

[<- Back to README](./README.md) | [Previous: Types](./types.md)
