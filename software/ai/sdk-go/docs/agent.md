# Agent

[<< Wallet](wallet.md) | [README](README.md) | [Next: Policy >>](policy.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/agent"
```

The `agent` package manages AI agent identities that act on behalf of wallets. Each agent is bound to a time-limited session key, enabling scoped and revocable access to wallet operations. The package provides session key generation, serialization, validation, signing, and verification.

---

## Constants

### `AgentStatus`

```go
type AgentStatus int

const (
    AgentStatusActive  AgentStatus = iota // 0 -- agent is active
    AgentStatusRevoked                     // 1 -- agent has been revoked
    AgentStatusExpired                     // 2 -- agent's session key has expired
)
```

---

## AgentService

`AgentService` manages the lifecycle of agents. It is safe for concurrent use.

### Constructor

#### `NewAgentService`

```go
func NewAgentService() *AgentService
```

Creates a new `AgentService` with an empty agent registry.

**Returns:** `*AgentService`

**Example:**

```go
svc := agent.NewAgentService()
```

---

### Methods

#### `CreateAgent`

```go
func (s *AgentService) CreateAgent(params CreateAgentParams) (*Agent, error)
```

Creates a new agent with a freshly generated session key. The agent's ID is derived from the session key address and the wallet address using `keccak256`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `CreateAgentParams` | Agent configuration and target chain ID |

**Returns:**

| Type | Description |
|------|-------------|
| `*Agent` | The newly created agent with its session key |
| `error` | Non-nil if session key generation fails |

**Behavior:**
- Generates a new ECDSA session key pair.
- Agent ID = first 16 bytes of `keccak256(sessionKeyAddress || walletAddress)`, hex-encoded.
- `Status` is set to `AgentStatusActive`.
- `CreatedAt` is set to `time.Now()`.
- `ExpiresAt` = `CreatedAt + params.Config.Duration`.

**Example:**

```go
a, err := svc.CreateAgent(agent.CreateAgentParams{
    Config: agent.AgentConfig{
        Name:          "swap-agent",
        WalletAddress: common.HexToAddress("0xWalletAddress"),
        Duration:      24 * time.Hour,
        Permissions:   []string{"swap", "transfer"},
    },
    ChainID: big.NewInt(8453),
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Agent %s created, expires at %s\n", a.ID, a.ExpiresAt)
```

---

#### `RevokeAgent`

```go
func (s *AgentService) RevokeAgent(id string) error
```

Revokes an agent by setting its status to `AgentStatusRevoked`. A revoked agent can no longer sign transactions.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The agent's unique ID |

**Returns:** `error` -- non-nil if the agent is not found.

**Example:**

```go
err := svc.RevokeAgent(a.ID)
if err != nil {
    log.Fatal(err)
}
```

---

#### `GetAgent`

```go
func (s *AgentService) GetAgent(id string) (*Agent, error)
```

Retrieves an agent by ID. If the agent is active but its expiration time has passed, the status is automatically updated to `AgentStatusExpired`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The agent's unique ID |

**Returns:**

| Type | Description |
|------|-------------|
| `*Agent` | The agent |
| `error` | Non-nil if the agent is not found |

**Example:**

```go
a, err := svc.GetAgent("abc123def456")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Agent status: %d\n", a.Status)
```

---

#### `ListAgents`

```go
func (s *AgentService) ListAgents(walletAddr common.Address) []*Agent
```

Lists all agents associated with a given wallet address. Expired agents are automatically marked.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddr` | `common.Address` | The wallet address to filter by |

**Returns:** `[]*Agent` -- all agents for the wallet. May be nil if none exist.

**Example:**

```go
agents := svc.ListAgents(common.HexToAddress("0xWalletAddress"))
for _, a := range agents {
    fmt.Printf("Agent %s: status=%d, permissions=%v\n",
        a.ID, a.Status, a.Permissions)
}
```

---

## Session Key Functions

Session keys are ephemeral ECDSA key pairs with a validity window and chain binding.

### `GenerateSessionKey`

```go
func GenerateSessionKey(chainID *big.Int, duration time.Duration) (*SessionKey, error)
```

Generates a new session key with the given chain ID and validity duration.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainID` | `*big.Int` | The chain ID the session key is bound to |
| `duration` | `time.Duration` | How long the session key is valid from now |

**Returns:**

| Type | Description |
|------|-------------|
| `*SessionKey` | The generated session key |
| `error` | Non-nil if key generation fails |

**Behavior:**
- `ValidAfter` = current Unix timestamp.
- `ValidUntil` = current Unix timestamp + duration.
- Address is derived from the generated public key.

**Example:**

```go
sk, err := agent.GenerateSessionKey(big.NewInt(8453), 1*time.Hour)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Session key address: %s\n", sk.Address.Hex())
```

---

### `SerializeSessionKey`

```go
func SerializeSessionKey(sk *SessionKey) (string, error)
```

Serializes a session key to a hex-encoded string for storage or transport. The output is 128 bytes: 32 bytes private key + 32 bytes chain ID + 32 bytes validAfter + 32 bytes validUntil.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sk` | `*SessionKey` | The session key to serialize |

**Returns:**

| Type | Description |
|------|-------------|
| `string` | Hex-encoded session key data |
| `error` | Non-nil if the session key or its private key is nil |

**Example:**

```go
encoded, err := agent.SerializeSessionKey(sk)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Encoded key: %s\n", encoded)
```

---

### `DeserializeSessionKey`

```go
func DeserializeSessionKey(encoded string) (*SessionKey, error)
```

Reconstructs a session key from its hex-encoded representation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `encoded` | `string` | Hex-encoded session key (produced by `SerializeSessionKey`) |

**Returns:**

| Type | Description |
|------|-------------|
| `*SessionKey` | The reconstructed session key |
| `error` | Non-nil if decoding fails or data is too short (< 128 bytes) |

**Example:**

```go
sk, err := agent.DeserializeSessionKey(encoded)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Deserialized address: %s\n", sk.Address.Hex())
```

---

### `ValidateSessionKey`

```go
func ValidateSessionKey(sk *SessionKey) error
```

Validates that a session key is well-formed and currently within its validity window.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sk` | `*SessionKey` | The session key to validate |

**Returns:** `error` -- non-nil if:
- Session key is nil
- Private key is missing
- Chain ID is nil or non-positive
- Current time is before `ValidAfter`
- Current time is after `ValidUntil`
- Address does not match the public key

**Example:**

```go
if err := agent.ValidateSessionKey(sk); err != nil {
    fmt.Printf("Session key invalid: %s\n", err)
}
```

---

### `SignWithSessionKey`

```go
func SignWithSessionKey(sk *SessionKey, hash []byte) ([]byte, error)
```

Signs a 32-byte hash using the session key's private key. The session key is validated before signing.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sk` | `*SessionKey` | The session key to sign with |
| `hash` | `[]byte` | The 32-byte hash to sign |

**Returns:**

| Type | Description |
|------|-------------|
| `[]byte` | The 65-byte ECDSA signature (`[R || S || V]`) |
| `error` | Non-nil if validation or signing fails |

**Example:**

```go
hash := crypto.Keccak256([]byte("message"))
sig, err := agent.SignWithSessionKey(sk, hash)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Signature: 0x%x\n", sig)
```

---

### `VerifySessionKeySignature`

```go
func VerifySessionKeySignature(pubKey *ecdsa.PublicKey, hash []byte, sig []byte) bool
```

Verifies an ECDSA signature against a public key and hash.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `pubKey` | `*ecdsa.PublicKey` | The public key to verify against |
| `hash` | `[]byte` | The 32-byte hash that was signed |
| `sig` | `[]byte` | The 65-byte signature to verify |

**Returns:** `bool` -- `true` if the signature is valid, `false` otherwise. Returns `false` immediately if the signature is not exactly 65 bytes.

**Example:**

```go
valid := agent.VerifySessionKeySignature(sk.PublicKey, hash, sig)
fmt.Printf("Signature valid: %v\n", valid)
```

---

## Types

See also: [Types reference](types.md)

### `Agent`

```go
type Agent struct {
    ID            string          // Unique identifier (hex-encoded keccak256 truncation)
    Name          string          // Human-readable agent name
    WalletAddress common.Address  // Wallet this agent acts on behalf of
    SessionKey    *SessionKey     // Ephemeral session key
    Status        AgentStatus     // Current status (active, revoked, expired)
    CreatedAt     time.Time       // Creation timestamp
    ExpiresAt     time.Time       // Expiration timestamp
    Permissions   []string        // List of permitted action names
}
```

### `AgentConfig`

```go
type AgentConfig struct {
    Name          string          // Human-readable name
    WalletAddress common.Address  // Target wallet address
    Duration      time.Duration   // Validity duration
    Permissions   []string        // Permitted actions
}
```

### `SessionKey`

```go
type SessionKey struct {
    PrivateKey *ecdsa.PrivateKey  // ECDSA private key
    PublicKey  *ecdsa.PublicKey   // ECDSA public key
    Address    common.Address    // Derived Ethereum address
    ValidAfter *big.Int          // Unix timestamp: key becomes valid
    ValidUntil *big.Int          // Unix timestamp: key expires
    ChainID    *big.Int          // Chain the key is bound to
}
```

### `CreateAgentParams`

```go
type CreateAgentParams struct {
    Config  AgentConfig  // Agent configuration
    ChainID *big.Int     // Target chain ID for session key
}
```

---

[<< Wallet](wallet.md) | [README](README.md) | [Next: Policy >>](policy.md)
