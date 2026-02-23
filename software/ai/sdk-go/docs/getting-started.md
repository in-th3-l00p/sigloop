# Getting Started

[<< README](README.md) | [Next: Wallet >>](wallet.md)

---

## Installation

Add the SDK to your Go module:

```bash
go get github.com/sigloop/sdk-go
```

The SDK requires **Go 1.25.6** or later.

## Import Paths

```go
import (
    "github.com/sigloop/sdk-go"           // top-level client
    "github.com/sigloop/sdk-go/wallet"     // wallet management
    "github.com/sigloop/sdk-go/agent"      // agent + session keys
    "github.com/sigloop/sdk-go/policy"     // policy enforcement
    "github.com/sigloop/sdk-go/x402"       // HTTP 402 payments
    "github.com/sigloop/sdk-go/chain"      // chain configuration
    "github.com/sigloop/sdk-go/defi"       // DeFi operations
    "github.com/sigloop/sdk-go/encoding"   // ABI & UserOp encoding
)
```

## Creating a Client

The entry point for the SDK is `sigloop.NewClient`. It initializes every sub-service and wires them together.

```go
package main

import (
    "fmt"
    "math/big"

    "github.com/ethereum/go-ethereum/common"
    "github.com/sigloop/sdk-go"
    "github.com/sigloop/sdk-go/wallet"
    "github.com/sigloop/sdk-go/x402"
)

func main() {
    // 1. Configure the wallet subsystem
    walletCfg := wallet.WalletConfig{
        EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
        Factory:    common.HexToAddress("0xYourFactory"),
        ChainID:    big.NewInt(8453), // Base mainnet
        BundlerURL: "https://bundler.base.org",
        RPCURL:     "https://mainnet.base.org",
    }

    // 2. Define an x402 payment policy
    x402Policy := x402.X402Policy{
        MaxPerRequest: big.NewInt(1_000_000),  // 1 USDC (6 decimals)
        MaxPerPeriod:  big.NewInt(10_000_000), // 10 USDC per period
    }

    // 3. Create the client (budget period = 86400 seconds = 24 hours)
    client := sigloop.NewClient(walletCfg, x402Policy, 86400)

    fmt.Println("Sigloop client initialized")
    _ = client
}
```

### Signature

```go
func NewClient(walletConfig wallet.WalletConfig, x402Policy x402.X402Policy, budgetPeriod uint64) *SigloopClient
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `walletConfig` | `wallet.WalletConfig` | Entry point address, factory address, chain ID, bundler URL, and RPC URL |
| `x402Policy` | `x402.X402Policy` | Limits for per-request and per-period spending, plus payee and domain allowlists |
| `budgetPeriod` | `uint64` | Budget tracking period duration in seconds |

## Creating a Wallet

Once you have a client, create a smart contract wallet:

```go
owner := common.HexToAddress("0xOwnerAddress")

w, err := client.WalletService.CreateWallet(wallet.CreateWalletParams{
    Owner: owner,
    Salt:  big.NewInt(0),
    Guardians: []common.Address{
        common.HexToAddress("0xGuardian1"),
    },
    Config: walletCfg,
})
if err != nil {
    panic(err)
}

fmt.Printf("Wallet address: %s\n", w.Address.Hex())
```

## Creating an Agent with a Session Key

Agents are time-bounded identities that can act on behalf of a wallet:

```go
import (
    "time"
    "github.com/sigloop/sdk-go/agent"
)

a, err := client.AgentService.CreateAgent(agent.CreateAgentParams{
    Config: agent.AgentConfig{
        Name:          "trading-bot",
        WalletAddress: w.Address,
        Duration:      24 * time.Hour,
        Permissions:   []string{"swap", "transfer"},
    },
    ChainID: big.NewInt(8453),
})
if err != nil {
    panic(err)
}

fmt.Printf("Agent ID: %s\n", a.ID)
fmt.Printf("Session key address: %s\n", a.SessionKey.Address.Hex())
```

## Applying a Policy

Restrict agent behavior with spending limits and allowlists:

```go
import "github.com/sigloop/sdk-go/policy"

usdcAddr := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")

p := &policy.Policy{
    SpendingLimits: []policy.SpendingLimit{
        *policy.NewSpendingLimit(usdcAddr, big.NewInt(5_000_000), time.Hour),
    },
    ContractAllowlist: policy.NewContractAllowlist([]common.Address{
        common.HexToAddress("0xRouterAddress"),
    }),
}

created, err := client.PolicyService.CreatePolicy(p)
if err != nil {
    panic(err)
}

fmt.Printf("Policy ID: %s\n", created.ID)
```

## Making an x402 Payment-Enabled HTTP Request

Use the x402 transport to auto-handle 402 responses:

```go
import (
    "crypto/ecdsa"
    "net/http"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/sigloop/sdk-go/x402"
)

privateKey, _ := crypto.GenerateKey()

httpClient := x402.NewX402Client(
    privateKey,
    big.NewInt(8453),
    client.X402Service,
    &x402Policy,
    x402.X402Config{
        AutoPay:        true,
        MaxAmount:      big.NewInt(1_000_000),
        AllowedSchemes: []string{"exact"},
    },
)

resp, err := httpClient.Get("https://api.example.com/paid-resource")
if err != nil {
    panic(err)
}
defer resp.Body.Close()
```

## Selecting a Chain

Use the chain router to pick the best network:

```go
import "github.com/sigloop/sdk-go/chain"

cfg, err := client.ChainService.SelectOptimalChain(chain.RoutePreference{
    PreferTestnet: false,
    PreferLowCost: true,
    PreferSpeed:   true,
})
if err != nil {
    panic(err)
}

fmt.Printf("Selected chain: %s (ID %s)\n", cfg.Name, cfg.ChainID.String())
```

---

[<< README](README.md) | [Next: Wallet >>](wallet.md)
