# Agent

[<- Back to README](./README.md) | [Previous: Wallet](./wallet.md) | [Next: Policy ->](./policy.md)

---

The agent module manages AI agent identities backed by session keys. Each agent receives a scoped session key bound to a policy and a time window. Session keys allow the agent to sign transactions on behalf of the smart wallet without holding the owner's private key.

```typescript
import {
  createAgent,
  buildEnableSessionKeyCalldata,
  revokeAgent,
  buildRevokeCalldata,
  isAgentActive,
  listAgents,
  generateSessionKey,
  sessionKeyFromPrivateKey,
  serializeSessionKey,
  deserializeSessionKey,
  isSessionKeyExpired,
  isSessionKeyActive,
  getSessionKeyRemainingTime,
} from "@sigloop/sdk";
```

---

## Agent Lifecycle

### `createAgent`

Creates a new agent with a freshly generated session key bound to the provided policy. The session key is generated internally and included in the returned `Agent` object.

```typescript
function createAgent(params: CreateAgentParams): Promise<Agent>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | [`CreateAgentParams`](./types.md#createagentparams) | Agent creation parameters |

`CreateAgentParams` fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `walletAddress` | `Address` | Yes | The smart wallet this agent operates on |
| `owner` | `LocalAccount` | Yes | The wallet owner authorizing the agent |
| `config` | [`AgentConfig`](./types.md#agentconfig) | Yes | Agent name, description, policy, and session duration |
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | Yes | The chain where the agent operates |

`AgentConfig` fields:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Human-readable agent name |
| `description` | `string` | No | `undefined` | Optional description |
| `policy` | [`Policy`](./types.md#policy) | Yes | -- | The policy governing agent actions |
| `sessionDurationSeconds` | `number` | No | `86400` (24h) | Session key validity period in seconds |

**Returns:** `Promise<Agent>` -- The created agent with its session key and metadata.

**Example:**

```typescript
import { createAgent, composePolicy, createSpendingLimit, SupportedChain } from "@sigloop/sdk";
import { privateKeyToAccount } from "viem/accounts";

const owner = privateKeyToAccount("0x...");

const policy = composePolicy([
  createSpendingLimit({
    tokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    maxPerTransaction: 100000000000000000n,
    maxDaily: 500000000000000000n,
    maxWeekly: 2000000000000000000n,
  }),
]);

const agent = await createAgent({
  walletAddress: "0xMyWallet...",
  owner,
  config: {
    name: "swap-agent",
    description: "Performs token swaps on Uniswap",
    policy,
    sessionDurationSeconds: 3600, // 1 hour
  },
  chainId: SupportedChain.Base,
});

console.log("Agent ID:", agent.id);
console.log("Session key address:", agent.sessionKey.publicKey);
console.log("Active:", agent.isActive);
console.log("Expires:", new Date(agent.expiresAt * 1000));
```

---

### `buildEnableSessionKeyCalldata`

Builds the raw calldata to enable a session key on the smart account's session key validator module. Useful when you need to construct the UserOperation manually.

```typescript
function buildEnableSessionKeyCalldata(
  sessionKeyAddress: Address,
  validAfter: number,
  validUntil: number,
  policy: Policy
): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKeyAddress` | `Address` | The public address of the session key |
| `validAfter` | `number` | Unix timestamp when the key becomes valid |
| `validUntil` | `number` | Unix timestamp when the key expires |
| `policy` | [`Policy`](./types.md#policy) | The policy to enforce for this session key |

**Returns:** `Hex` -- ABI-encoded calldata for `enableSessionKey`.

**Example:**

```typescript
import { buildEnableSessionKeyCalldata, generateSessionKey, composePolicy, createRateLimitPerHour } from "@sigloop/sdk";

const sessionKey = generateSessionKey(3600);
const policy = composePolicy([createRateLimitPerHour(5)]);

