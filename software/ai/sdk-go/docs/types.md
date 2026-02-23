# Types

[<< DeFi](defi.md) | [README](README.md) | [Next: Encoding >>](encoding.md)

---

This page is a comprehensive reference for every exported type in the Sigloop Go SDK, organized by package.

---

## Package `sigloop`

```go
import "github.com/sigloop/sdk-go"
```

### `SigloopClient`

The top-level client that aggregates all services.

```go
type SigloopClient struct {
    WalletService *wallet.WalletService  // Smart wallet management
    AgentService  *agent.AgentService    // Agent lifecycle and session keys
    PolicyService *policy.PolicyService  // Policy creation and enforcement
    X402Service   *x402.BudgetTracker    // x402 budget tracking
    ChainService  *chain.ChainService    // Multi-chain configuration
    DeFiService   *defi.DeFiService      // DeFi transaction building
}
```

---

## Package `wallet`

```go
import "github.com/sigloop/sdk-go/wallet"
```

### `Wallet`

Represents an ERC-4337 smart contract wallet.

```go
type Wallet struct {
    Address    common.Address  // Counterfactual on-chain address (CREATE2-derived)
    Owner      common.Address  // Current owner of the wallet
    EntryPoint common.Address  // ERC-4337 EntryPoint contract address
    Factory    common.Address  // Account factory used for deployment
    Salt       *big.Int        // Salt used in CREATE2 address derivation
    ChainID    *big.Int        // Chain the wallet is deployed on
    Guardians  []Guardian      // Social recovery guardians
    IsDeployed bool            // Whether the contract has been deployed on-chain
    Nonce      uint64          // Current transaction nonce
}
```

### `WalletConfig`

Configuration for the wallet subsystem.

```go
type WalletConfig struct {
    EntryPoint common.Address  // ERC-4337 EntryPoint contract address
    Factory    common.Address  // Account factory contract address
    ChainID    *big.Int        // Target chain ID
    BundlerURL string          // ERC-4337 bundler endpoint URL
    RPCURL     string          // JSON-RPC endpoint URL for the chain
}
```

### `CreateWalletParams`

Parameters for creating a new wallet.

```go
type CreateWalletParams struct {
    Owner     common.Address    // Owner address for the new wallet
    Salt      *big.Int          // CREATE2 salt (nil defaults to 0)
    Guardians []common.Address  // Initial guardian addresses
    Config    WalletConfig      // Wallet configuration
}
```

### `Guardian`

A social recovery guardian associated with a wallet.

```go
type Guardian struct {
    Address   common.Address  // Guardian's Ethereum address
    AddedAt   uint64          // Unix timestamp when the guardian was added (0 = at creation)
    Threshold uint8           // Number of guardian approvals required for recovery
}
```

### `RecoveryRequest`

A pending social recovery operation.

```go
type RecoveryRequest struct {
    WalletAddress common.Address            // Address of the wallet being recovered
    NewOwner      common.Address            // Proposed new owner
    Approvals     map[common.Address][]byte // Map of guardian address to their approval signature
    Threshold     uint8                     // Number of approvals required to execute
    Executed      bool                      // Whether the recovery has been executed
}
```

### `WalletService`

Service for wallet CRUD and guardian management. Thread-safe.

```go
type WalletService struct {
    // unexported fields
}
```

### `RecoveryService`

Service for social recovery operations. Thread-safe.

```go
type RecoveryService struct {
    // unexported fields
}
```

---

## Package `agent`

```go
import "github.com/sigloop/sdk-go/agent"
```

### `AgentStatus`

Enum representing the lifecycle state of an agent.

```go
type AgentStatus int

const (
    AgentStatusActive  AgentStatus = 0  // Agent is active and can operate
    AgentStatusRevoked AgentStatus = 1  // Agent has been manually revoked
    AgentStatusExpired AgentStatus = 2  // Agent's session key has expired
)
```

### `Agent`

An AI agent identity bound to a wallet and session key.

