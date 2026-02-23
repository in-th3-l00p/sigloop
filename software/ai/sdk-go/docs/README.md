# Sigloop Go SDK Documentation

The Sigloop Go SDK provides a comprehensive toolkit for building autonomous AI agents with on-chain capabilities. It wraps ERC-4337 smart account infrastructure, session key management, policy enforcement, x402 payment protocol support, multi-chain routing, and DeFi operations into a single, composable client.

## Module Path

```
github.com/sigloop/sdk-go
```

## Installation

```bash
go get github.com/sigloop/sdk-go
```

## Quick Example

```go
package main

import (
    "math/big"

    "github.com/ethereum/go-ethereum/common"
    "github.com/sigloop/sdk-go"
    "github.com/sigloop/sdk-go/wallet"
    "github.com/sigloop/sdk-go/x402"
)

func main() {
    cfg := wallet.WalletConfig{
        EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
        Factory:    common.HexToAddress("0xYourFactory"),
        ChainID:    big.NewInt(8453),
        BundlerURL: "https://bundler.base.org",
        RPCURL:     "https://mainnet.base.org",
    }

    policy := x402.X402Policy{
        MaxPerRequest: big.NewInt(1_000_000), // 1 USDC
        MaxPerPeriod:  big.NewInt(10_000_000), // 10 USDC
    }

    client := sigloop.NewClient(cfg, policy, 86400)
    _ = client
}
```

## Table of Contents

| Page | Description |
|------|-------------|
| [Getting Started](getting-started.md) | Installation, quick start, and basic client setup |
| [Wallet](wallet.md) | `WalletService` -- create, retrieve, list wallets; guardian management and social recovery |
| [Agent](agent.md) | `AgentService` -- session keys, agent lifecycle, signing and verification |
| [Policy](policy.md) | `PolicyService` -- spending limits, contract/function allowlists, time windows, rate limits, composition |
| [x402](x402.md) | `X402Transport` -- HTTP 402 payment middleware, budget tracking, payment signing, client construction |
| [Chain](chain.md) | `ChainService` -- multi-chain configuration, registry, optimal chain selection |
| [DeFi](defi.md) | `DeFiService` -- token swaps, lending supply, borrow, repay |
| [Types](types.md) | All exported Go structs and type definitions with field-level descriptions |
| [Encoding](encoding.md) | ABI encoding helpers, UserOperation packing, calldata construction |

## Architecture

The top-level `SigloopClient` struct aggregates every service into a single entry point:

```go
type SigloopClient struct {
    WalletService *wallet.WalletService
    AgentService  *agent.AgentService
    PolicyService *policy.PolicyService
    X402Service   *x402.BudgetTracker
    ChainService  *chain.ChainService
    DeFiService   *defi.DeFiService
}
```

### `NewClient`

```go
func NewClient(walletConfig wallet.WalletConfig, x402Policy x402.X402Policy, budgetPeriod uint64) *SigloopClient
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletConfig` | `wallet.WalletConfig` | Configuration for the wallet subsystem (entry point, factory, chain ID, bundler/RPC URLs) |
| `x402Policy` | `x402.X402Policy` | Payment policy governing per-request and per-period spending limits |
| `budgetPeriod` | `uint64` | Duration in seconds for the budget tracking period |

**Returns:** `*SigloopClient` -- a fully initialized client with all services wired together.

## Dependencies

- [go-ethereum](https://github.com/ethereum/go-ethereum) v1.17.0 -- Ethereum types, ABI encoding, and cryptographic primitives
- [ZKM Ziren](https://github.com/ProjectZKM/Ziren) -- Zero-knowledge VM runtime (indirect)

---

[Next: Getting Started >>](getting-started.md)
