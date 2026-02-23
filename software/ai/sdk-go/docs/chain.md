# Chain

[<< x402](x402.md) | [README](README.md) | [Next: DeFi >>](defi.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/chain"
```

The `chain` package provides multi-chain configuration, registration, and routing. It ships with built-in configurations for Base, Arbitrum, and their Sepolia testnets, and supports registering custom chains. The chain router selects an optimal chain based on speed, cost, and testnet preferences.

---

## Constants

### `SupportedChain`

```go
type SupportedChain string

const (
    Base            SupportedChain = "base"
    Arbitrum        SupportedChain = "arbitrum"
    BaseSepolia     SupportedChain = "base-sepolia"
    ArbitrumSepolia SupportedChain = "arbitrum-sepolia"
)
```

### `DefaultEntryPoint`

```go
var DefaultEntryPoint = common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
```

The ERC-4337 EntryPoint v0.6 address, shared across all built-in chain configurations.

---

## Built-in Chain Configurations

The `Chains` package-level variable contains the default chain registry:

```go
var Chains = map[SupportedChain]ChainConfig{ ... }
```

| Chain | Chain ID | RPC URL | USDC Address | Testnet | Block Time | Gas Multiple |
|-------|----------|---------|--------------|---------|------------|--------------|
| `Base` | 8453 | `https://mainnet.base.org` | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | false | 2s | 1.1x |
| `Arbitrum` | 42161 | `https://arb1.arbitrum.io/rpc` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | false | 1s | 1.2x |
| `BaseSepolia` | 84532 | `https://sepolia.base.org` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | true | 2s | 1.5x |
| `ArbitrumSepolia` | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | true | 1s | 1.5x |

---

## ChainService

`ChainService` manages chain configurations. It is initialized with a copy of the built-in chains and is safe for concurrent use.

### Constructor

#### `NewChainService`

```go
func NewChainService() *ChainService
```

Creates a new `ChainService` populated with all built-in chain configurations.

**Returns:** `*ChainService`

**Example:**

```go
svc := chain.NewChainService()
```

---

### Methods

#### `GetChain`

```go
func (s *ChainService) GetChain(chain SupportedChain) (*ChainConfig, error)
```

Retrieves a chain configuration by its identifier.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chain` | `SupportedChain` | The chain identifier (e.g., `chain.Base`) |

**Returns:**

| Type | Description |
|------|-------------|
| `*ChainConfig` | A pointer to a copy of the chain configuration |
| `error` | Non-nil if the chain is not registered |

**Example:**

```go
cfg, err := svc.GetChain(chain.Base)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Chain: %s (ID: %s)\n", cfg.Name, cfg.ChainID.String())
fmt.Printf("USDC: %s\n", cfg.USDC.Hex())
```

---

#### `ListChains`

```go
func (s *ChainService) ListChains() []ChainConfig
```

Returns all registered chain configurations.

**Parameters:** None

**Returns:** `[]ChainConfig` -- all chains. The order is not guaranteed.

**Example:**

```go
chains := svc.ListChains()
for _, c := range chains {
    testnet := ""
    if c.IsTestnet {
        testnet = " (testnet)"
    }
    fmt.Printf("%s%s - Chain ID %s\n", c.Name, testnet, c.ChainID.String())
}
```

---

#### `RegisterChain`

```go
func (s *ChainService) RegisterChain(cfg ChainConfig)
```

Adds or replaces a chain configuration. Use this to register custom L2s or override built-in settings.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cfg` | `ChainConfig` | The chain configuration to register |

**Example:**

```go
svc.RegisterChain(chain.ChainConfig{
    Name:        "My Custom L2",
    Chain:       chain.SupportedChain("custom-l2"),
    ChainID:     big.NewInt(99999),
    RPCURL:      "https://rpc.custom-l2.io",
    BundlerURL:  "https://bundler.custom-l2.io",
    EntryPoint:  chain.DefaultEntryPoint,
    USDC:        common.HexToAddress("0xCustomUSDC"),
    IsTestnet:   false,
    BlockTime:   3,
    GasMultiple: 1.0,
})
```

---

#### `SelectOptimalChain`

```go
func (s *ChainService) SelectOptimalChain(pref RoutePreference) (*ChainConfig, error)
```

Selects the best chain from the registry based on the given preferences. Each chain is scored using the following rules:

| Preference | Scoring |
|------------|---------|
| `PreferTestnet` | +100 points if `IsTestnet` matches the preference |
| `PreferLowCost` | `+10.0 / GasMultiple` (lower gas = higher score) |
| `PreferSpeed` | `+10.0 / BlockTime` (faster blocks = higher score) |

The chain with the highest aggregate score wins.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `pref` | `RoutePreference` | Routing preferences |

**Returns:**

| Type | Description |
|------|-------------|
| `*ChainConfig` | The optimal chain configuration |
| `error` | Non-nil if no chains are configured |

**Example:**

```go
// Select the fastest, cheapest mainnet chain
cfg, err := svc.SelectOptimalChain(chain.RoutePreference{
    PreferTestnet: false,
    PreferLowCost: true,
    PreferSpeed:   true,
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Optimal chain: %s\n", cfg.Name)
```

```go
// Select a testnet for development
cfg, err := svc.SelectOptimalChain(chain.RoutePreference{
    PreferTestnet: true,
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Testnet: %s\n", cfg.Name)
```

---

## Types

See also: [Types reference](types.md)

### `ChainConfig`

```go
type ChainConfig struct {
    Name        string          // Human-readable chain name
    Chain       SupportedChain  // Chain identifier key
    ChainID     *big.Int        // EVM chain ID
    RPCURL      string          // JSON-RPC endpoint
    BundlerURL  string          // ERC-4337 bundler endpoint
    EntryPoint  common.Address  // ERC-4337 EntryPoint contract address
    USDC        common.Address  // USDC token address on this chain
    IsTestnet   bool            // Whether this is a testnet
    BlockTime   uint64          // Average block time in seconds
    GasMultiple float64         // Gas estimate multiplier (1.0 = no markup)
}
```

### `RoutePreference`

```go
type RoutePreference struct {
    PreferTestnet bool  // Prefer testnet chains over mainnets
    PreferLowCost bool  // Prefer chains with lower gas costs
    PreferSpeed   bool  // Prefer chains with faster block times
}
```

---

[<< x402](x402.md) | [README](README.md) | [Next: DeFi >>](defi.md)
