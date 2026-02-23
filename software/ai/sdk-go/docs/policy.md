# Policy

[<< Agent](agent.md) | [README](README.md) | [Next: x402 >>](x402.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/policy"
```

The `policy` package provides fine-grained access control for agent operations. Policies combine spending limits, contract and function allowlists, time windows, and rate limits. Multiple policies can be composed together using intersection semantics.

---

## PolicyService

`PolicyService` manages policy lifecycle. It is safe for concurrent use.

### Constructor

#### `NewPolicyService`

```go
func NewPolicyService() *PolicyService
```

Creates a new `PolicyService` with an empty policy registry.

**Returns:** `*PolicyService`

**Example:**

```go
svc := policy.NewPolicyService()
```

---

### Methods

#### `CreatePolicy`

```go
func (s *PolicyService) CreatePolicy(p *Policy) (*Policy, error)
```

Registers a new policy. Assigns a unique ID (first 16 bytes of `keccak256(timestamp)`, hex-encoded) and sets the `CreatedAt` timestamp.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `p` | `*Policy` | The policy to create (ID and CreatedAt will be overwritten) |

**Returns:**

| Type | Description |
|------|-------------|
| `*Policy` | The policy with its assigned ID and creation timestamp |
| `error` | Non-nil if the policy is nil |

**Example:**

```go
p, err := svc.CreatePolicy(&policy.Policy{
    SpendingLimits: []policy.SpendingLimit{
        *policy.NewSpendingLimit(
            common.HexToAddress("0xUSDC"),
            big.NewInt(5_000_000),
            time.Hour,
        ),
    },
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Policy ID: %s\n", p.ID)
```

---

#### `GetPolicy`

```go
func (s *PolicyService) GetPolicy(id string) (*Policy, error)
```

Retrieves a policy by its ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | `string` | The policy's unique ID |

**Returns:**

| Type | Description |
|------|-------------|
| `*Policy` | The policy |
| `error` | Non-nil if the policy is not found |

**Example:**

```go
p, err := svc.GetPolicy("abc123")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Policy has %d spending limits\n", len(p.SpendingLimits))
```

---

#### `ValidatePolicy`

```go
func (s *PolicyService) ValidatePolicy(p *Policy) error
```

Validates the internal consistency of a policy. Checks that spending limit amounts are positive, periods are valid, time window start/end are consistent, hours are in range 0--23, and rate limit values are positive.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `p` | `*Policy` | The policy to validate |

**Returns:** `error` -- non-nil if any validation rule is violated:
- Nil policy
- Spending limit with nil/non-positive amount or non-positive period
- Time window start after end
- Invalid hours (outside 0--23)
- Rate limit with zero max calls or non-positive period

**Example:**

```go
err := svc.ValidatePolicy(p)
if err != nil {
    fmt.Printf("Policy invalid: %s\n", err)
}
```

---

## Spending Limit Functions

### `NewSpendingLimit`

```go
func NewSpendingLimit(token common.Address, maxAmount *big.Int, period time.Duration) *SpendingLimit
```

Creates a new spending limit for a specific token with automatic period resets.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `token` | `common.Address` | The ERC-20 token address |
| `maxAmount` | `*big.Int` | Maximum amount allowed per period (in token's smallest unit) |
| `period` | `time.Duration` | The rolling period duration |

**Returns:** `*SpendingLimit` -- initialized with `Spent = 0` and `ResetAt = now + period`.

**Example:**

```go
usdc := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
limit := policy.NewSpendingLimit(usdc, big.NewInt(10_000_000), 24*time.Hour)
```

---

### `CheckSpendingLimit`

```go
func CheckSpendingLimit(sl *SpendingLimit, amount *big.Int) error
```

Checks whether a proposed spend fits within the limit without updating any state. Automatically resets the period if it has elapsed.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sl` | `*SpendingLimit` | The spending limit to check against |
| `amount` | `*big.Int` | The proposed amount |

**Returns:** `error` -- non-nil if:
- Spending limit is nil
- Amount is nil or non-positive
- The proposed spend would exceed the maximum

**Example:**

```go
err := policy.CheckSpendingLimit(limit, big.NewInt(1_000_000))
if err != nil {
    fmt.Printf("Would exceed limit: %s\n", err)
}
```

---

### `UpdateSpending`

```go
func UpdateSpending(sl *SpendingLimit, amount *big.Int) error
```

Checks the spending limit and, if allowed, records the spend by adding the amount to `Spent`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sl` | `*SpendingLimit` | The spending limit to update |
| `amount` | `*big.Int` | The amount to record |

**Returns:** `error` -- non-nil if `CheckSpendingLimit` would fail.

**Example:**

```go
err := policy.UpdateSpending(limit, big.NewInt(500_000))
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Spent so far: %s\n", limit.Spent.String())
```

---

## Allowlist Functions

### `NewContractAllowlist`

```go
func NewContractAllowlist(contracts []common.Address) *ContractAllowlist
```

Creates a contract allowlist from a slice of addresses.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `contracts` | `[]common.Address` | Addresses to permit |

**Returns:** `*ContractAllowlist`

**Example:**

```go
allowlist := policy.NewContractAllowlist([]common.Address{
    common.HexToAddress("0xUniswapRouter"),
    common.HexToAddress("0xAavePool"),
})
```

---

### `NewFunctionAllowlist`

```go
func NewFunctionAllowlist(signatures []string) *FunctionAllowlist
```

Creates a function allowlist from Solidity function signatures. Signatures are converted to their 4-byte selectors via `keccak256`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `signatures` | `[]string` | Solidity function signatures (e.g., `"transfer(address,uint256)"`) |

**Returns:** `*FunctionAllowlist` -- stores selectors as hex-encoded strings.

**Example:**

```go
fns := policy.NewFunctionAllowlist([]string{
    "transfer(address,uint256)",
    "approve(address,uint256)",
    "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
})
```

---

### `IsAllowed`

```go
func IsAllowed(p *Policy, contract common.Address, functionSig string) bool
```

Checks whether a contract call is permitted by the policy's allowlists. Both the contract address and the function signature must be allowed (if the respective allowlist is set).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `p` | `*Policy` | The policy to check against |
| `contract` | `common.Address` | The target contract address |
| `functionSig` | `string` | The Solidity function signature (e.g., `"transfer(address,uint256)"`) |

**Returns:** `bool` -- `true` if the call is permitted, `false` otherwise. Returns `false` if the policy is nil.

**Example:**

```go
allowed := policy.IsAllowed(
    p,
    common.HexToAddress("0xUniswapRouter"),
    "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
)
fmt.Printf("Swap allowed: %v\n", allowed)
```

---

## Composition

### `ComposePolicy`

```go
func ComposePolicy(policies ...*Policy) *Policy
```

Merges multiple policies into a single policy using intersection semantics:

- **Spending limits**: All spending limits are concatenated (additive).
- **Contract allowlists**: Union of all allowed contracts.
- **Function allowlists**: Union of all allowed function selectors.
- **Time window**: Intersection -- the latest start and earliest end are kept.
- **Rate limit**: Most restrictive -- the smallest `MaxCalls` and longest `Period` are kept.

Nil policies in the input are skipped.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `policies` | `...*Policy` | Variadic list of policies to compose |

**Returns:** `*Policy` -- the composed policy. The returned policy has no ID or CreatedAt; register it via `PolicyService.CreatePolicy` if needed.

**Example:**

```go
spending := &policy.Policy{
    SpendingLimits: []policy.SpendingLimit{
        *policy.NewSpendingLimit(usdcAddr, big.NewInt(5_000_000), time.Hour),
    },
}

access := &policy.Policy{
    ContractAllowlist: policy.NewContractAllowlist([]common.Address{
        common.HexToAddress("0xRouter"),
    }),
    FunctionAllowlist: policy.NewFunctionAllowlist([]string{
        "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
    }),
}

timing := &policy.Policy{
    TimeWindow: &policy.TimeWindow{
        Start: time.Now(),
        End:   time.Now().Add(7 * 24 * time.Hour),
        Hours: [2]int{9, 17},
    },
    RateLimit: &policy.RateLimit{
        MaxCalls: 100,
        Period:   time.Hour,
    },
}

composed := policy.ComposePolicy(spending, access, timing)
fmt.Printf("Composed policy has %d spending limits\n", len(composed.SpendingLimits))
```

---

## Types

See also: [Types reference](types.md)

### `Policy`

```go
type Policy struct {
    ID                string              // Unique identifier (assigned by PolicyService)
    SpendingLimits    []SpendingLimit     // Per-token spending constraints
    ContractAllowlist *ContractAllowlist  // Permitted contract addresses (nil = all allowed)
    FunctionAllowlist *FunctionAllowlist  // Permitted function selectors (nil = all allowed)
    TimeWindow        *TimeWindow         // Time-based constraints (nil = always valid)
    RateLimit         *RateLimit          // Call frequency constraints (nil = unlimited)
    CreatedAt         time.Time           // Creation timestamp
}
```

### `SpendingLimit`

```go
type SpendingLimit struct {
    Token     common.Address  // ERC-20 token address
    MaxAmount *big.Int        // Maximum amount per period
    Spent     *big.Int        // Amount spent in current period
    Period    time.Duration   // Rolling period duration
    ResetAt   time.Time       // When the current period resets
}
```

### `ContractAllowlist`

```go
type ContractAllowlist struct {
    Contracts map[common.Address]bool  // address -> allowed
}
```

### `FunctionAllowlist`

```go
type FunctionAllowlist struct {
    Functions map[string]bool  // hex-encoded 4-byte selector -> allowed
}
```

### `TimeWindow`

```go
type TimeWindow struct {
    Start time.Time      // Earliest allowed time
    End   time.Time      // Latest allowed time (zero = no end)
    Days  []time.Weekday // Allowed days of the week
    Hours [2]int         // Allowed hours range [start, end] (0-23)
}
```

### `RateLimit`

```go
type RateLimit struct {
    MaxCalls uint64        // Maximum calls per period
    Calls    uint64        // Calls made in current period
    Period   time.Duration // Rolling period duration
    ResetAt  time.Time     // When the current period resets
}
```

---

[<< Agent](agent.md) | [README](README.md) | [Next: x402 >>](x402.md)