```go
type Agent struct {
    ID            string          // Unique hex-encoded identifier
    Name          string          // Human-readable agent name
    WalletAddress common.Address  // Wallet this agent acts on behalf of
    SessionKey    *SessionKey     // Ephemeral session key for signing
    Status        AgentStatus     // Current lifecycle status
    CreatedAt     time.Time       // When the agent was created
    ExpiresAt     time.Time       // When the agent's session key expires
    Permissions   []string        // List of permitted action names
}
```

### `AgentConfig`

Configuration for creating a new agent.

```go
type AgentConfig struct {
    Name          string          // Human-readable name for the agent
    WalletAddress common.Address  // Wallet the agent will operate on
    Duration      time.Duration   // How long the agent's session key is valid
    Permissions   []string        // List of permitted action names
}
```

### `SessionKey`

An ephemeral ECDSA key pair with a chain binding and validity window.

```go
type SessionKey struct {
    PrivateKey *ecdsa.PrivateKey  // ECDSA private key for signing
    PublicKey  *ecdsa.PublicKey   // Corresponding public key
    Address    common.Address    // Ethereum address derived from the public key
    ValidAfter *big.Int          // Unix timestamp: key becomes valid
    ValidUntil *big.Int          // Unix timestamp: key expires
    ChainID    *big.Int          // Chain ID the key is bound to
}
```

### `CreateAgentParams`

Parameters for creating a new agent.

```go
type CreateAgentParams struct {
    Config  AgentConfig  // Agent configuration (name, wallet, duration, permissions)
    ChainID *big.Int     // Chain ID for the session key
}
```

### `AgentService`

Service for agent lifecycle management. Thread-safe.

```go
type AgentService struct {
    // unexported fields
}
```

---

## Package `policy`

```go
import "github.com/sigloop/sdk-go/policy"
```

### `Policy`

A set of constraints that govern agent behavior.

```go
type Policy struct {
    ID                string              // Unique identifier (assigned by PolicyService)
    SpendingLimits    []SpendingLimit     // Per-token spending constraints
    ContractAllowlist *ContractAllowlist  // Permitted contract addresses (nil = unrestricted)
    FunctionAllowlist *FunctionAllowlist  // Permitted function selectors (nil = unrestricted)
    TimeWindow        *TimeWindow         // Time-based constraints (nil = always valid)
    RateLimit         *RateLimit          // Call frequency constraints (nil = unlimited)
    CreatedAt         time.Time           // When the policy was created
}
```

### `SpendingLimit`

A per-token spending constraint with rolling period resets.

```go
type SpendingLimit struct {
    Token     common.Address  // ERC-20 token contract address
    MaxAmount *big.Int        // Maximum amount allowed per period
    Spent     *big.Int        // Amount spent in the current period
    Period    time.Duration   // Duration of each rolling period
    ResetAt   time.Time       // When the current period resets
}
```

### `ContractAllowlist`

Restricts interactions to a set of permitted contract addresses.

```go
type ContractAllowlist struct {
    Contracts map[common.Address]bool  // address -> true if allowed
}
```

### `FunctionAllowlist`

Restricts interactions to a set of permitted function selectors.

```go
type FunctionAllowlist struct {
    Functions map[string]bool  // hex-encoded 4-byte selector -> true if allowed
}
```

### `TimeWindow`

Time-based constraints for when operations are permitted.

```go
type TimeWindow struct {
    Start time.Time      // Earliest allowed time (zero = no start restriction)
    End   time.Time      // Latest allowed time (zero = no end restriction)
    Days  []time.Weekday // Allowed days of the week (empty = all days)
    Hours [2]int         // Allowed hour range [start_hour, end_hour], 0-23
}
```

### `RateLimit`

Limits the number of operations per time period.

```go
type RateLimit struct {
    MaxCalls uint64        // Maximum number of calls per period
    Calls    uint64        // Number of calls made in the current period
    Period   time.Duration // Duration of each rolling period
    ResetAt  time.Time     // When the current period resets
}
```

### `PolicyService`

Service for policy creation, retrieval, and validation. Thread-safe.

```go
type PolicyService struct {
    // unexported fields
}
```

---

## Package `x402`

```go
import "github.com/sigloop/sdk-go/x402"
```

