# Encoding

[<< Types](types.md) | [README](README.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/encoding"
```

The `encoding` package provides ABI encoding and decoding utilities for on-chain policy verification and ERC-4337 UserOperation construction. It includes policy serialization, generic function call encoding, UserOperation packing/hashing, and smart account calldata construction.

---

## Policy Encoding

### `EncodePolicy`

```go
func EncodePolicy(p *PolicyEncoding) ([]byte, error)
```

ABI-encodes a `PolicyEncoding` struct into bytes suitable for on-chain storage or verification. The encoding follows the Solidity ABI specification with the following parameter types:

```
(address[], uint256[], address[], bytes4[], uint256, uint256, uint256, uint256)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `p` | `*PolicyEncoding` | The policy data to encode |

**Returns:**

| Type | Description |
|------|-------------|
| `[]byte` | ABI-encoded policy data |
| `error` | Non-nil if the input is nil or ABI packing fails |

**Example:**

```go
encoded, err := encoding.EncodePolicy(&encoding.PolicyEncoding{
    SpendingTokens:  []common.Address{common.HexToAddress("0xUSDC")},
    SpendingAmounts: []*big.Int{big.NewInt(10_000_000)},
    Contracts:       []common.Address{common.HexToAddress("0xRouter")},
    FunctionSigs:    [][4]byte{{0x38, 0xed, 0x17, 0x39}},
    ValidAfter:      big.NewInt(time.Now().Unix()),
    ValidUntil:      big.NewInt(time.Now().Add(24 * time.Hour).Unix()),
    RateMaxCalls:    big.NewInt(100),
    RatePeriod:      big.NewInt(3600),
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Encoded policy: %d bytes\n", len(encoded))
```

---

### `DecodePolicy`

```go
func DecodePolicy(data []byte) (*PolicyEncoding, error)
```

Decodes ABI-encoded policy data back into a `PolicyEncoding` struct. Expects exactly 8 values matching the encoding schema.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `data` | `[]byte` | ABI-encoded policy data (produced by `EncodePolicy`) |

**Returns:**

| Type | Description |
|------|-------------|
| `*PolicyEncoding` | The decoded policy |
| `error` | Non-nil if decoding fails or the data does not contain 8 values |

**Example:**

```go
decoded, err := encoding.DecodePolicy(encoded)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Spending tokens: %v\n", decoded.SpendingTokens)
fmt.Printf("Valid until: %s\n", decoded.ValidUntil.String())
fmt.Printf("Rate limit: %s calls per %s seconds\n",
    decoded.RateMaxCalls.String(), decoded.RatePeriod.String())
```

---

### `EncodeFunctionCall`

```go
func EncodeFunctionCall(signature string, args ...interface{}) ([]byte, error)
```

Encodes a Solidity function call from its human-readable signature and arguments. The first 4 bytes are the `keccak256` selector, followed by the ABI-encoded arguments.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `signature` | `string` | Solidity function signature (e.g., `"transfer(address,uint256)"`) |
| `args` | `...interface{}` | Arguments matching the signature's parameter types |

**Returns:**

| Type | Description |
|------|-------------|
| `[]byte` | The 4-byte selector + ABI-encoded arguments |
| `error` | Non-nil if the signature cannot be parsed or arguments cannot be packed |

**Behavior:**
- If no arguments are provided, returns only the 4-byte selector.
- Handles nested parentheses in complex type signatures (e.g., tuple types).

**Example:**

```go
// Simple ERC-20 transfer
calldata, err := encoding.EncodeFunctionCall(
    "transfer(address,uint256)",
    common.HexToAddress("0xRecipient"),
    big.NewInt(1_000_000),
)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Calldata: 0x%x\n", calldata)
```

```go
// Function with no arguments
calldata, err := encoding.EncodeFunctionCall("totalSupply()")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Selector: 0x%x\n", calldata) // just the 4-byte selector
```

```go
// Approval
calldata, err := encoding.EncodeFunctionCall(
    "approve(address,uint256)",
    common.HexToAddress("0xSpender"),
    new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 256), big.NewInt(1)), // type(uint256).max
)
if err != nil {
    log.Fatal(err)
}
```

---

## UserOperation Encoding

### `PackUserOp`

```go
func PackUserOp(op *UserOperation) ([]byte, error)
```

ABI-encodes a UserOperation for hashing. Variable-length fields (`InitCode`, `CallData`, `PaymasterAndData`) are replaced with their `keccak256` hashes. The resulting encoding matches the ERC-4337 specification for computing the UserOperation hash.

**Encoding layout:**

```
(address sender, uint256 nonce, bytes32 initCodeHash, bytes32 callDataHash,
 uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas,
 uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes32 paymasterAndDataHash)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `op` | `*UserOperation` | The UserOperation to pack |

**Returns:**

| Type | Description |
|------|-------------|
| `[]byte` | ABI-encoded packed UserOperation |
| `error` | Non-nil if ABI packing fails |

**Example:**

```go
packed, err := encoding.PackUserOp(&encoding.UserOperation{
    Sender:               common.HexToAddress("0xWallet"),
    Nonce:                big.NewInt(0),
    InitCode:             []byte{},
    CallData:             calldata,
    CallGasLimit:         big.NewInt(300000),
    VerificationGasLimit: big.NewInt(100000),
    PreVerificationGas:   big.NewInt(21000),
    MaxFeePerGas:         big.NewInt(1_000_000_000),
    MaxPriorityFeePerGas: big.NewInt(1_000_000_000),
    PaymasterAndData:     []byte{},
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Packed UserOp: %d bytes\n", len(packed))
```

---

### `HashUserOp`

```go
func HashUserOp(op *UserOperation, entryPoint common.Address, chainID *big.Int) (common.Hash, error)
```

Computes the ERC-4337 UserOperation hash. This is the value that must be signed by the wallet owner or session key. The hash is computed as:

```
keccak256(abi.encode(keccak256(PackUserOp(op)), entryPoint, chainID))
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `op` | `*UserOperation` | The UserOperation to hash |
| `entryPoint` | `common.Address` | The EntryPoint contract address |
| `chainID` | `*big.Int` | The chain ID |

**Returns:**

| Type | Description |
|------|-------------|
| `common.Hash` | The 32-byte UserOperation hash |
| `error` | Non-nil if packing fails |

**Example:**

```go
hash, err := encoding.HashUserOp(
    op,
    common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
    big.NewInt(8453),
)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("UserOp hash: %s\n", hash.Hex())

// Sign the hash with a session key
sig, err := agent.SignWithSessionKey(sessionKey, hash.Bytes())
if err != nil {
    log.Fatal(err)
}
op.Signature = sig
```

---

### `EncodeCallData`

```go
func EncodeCallData(target common.Address, value *big.Int, data []byte) ([]byte, error)
```

Encodes an `execute(address,uint256,bytes)` call for a smart account. This wraps a raw contract call into the format expected by the smart account's execution function.

**Function selector:** `keccak256("execute(address,uint256,bytes)")[:4]`

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `target` | `common.Address` | The target contract address to call |
| `value` | `*big.Int` | ETH value to send with the call |
| `data` | `[]byte` | The raw calldata for the target contract |

**Returns:**

| Type | Description |
|------|-------------|
| `[]byte` | ABI-encoded `execute()` calldata for the smart account |
| `error` | Non-nil if ABI packing fails |

**Example:**

```go
// Encode a USDC transfer via the smart account
transferData, err := encoding.EncodeFunctionCall(
    "transfer(address,uint256)",
    common.HexToAddress("0xRecipient"),
    big.NewInt(1_000_000),
)
if err != nil {
    log.Fatal(err)
}

accountCalldata, err := encoding.EncodeCallData(
    common.HexToAddress("0xUSDC"),  // target: USDC contract
    big.NewInt(0),                   // value: 0 ETH
    transferData,                    // data: transfer calldata
)
if err != nil {
    log.Fatal(err)
}

// Use in a UserOperation
op := &encoding.UserOperation{
    Sender:   walletAddress,
    CallData: accountCalldata,
    // ... other fields
}
```

---

## Complete UserOperation Example

This example ties together the encoding package with the agent and DeFi packages to construct a fully signed UserOperation:

```go
package main

import (
    "fmt"
    "log"
    "math/big"
    "time"

    "github.com/ethereum/go-ethereum/common"
    "github.com/sigloop/sdk-go/agent"
    "github.com/sigloop/sdk-go/chain"
    "github.com/sigloop/sdk-go/defi"
    "github.com/sigloop/sdk-go/encoding"
)

func main() {
    // 1. Generate a session key
    sk, err := agent.GenerateSessionKey(big.NewInt(8453), 1*time.Hour)
    if err != nil {
        log.Fatal(err)
    }

    // 2. Build a DeFi swap
    chainSvc := chain.NewChainService()
    defiSvc := defi.NewDeFiService(chainSvc)

    swapResult, err := defiSvc.ExecuteSwap(defi.SwapParams{
        TokenIn:   common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
        TokenOut:  common.HexToAddress("0x4200000000000000000000000000000000000006"),
        AmountIn:  big.NewInt(1_000_000),
        Recipient: common.HexToAddress("0xWallet"),
        Router:    common.HexToAddress("0xRouter"),
    })
    if err != nil {
        log.Fatal(err)
    }

    // 3. Wrap in smart account execute() call
    calldata, err := encoding.EncodeCallData(
        swapResult.To,
        swapResult.Value,
        swapResult.Data,
    )
    if err != nil {
        log.Fatal(err)
    }

    // 4. Build the UserOperation
    op := &encoding.UserOperation{
        Sender:               common.HexToAddress("0xWallet"),
        Nonce:                big.NewInt(0),
        InitCode:             []byte{},
        CallData:             calldata,
        CallGasLimit:         big.NewInt(int64(swapResult.GasLimit)),
        VerificationGasLimit: big.NewInt(150000),
        PreVerificationGas:   big.NewInt(21000),
        MaxFeePerGas:         big.NewInt(1_000_000_000),
        MaxPriorityFeePerGas: big.NewInt(1_000_000_000),
        PaymasterAndData:     []byte{},
    }

    // 5. Hash and sign
    entryPoint := common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
    hash, err := encoding.HashUserOp(op, entryPoint, big.NewInt(8453))
    if err != nil {
        log.Fatal(err)
    }

    sig, err := agent.SignWithSessionKey(sk, hash.Bytes())
    if err != nil {
        log.Fatal(err)
    }
    op.Signature = sig

    fmt.Printf("UserOp hash: %s\n", hash.Hex())
    fmt.Printf("Signature: 0x%x\n", sig)
}
```

---

## Types

See also: [Types reference](types.md)

### `PolicyEncoding`

```go
type PolicyEncoding struct {
    SpendingTokens  []common.Address  // Token addresses with spending limits
    SpendingAmounts []*big.Int        // Maximum amounts per token
    Contracts       []common.Address  // Allowed contract addresses
    FunctionSigs    [][4]byte         // Allowed 4-byte function selectors
    ValidAfter      *big.Int          // Unix timestamp: policy becomes valid
    ValidUntil      *big.Int          // Unix timestamp: policy expires
    RateMaxCalls    *big.Int          // Maximum calls per rate period
    RatePeriod      *big.Int          // Rate period duration in seconds
}
```

### `UserOperation`

```go
type UserOperation struct {
    Sender               common.Address  // Smart account address
    Nonce                *big.Int        // Anti-replay nonce
    InitCode             []byte          // Factory + init data (empty if deployed)
    CallData             []byte          // Encoded execution call
    CallGasLimit         *big.Int        // Gas for main execution
    VerificationGasLimit *big.Int        // Gas for signature verification
    PreVerificationGas   *big.Int        // Gas overhead
    MaxFeePerGas         *big.Int        // Maximum gas price
    MaxPriorityFeePerGas *big.Int        // Maximum priority fee
    PaymasterAndData     []byte          // Paymaster data (empty if self-paying)
    Signature            []byte          // ECDSA signature
}
```

---

[<< Types](types.md) | [README](README.md)
