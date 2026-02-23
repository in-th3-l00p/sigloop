# Wallet

[<< Getting Started](getting-started.md) | [README](README.md) | [Next: Agent >>](agent.md)

---

## Package

```go
import "github.com/sigloop/sdk-go/wallet"
```

The `wallet` package manages ERC-4337 smart contract wallets. It handles counterfactual address computation, wallet creation, guardian management, and social recovery.

---

## WalletService

`WalletService` is the primary service for managing wallets. It is safe for concurrent use.

### Constructor

#### `NewWalletService`

```go
func NewWalletService(config WalletConfig) *WalletService
```

Creates a new `WalletService` initialized with the provided configuration.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `WalletConfig` | Wallet subsystem configuration (entry point, factory, chain ID, URLs) |

**Returns:** `*WalletService`

**Example:**

```go
svc := wallet.NewWalletService(wallet.WalletConfig{
    EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
    Factory:    common.HexToAddress("0xYourFactory"),
    ChainID:    big.NewInt(8453),
    BundlerURL: "https://bundler.base.org",
    RPCURL:     "https://mainnet.base.org",
})
```

---

### Methods

#### `CreateWallet`

```go
func (s *WalletService) CreateWallet(params CreateWalletParams) (*Wallet, error)
```

Creates a new wallet and registers it in the service. The wallet address is derived deterministically from the owner, factory, and salt using CREATE2. The wallet is not deployed on-chain until a UserOperation is submitted.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `CreateWalletParams` | Owner address, salt, guardian list, and wallet config |

**Returns:**

| Type | Description |
|------|-------------|
| `*Wallet` | The newly created wallet with its counterfactual address |
| `error` | Non-nil if creation fails |

**Behavior:**
- If `params.Salt` is nil, it defaults to `0`.
- Guardians are initialized with `AddedAt = 0` and `Threshold = 1`.
- `IsDeployed` starts as `false`; `Nonce` starts at `0`.

**Example:**

```go
w, err := svc.CreateWallet(wallet.CreateWalletParams{
    Owner: common.HexToAddress("0xOwnerAddress"),
    Salt:  big.NewInt(42),
    Guardians: []common.Address{
        common.HexToAddress("0xGuardian1"),
        common.HexToAddress("0xGuardian2"),
    },
    Config: wallet.WalletConfig{
        EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
        Factory:    common.HexToAddress("0xYourFactory"),
        ChainID:    big.NewInt(8453),
    },
})
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Wallet: %s\n", w.Address.Hex())
```

---

#### `GetWallet`

```go
func (s *WalletService) GetWallet(address common.Address) (*Wallet, bool)
```

Retrieves a wallet by its address.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `address` | `common.Address` | The wallet's on-chain address |

**Returns:**

| Type | Description |
|------|-------------|
| `*Wallet` | The wallet, or nil if not found |
| `bool` | `true` if the wallet exists, `false` otherwise |

**Example:**

```go
w, ok := svc.GetWallet(common.HexToAddress("0xWalletAddress"))
if !ok {
    fmt.Println("wallet not found")
    return
}
fmt.Printf("Owner: %s\n", w.Owner.Hex())
```

---

#### `ListWallets`

```go
func (s *WalletService) ListWallets() []*Wallet
```

Returns all wallets registered with the service.

**Parameters:** None

**Returns:** `[]*Wallet` -- a slice of all wallets. The order is not guaranteed.

**Example:**

```go
wallets := svc.ListWallets()
for _, w := range wallets {
    fmt.Printf("Wallet %s (owner: %s, deployed: %v)\n",
        w.Address.Hex(), w.Owner.Hex(), w.IsDeployed)
}
```

---

#### `AddGuardian`

```go
func (s *WalletService) AddGuardian(walletAddr common.Address, guardian common.Address, threshold uint8) error
```

Adds a guardian to an existing wallet. Returns an error if the wallet does not exist or the guardian is already registered.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddr` | `common.Address` | The wallet to add the guardian to |
| `guardian` | `common.Address` | The guardian's address |
| `threshold` | `uint8` | Number of guardian approvals required for recovery |

**Returns:** `error` -- non-nil if the wallet is not found or the guardian already exists.

**Example:**

```go
err := svc.AddGuardian(
    w.Address,
    common.HexToAddress("0xNewGuardian"),
    2, // require 2 approvals
)
if err != nil {
    log.Fatal(err)
}
```

---

#### `RemoveGuardian`

```go
func (s *WalletService) RemoveGuardian(walletAddr common.Address, guardian common.Address) error
```

Removes a guardian from a wallet. Returns an error if the wallet or guardian is not found.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddr` | `common.Address` | The wallet to remove the guardian from |
| `guardian` | `common.Address` | The guardian's address to remove |

**Returns:** `error` -- non-nil if the wallet or guardian is not found.

**Example:**

```go
err := svc.RemoveGuardian(w.Address, common.HexToAddress("0xGuardian1"))
if err != nil {
    log.Fatal(err)
}
```

---

## Standalone Functions

#### `AddressFromPrivateKey`

```go
func AddressFromPrivateKey(key *ecdsa.PrivateKey) common.Address
```

Derives an Ethereum address from an ECDSA private key.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `key` | `*ecdsa.PrivateKey` | The ECDSA private key |