### `PaymentRequirement`

Describes a payment required to access an HTTP resource. Parsed from a 402 response body.

```go
type PaymentRequirement struct {
    Scheme            string                 `json:"scheme"`           // Payment scheme (e.g., "exact")
    Network           string                 `json:"network"`          // Network name (e.g., "base")
    MaxAmountRequired string                 `json:"maxAmountRequired"` // Amount as decimal string
    Resource          string                 `json:"resource"`         // The resource URL
    Description       string                 `json:"description"`     // Human-readable description
    MimeType          string                 `json:"mimeType"`        // MIME type of the resource
    PayTo             common.Address         `json:"payTo"`           // Recipient address
    RequiredDeadline  string                 `json:"requiredDeadline"` // Unix timestamp deadline
    Extra             map[string]interface{} `json:"extra"`           // Additional scheme-specific data
}
```

### `X402Config`

Configuration for the x402 transport layer.

```go
type X402Config struct {
    MaxAmount      *big.Int  // Maximum amount willing to pay per request
    AutoPay        bool      // Automatically handle 402 responses
    AllowedSchemes []string  // Accepted payment schemes (empty = any)
    BudgetPeriod   uint64    // Budget period duration in seconds
}
```

### `PaymentRecord`

Records a completed payment.

```go
type PaymentRecord struct {
    Resource  string          // URL of the resource paid for
    Amount    *big.Int        // Amount paid in token's smallest unit
    PayTo     common.Address  // Recipient address
    Timestamp uint64          // Unix timestamp of payment
    TxHash    common.Hash     // On-chain transaction hash
    Network   string          // Network the payment was made on
}
```

### `X402Policy`

Payment policy governing what payments are permitted.

```go
type X402Policy struct {
    MaxPerRequest  *big.Int                // Maximum amount per single payment
    MaxPerPeriod   *big.Int                // Maximum total amount per budget period
    AllowedPayees  map[common.Address]bool // Permitted payee addresses (nil = any)
    AllowedDomains map[string]bool         // Permitted domain names (nil = any)
}
```

### `BudgetState`

Internal state of the budget tracker.

```go
type BudgetState struct {
    TotalSpent     *big.Int        // Cumulative total spent across all periods
    PeriodSpent    *big.Int        // Amount spent in the current period
    PeriodStart    uint64          // Unix timestamp when current period started
    PeriodDuration uint64          // Period length in seconds
    Records        []PaymentRecord // History of all payments
}
```

### `X402Transport`

HTTP transport that handles 402 Payment Required responses. Implements `http.RoundTripper`.

```go
type X402Transport struct {
    Base       http.RoundTripper   // Underlying HTTP transport
    PrivateKey *ecdsa.PrivateKey   // Key for signing payments
    From       common.Address     // Payer's Ethereum address
    ChainID    *big.Int           // Chain ID for EIP-712 domain
    Budget     *BudgetTracker     // Budget tracker (may be nil)
    Policy     *X402Policy        // Payment policy (may be nil)
    Config     X402Config         // Transport configuration
}
```

### `BudgetTracker`

Tracks spending against a policy with rolling period resets. Thread-safe.

```go
type BudgetTracker struct {
    // unexported fields
}
```

---

## Package `chain`

```go
import "github.com/sigloop/sdk-go/chain"
```

### `SupportedChain`

String type for chain identifiers.

```go
type SupportedChain string

const (
    Base            SupportedChain = "base"
    Arbitrum        SupportedChain = "arbitrum"
    BaseSepolia     SupportedChain = "base-sepolia"
    ArbitrumSepolia SupportedChain = "arbitrum-sepolia"
)
```

### `ChainConfig`

Full configuration for a blockchain network.

```go
type ChainConfig struct {
    Name        string          // Human-readable chain name
    Chain       SupportedChain  // Chain identifier key
    ChainID     *big.Int        // EVM chain ID
    RPCURL      string          // JSON-RPC endpoint URL
    BundlerURL  string          // ERC-4337 bundler endpoint URL
    EntryPoint  common.Address  // ERC-4337 EntryPoint contract address
    USDC        common.Address  // USDC token address on this chain
    IsTestnet   bool            // Whether the chain is a testnet
    BlockTime   uint64          // Average block time in seconds
    GasMultiple float64         // Gas estimate multiplier
}
```

