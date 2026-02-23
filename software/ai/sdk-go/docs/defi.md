# DeFi

[<< Chain](chain.md) | [README](README.md) | [Next: Types >>](types.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/defi"
```

The `defi` package builds transaction calldata for common DeFi operations: token swaps (Uniswap V2-style), and lending protocol interactions (Aave V3-style supply, borrow, and repay). Each method returns a `DeFiResult` containing the target address, encoded calldata, value, and gas limit -- ready to be embedded in a UserOperation.

---

## DeFiService

`DeFiService` provides methods for constructing DeFi transaction calldata. It holds a reference to the `ChainService` for chain-aware operations.

### Constructor

#### `NewDeFiService`

```go
func NewDeFiService(chainService *chain.ChainService) *DeFiService
```

Creates a new `DeFiService`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainService` | `*chain.ChainService` | The chain service for network configuration |

**Returns:** `*DeFiService`

**Example:**

```go
chainSvc := chain.NewChainService()
defiSvc := defi.NewDeFiService(chainSvc)
```

---

### Methods

#### `ExecuteSwap`

```go
func (s *DeFiService) ExecuteSwap(params SwapParams) (*DeFiResult, error)
```

Builds calldata for a Uniswap V2-style `swapExactTokensForTokens` call. The function selector used is `0x38ed1739`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `SwapParams` | Swap parameters |

**Returns:**

| Type | Description |
|------|-------------|
| `*DeFiResult` | Transaction calldata targeting the router contract |
| `error` | Non-nil if `AmountIn` is nil/non-positive, `Router` is zero, or ABI packing fails |

**Behavior:**
- `MinOut` defaults to `0` if nil (no slippage protection).
- `Deadline` defaults to `0` if nil.
- The swap path is always `[TokenIn, TokenOut]` (single-hop).
- Gas limit is set to `300,000`.
- Value is set to `0` (ERC-20 swap, not ETH).

**Example:**

```go
result, err := defiSvc.ExecuteSwap(defi.SwapParams{
    TokenIn:   common.HexToAddress("0xUSDC"),
    TokenOut:  common.HexToAddress("0xWETH"),
    AmountIn:  big.NewInt(1_000_000),  // 1 USDC
    MinOut:    big.NewInt(400_000_000_000_000), // minimum WETH out
    Recipient: common.HexToAddress("0xMyWallet"),
    Deadline:  big.NewInt(time.Now().Add(10 * time.Minute).Unix()),
    Router:    common.HexToAddress("0xUniswapV2Router"),
})
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Target: %s\n", result.To.Hex())
fmt.Printf("Calldata: 0x%x\n", result.Data)
fmt.Printf("Gas limit: %d\n", result.GasLimit)
```

---

#### `Supply`

```go
func (s *DeFiService) Supply(params LendingParams) (*DeFiResult, error)
```

Builds calldata for an Aave V3-style `supply` call. The function selector used is `0x617ba037`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `LendingParams` | Lending supply parameters |

**Returns:**

| Type | Description |
|------|-------------|
| `*DeFiResult` | Transaction calldata targeting the pool contract |
| `error` | Non-nil if `Amount` is nil/non-positive, `Pool` is zero, or ABI packing fails |

**Behavior:**
- `OnBehalf` defaults to the pool address if zero.
- Referral code is set to `0`.
- Gas limit is set to `250,000`.
- Value is set to `0`.

**ABI signature:** `supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)`

**Example:**

```go
result, err := defiSvc.Supply(defi.LendingParams{
    Token:    common.HexToAddress("0xUSDC"),
    Amount:   big.NewInt(10_000_000), // 10 USDC
    Pool:     common.HexToAddress("0xAavePool"),
    OnBehalf: common.HexToAddress("0xMyWallet"),
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Supply calldata ready, target: %s\n", result.To.Hex())
```

---

#### `Borrow`

```go
func (s *DeFiService) Borrow(params LendingParams) (*DeFiResult, error)
```

Builds calldata for an Aave V3-style `borrow` call. The function selector used is `0xa415bcad`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `LendingParams` | Lending borrow parameters |

**Returns:**

| Type | Description |
|------|-------------|
| `*DeFiResult` | Transaction calldata targeting the pool contract |
| `error` | Non-nil if `Amount` is nil/non-positive, `Pool` is zero, or ABI packing fails |

**Behavior:**
- `OnBehalf` defaults to the pool address if zero.
- Interest rate mode is fixed to `2` (variable rate).
- Referral code is set to `0`.
- Gas limit is set to `300,000`.
- Value is set to `0`.

**ABI signature:** `borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)`

**Example:**

```go
result, err := defiSvc.Borrow(defi.LendingParams{
    Token:    common.HexToAddress("0xUSDC"),
    Amount:   big.NewInt(5_000_000), // 5 USDC
    Pool:     common.HexToAddress("0xAavePool"),
    OnBehalf: common.HexToAddress("0xMyWallet"),
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Borrow calldata ready, gas limit: %d\n", result.GasLimit)
```

---

#### `Repay`

```go
func (s *DeFiService) Repay(params LendingParams) (*DeFiResult, error)
```

Builds calldata for an Aave V3-style `repay` call. The function selector used is `0x573eba17`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `LendingParams` | Lending repay parameters |

**Returns:**

| Type | Description |
|------|-------------|
| `*DeFiResult` | Transaction calldata targeting the pool contract |
| `error` | Non-nil if `Amount` is nil/non-positive, `Pool` is zero, or ABI packing fails |

**Behavior:**
- `OnBehalf` defaults to the pool address if zero.
- Interest rate mode is fixed to `2` (variable rate).
- Gas limit is set to `250,000`.
- Value is set to `0`.

**ABI signature:** `repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf)`

**Example:**

```go
result, err := defiSvc.Repay(defi.LendingParams{
    Token:    common.HexToAddress("0xUSDC"),
    Amount:   big.NewInt(5_000_000), // 5 USDC
    Pool:     common.HexToAddress("0xAavePool"),
    OnBehalf: common.HexToAddress("0xMyWallet"),
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Repay calldata ready, target: %s\n", result.To.Hex())
```

---

## Using DeFiResult with UserOperations

The `DeFiResult` struct is designed to feed directly into a UserOperation via `encoding.EncodeCallData`:

```go
import "github.com/sigloop/sdk-go/encoding"

// Build the swap calldata
swapResult, err := defiSvc.ExecuteSwap(swapParams)
if err != nil {
    log.Fatal(err)
}

// Wrap it in an execute() call for the smart account
calldata, err := encoding.EncodeCallData(
    swapResult.To,
    swapResult.Value,
    swapResult.Data,
)
if err != nil {
    log.Fatal(err)
}

// Use calldata in a UserOperation
op := &encoding.UserOperation{
    Sender:               walletAddress,
    Nonce:                big.NewInt(0),
    CallData:             calldata,
    CallGasLimit:         big.NewInt(int64(swapResult.GasLimit)),
    VerificationGasLimit: big.NewInt(100000),
    PreVerificationGas:   big.NewInt(21000),
    MaxFeePerGas:         big.NewInt(1000000000),
    MaxPriorityFeePerGas: big.NewInt(1000000000),
    // ...
}
```

---

## Types

See also: [Types reference](types.md)

### `SwapParams`

```go
type SwapParams struct {
    TokenIn   common.Address  // Input token address
    TokenOut  common.Address  // Output token address
    AmountIn  *big.Int        // Amount of input token to swap
    MinOut    *big.Int        // Minimum output amount (slippage protection; nil = 0)
    Recipient common.Address  // Address to receive output tokens
    Deadline  *big.Int        // Unix timestamp deadline (nil = 0)
    Router    common.Address  // DEX router contract address
}
```

### `LendingParams`

```go
type LendingParams struct {
    Token    common.Address  // Token to supply/borrow/repay
    Amount   *big.Int        // Amount in token's smallest unit
    Pool     common.Address  // Lending pool contract address
    OnBehalf common.Address  // Beneficiary address (zero = defaults to pool)
}
```

### `StakeParams`

```go
type StakeParams struct {
    Token     common.Address  // Token to stake
    Amount    *big.Int        // Staking amount
    Validator common.Address  // Validator address
}
```

### `DeFiResult`

```go
type DeFiResult struct {
    To       common.Address  // Target contract address
    Data     []byte          // ABI-encoded calldata
    Value    *big.Int        // ETH value to send (typically 0 for ERC-20 ops)
    GasLimit uint64          // Suggested gas limit
}
```

---

[<< Chain](chain.md) | [README](README.md) | [Next: Types >>](types.md)