**Returns:** `common.Address` -- the derived Ethereum address.

**Example:**

```go
privateKey, _ := crypto.GenerateKey()
addr := wallet.AddressFromPrivateKey(privateKey)
fmt.Printf("Address: %s\n", addr.Hex())
```

---

## RecoveryService

`RecoveryService` manages social recovery requests for wallets. It tracks pending recovery operations, guardian approvals, and ownership transfers.

### Constructor

#### `NewRecoveryService`

```go
func NewRecoveryService() *RecoveryService
```

Creates a new `RecoveryService`.

**Returns:** `*RecoveryService`

**Example:**

```go
rs := wallet.NewRecoveryService()
```

---

### Methods

#### `InitiateRecovery`

```go
func (rs *RecoveryService) InitiateRecovery(wallet *Wallet, newOwner common.Address) (*RecoveryRequest, error)
```

Starts a recovery process for a wallet. The wallet must have at least one guardian configured.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `wallet` | `*Wallet` | The wallet to recover |
| `newOwner` | `common.Address` | The proposed new owner address |

**Returns:**

| Type | Description |
|------|-------------|
| `*RecoveryRequest` | The pending recovery request |
| `error` | Non-nil if no guardians are configured |

**Example:**

```go
req, err := rs.InitiateRecovery(w, common.HexToAddress("0xNewOwner"))
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Recovery initiated, threshold: %d\n", req.Threshold)
```

---

#### `ApproveRecovery`

```go
func (rs *RecoveryService) ApproveRecovery(walletAddr common.Address, guardian common.Address, signature []byte) error
```

Records a guardian's approval for a pending recovery. The signature is verified cryptographically against the guardian's address. The message signed is `keccak256(walletAddress || newOwner)`.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddr` | `common.Address` | The wallet under recovery |
| `guardian` | `common.Address` | The approving guardian's address |
| `signature` | `[]byte` | The guardian's ECDSA signature (65 bytes) |

**Returns:** `error` -- non-nil if:
- No recovery request exists
- Recovery is already executed
- Signature is invalid
- Signature does not match the guardian address

**Example:**

```go
// Guardian signs the recovery hash
recoveryHash := crypto.Keccak256(
    walletAddr.Bytes(),
    newOwner.Bytes(),
)
sig, _ := crypto.Sign(recoveryHash, guardianPrivateKey)

err := rs.ApproveRecovery(walletAddr, guardianAddr, sig)
if err != nil {
    log.Fatal(err)
}
```

---

#### `ExecuteRecovery`

```go
func (rs *RecoveryService) ExecuteRecovery(walletAddr common.Address, walletService *WalletService) error
```

Executes a recovery if the approval threshold has been met. Transfers ownership of the wallet to the new owner and removes the recovery request.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `walletAddr` | `common.Address` | The wallet under recovery |
| `walletService` | `*WalletService` | The wallet service that owns the wallet data |

**Returns:** `error` -- non-nil if:
- No recovery request exists
- Recovery is already executed
- Insufficient approvals (fewer than threshold)
- Wallet not found in the wallet service

**Example:**

```go
err := rs.ExecuteRecovery(walletAddr, svc)
if err != nil {
    log.Fatal(err)
}
// Wallet ownership has been transferred
w, _ := svc.GetWallet(walletAddr)
fmt.Printf("New owner: %s\n", w.Owner.Hex())
```

---

## Types

See also: [Types reference](types.md)

### `Wallet`

```go
type Wallet struct {
    Address    common.Address  // Counterfactual on-chain address
    Owner      common.Address  // Current owner
    EntryPoint common.Address  // ERC-4337 EntryPoint contract
    Factory    common.Address  // Account factory for CREATE2 deployment
    Salt       *big.Int        // Salt used in address derivation
    ChainID    *big.Int        // Chain identifier
    Guardians  []Guardian      // Social recovery guardians
    IsDeployed bool            // Whether the wallet is deployed on-chain
    Nonce      uint64          // Current nonce
}
```

### `WalletConfig`

```go
type WalletConfig struct {
    EntryPoint common.Address  // ERC-4337 EntryPoint address
    Factory    common.Address  // Account factory address
    ChainID    *big.Int        // Target chain ID
    BundlerURL string          // Bundler endpoint URL
    RPCURL     string          // JSON-RPC endpoint URL
}
```

### `CreateWalletParams`

```go
type CreateWalletParams struct {
    Owner     common.Address    // Owner of the new wallet
    Salt      *big.Int          // Salt for CREATE2 (nil defaults to 0)
    Guardians []common.Address  // Initial guardian addresses
    Config    WalletConfig      // Wallet configuration
}
```

### `Guardian`

```go
type Guardian struct {
    Address   common.Address  // Guardian's Ethereum address
    AddedAt   uint64          // Timestamp when added (0 on creation)
    Threshold uint8           // Approval threshold for recovery
}
```

### `RecoveryRequest`

```go
type RecoveryRequest struct {
    WalletAddress common.Address            // Wallet being recovered
    NewOwner      common.Address            // Proposed new owner
    Approvals     map[common.Address][]byte // Guardian address -> signature
    Threshold     uint8                     // Required number of approvals
    Executed      bool                      // Whether recovery has been executed
}
```

---

[<< Getting Started](getting-started.md) | [README](README.md) | [Next: Agent >>](agent.md)