### `RoutePreference`

Preferences for the chain routing algorithm.

```go
type RoutePreference struct {
    PreferTestnet bool  // Favor testnet chains
    PreferLowCost bool  // Favor chains with lower gas costs
    PreferSpeed   bool  // Favor chains with faster block times
}
```

### `ChainService`

Service for chain configuration management and routing. Thread-safe.

```go
type ChainService struct {
    // unexported fields
}
```

---

## Package `defi`

```go
import "github.com/sigloop/sdk-go/defi"
```

### `SwapParams`

Parameters for a token swap operation.

```go
type SwapParams struct {
    TokenIn   common.Address  // Input token contract address
    TokenOut  common.Address  // Output token contract address
    AmountIn  *big.Int        // Amount of input token to swap
    MinOut    *big.Int        // Minimum acceptable output (nil = 0)
    Recipient common.Address  // Address to receive output tokens
    Deadline  *big.Int        // Unix timestamp swap deadline (nil = 0)
    Router    common.Address  // DEX router contract address
}
```

### `LendingParams`

Parameters for lending protocol interactions (supply, borrow, repay).

```go
type LendingParams struct {
    Token    common.Address  // Token address
    Amount   *big.Int        // Amount in token's smallest unit
    Pool     common.Address  // Lending pool contract address
    OnBehalf common.Address  // Beneficiary address (zero = defaults to pool)
}
```

### `StakeParams`

Parameters for staking operations (reserved for future use).

```go
type StakeParams struct {
    Token     common.Address  // Token to stake
    Amount    *big.Int        // Staking amount
    Validator common.Address  // Target validator address
}
```

### `DeFiResult`

The output of a DeFi transaction builder method.

```go
type DeFiResult struct {
    To       common.Address  // Target contract address for the transaction
    Data     []byte          // ABI-encoded calldata
    Value    *big.Int        // ETH value to attach (typically 0 for ERC-20 ops)
    GasLimit uint64          // Suggested gas limit for the transaction
}
```

### `DeFiService`

Service for building DeFi transaction calldata.

```go
type DeFiService struct {
    // unexported fields
}
```

---

## Package `encoding`

```go
import "github.com/sigloop/sdk-go/encoding"
```

### `PolicyEncoding`

ABI-encodable representation of a policy for on-chain verification.

```go
type PolicyEncoding struct {
    SpendingTokens  []common.Address  // Token addresses with spending limits
    SpendingAmounts []*big.Int        // Corresponding maximum amounts
    Contracts       []common.Address  // Allowed contract addresses
    FunctionSigs    [][4]byte         // Allowed 4-byte function selectors
    ValidAfter      *big.Int          // Unix timestamp: policy becomes valid
    ValidUntil      *big.Int          // Unix timestamp: policy expires
    RateMaxCalls    *big.Int          // Maximum calls per rate period
    RatePeriod      *big.Int          // Rate period in seconds
}
```

### `UserOperation`

An ERC-4337 UserOperation for account abstraction.

```go
type UserOperation struct {
    Sender               common.Address  // Smart account address
    Nonce                *big.Int        // Anti-replay nonce
    InitCode             []byte          // Factory + init data for first-time deployment
    CallData             []byte          // Encoded call to execute
    CallGasLimit         *big.Int        // Gas for the main execution call
    VerificationGasLimit *big.Int        // Gas for signature verification
    PreVerificationGas   *big.Int        // Gas overhead (calldata, bundler fees)
    MaxFeePerGas         *big.Int        // Maximum fee per gas unit
    MaxPriorityFeePerGas *big.Int        // Maximum priority fee (tip)
    PaymasterAndData     []byte          // Paymaster address + paymaster-specific data
    Signature            []byte          // ECDSA signature over the UserOp hash
}
```

---

[<< DeFi](defi.md) | [README](README.md) | [Next: Encoding >>](encoding.md)