const calldata = buildEnableSessionKeyCalldata(
  sessionKey.publicKey,
  sessionKey.validAfter,
  sessionKey.validUntil,
  policy
);
```

---

## Revocation

### `revokeAgent`

Revokes an agent by disabling its session key. Sets `agent.isActive` to `false` on the local object and returns the calldata to disable the key on-chain.

```typescript
function revokeAgent(agent: Agent): Promise<Hex>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `agent` | [`Agent`](./types.md#agent) | The agent to revoke |

**Returns:** `Promise<Hex>` -- ABI-encoded calldata for `disableSessionKey`.

**Example:**

```typescript
import { revokeAgent } from "@sigloop/sdk";

const calldata = await revokeAgent(agent);
console.log("Agent revoked:", !agent.isActive);
// Submit calldata as a UserOperation to disable on-chain
```

---

### `buildRevokeCalldata`

Builds the raw calldata to disable a session key by address, without needing a full `Agent` object.

```typescript
function buildRevokeCalldata(sessionKeyAddress: Address): Hex
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKeyAddress` | `Address` | The session key address to revoke |

**Returns:** `Hex` -- ABI-encoded calldata for `disableSessionKey`.

**Throws:** If `sessionKeyAddress` is not a valid address.

**Example:**

```typescript
import { buildRevokeCalldata } from "@sigloop/sdk";

const calldata = buildRevokeCalldata("0xSessionKeyAddress...");
```

---

### `isAgentActive`

Queries the on-chain session key validator to check if an agent's session key is currently active and within its validity window.

```typescript
function isAgentActive(
  walletAddress: Address,
  sessionKeyAddress: Address,
  chainId: SupportedChain
): Promise<boolean>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The smart wallet address |
| `sessionKeyAddress` | `Address` | The session key address to check |
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain to query |

**Returns:** `Promise<boolean>` -- `true` if the session key is active and within its validity window.

**Example:**

```typescript
import { isAgentActive, SupportedChain } from "@sigloop/sdk";

const active = await isAgentActive(
  "0xMyWallet...",
  agent.sessionKey.publicKey,
  SupportedChain.Base
);
console.log("On-chain active:", active);
```

---

## Listing Agents

### `AgentInfo`

```typescript
interface AgentInfo {
  sessionKeyAddress: Address;
  walletAddress: Address;
  validAfter: number;
  validUntil: number;
  isActive: boolean;
  isExpired: boolean;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionKeyAddress` | `Address` | The session key's public address |
| `walletAddress` | `Address` | The smart wallet address |
| `validAfter` | `number` | Unix timestamp when the key became valid |
| `validUntil` | `number` | Unix timestamp when the key expires |
| `isActive` | `boolean` | Whether the key is currently active and within its time window |
| `isExpired` | `boolean` | Whether the key's validity period has passed |

### `listAgents`

Lists all agents (session keys) associated with a wallet. First attempts to read from the on-chain registry contract. If that fails, falls back to scanning recent `SessionKeyEnabled` and `SessionKeyDisabled` events from the last 10,000 blocks.

```typescript
function listAgents(
  walletAddress: Address,
  chainId: SupportedChain
): Promise<AgentInfo[]>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddress` | `Address` | The smart wallet to query |
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain to query |

**Returns:** `Promise<AgentInfo[]>` -- Array of agent information objects.

**Example:**

```typescript
import { listAgents, SupportedChain } from "@sigloop/sdk";

const agents = await listAgents("0xMyWallet...", SupportedChain.Base);

for (const agent of agents) {
  console.log(`Key: ${agent.sessionKeyAddress}`);
  console.log(`  Active: ${agent.isActive}`);
  console.log(`  Expired: ${agent.isExpired}`);
  console.log(`  Valid until: ${new Date(agent.validUntil * 1000)}`);
}
```

---

## Session Key Management

### `generateSessionKey`

Generates a new random session key pair with a specified validity duration.

```typescript
function generateSessionKey(
  durationSeconds?: number,
  nonce?: bigint
): SessionKey
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `durationSeconds` | `number` | `86400` | How long the key is valid, in seconds |
| `nonce` | `bigint` | Current unix timestamp as bigint | A unique nonce for the key |

**Returns:** [`SessionKey`](./types.md#sessionkey) -- The generated session key object.

**Example:**

```typescript
import { generateSessionKey } from "@sigloop/sdk";

const key = generateSessionKey(7200); // 2-hour key
console.log("Address:", key.publicKey);
console.log("Valid from:", new Date(key.validAfter * 1000));
console.log("Valid until:", new Date(key.validUntil * 1000));
```

---

### `sessionKeyFromPrivateKey`

Reconstructs a `SessionKey` from an existing private key and validity parameters.

```typescript
function sessionKeyFromPrivateKey(
  privateKey: Hex,
  validAfter: number,
  validUntil: number,
  nonce: bigint
): SessionKey
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `privateKey` | `Hex` | The private key in hex |
| `validAfter` | `number` | Unix timestamp when the key becomes valid |
| `validUntil` | `number` | Unix timestamp when the key expires |
| `nonce` | `bigint` | The key's nonce |

**Returns:** [`SessionKey`](./types.md#sessionkey) -- The reconstructed session key.

**Example:**

```typescript
import { sessionKeyFromPrivateKey } from "@sigloop/sdk";

const key = sessionKeyFromPrivateKey(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  1700000000,
  1700086400,
  1700000000n
);
```

---

### `serializeSessionKey`

Serializes a `SessionKey` to a JSON-safe format. Converts the `nonce` bigint to a string and removes the `account` field.

```typescript
function serializeSessionKey(sessionKey: SessionKey): SerializedSessionKey
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKey` | [`SessionKey`](./types.md#sessionkey) | The session key to serialize |

**Returns:** [`SerializedSessionKey`](./types.md#serializedsessionkey) -- A JSON-serializable representation.

**Example:**

```typescript
import { generateSessionKey, serializeSessionKey } from "@sigloop/sdk";

const key = generateSessionKey();
const serialized = serializeSessionKey(key);
const json = JSON.stringify(serialized);
// Store json in a database or send over the network
```

---

### `deserializeSessionKey`

Deserializes a `SerializedSessionKey` back into a full `SessionKey` with a reconstructed `LocalAccount`.

```typescript
function deserializeSessionKey(serialized: SerializedSessionKey): SessionKey
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `serialized` | [`SerializedSessionKey`](./types.md#serializedsessionkey) | The serialized key |

**Returns:** [`SessionKey`](./types.md#sessionkey) -- The reconstructed session key.

**Example:**

```typescript
import { deserializeSessionKey } from "@sigloop/sdk";

const serialized = JSON.parse(storedJson);
const key = deserializeSessionKey(serialized);
console.log("Restored key address:", key.publicKey);
```

---

### `isSessionKeyExpired`

Checks whether a session key has passed its `validUntil` timestamp.

```typescript
function isSessionKeyExpired(sessionKey: SessionKey): boolean
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKey` | [`SessionKey`](./types.md#sessionkey) | The session key to check |

**Returns:** `boolean` -- `true` if the current time is at or past `validUntil`.

---

### `isSessionKeyActive`

Checks whether a session key is currently within its validity window (`validAfter <= now < validUntil`).

```typescript
function isSessionKeyActive(sessionKey: SessionKey): boolean
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKey` | [`SessionKey`](./types.md#sessionkey) | The session key to check |

**Returns:** `boolean` -- `true` if the key is currently active.

---

### `getSessionKeyRemainingTime`

Returns the number of seconds remaining until a session key expires. Returns `0` if already expired.

```typescript
function getSessionKeyRemainingTime(sessionKey: SessionKey): number
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sessionKey` | [`SessionKey`](./types.md#sessionkey) | The session key to check |

**Returns:** `number` -- Remaining seconds, or `0` if expired.

**Example:**

```typescript
import {
  generateSessionKey,
  isSessionKeyActive,
  isSessionKeyExpired,
  getSessionKeyRemainingTime,
} from "@sigloop/sdk";

const key = generateSessionKey(3600);

console.log("Active:", isSessionKeyActive(key));           // true
console.log("Expired:", isSessionKeyExpired(key));         // false
console.log("Remaining:", getSessionKeyRemainingTime(key)); // ~3600
```

---

[<- Back to README](./README.md) | [Previous: Wallet](./wallet.md) | [Next: Policy ->](./policy.md)
