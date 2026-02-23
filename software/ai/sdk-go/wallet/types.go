package wallet

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type Wallet struct {
	Address       common.Address
	Owner         common.Address
	EntryPoint    common.Address
	Factory       common.Address
	Salt          *big.Int
	ChainID       *big.Int
	Guardians     []Guardian
	IsDeployed    bool
	Nonce         uint64
}

type WalletConfig struct {
	EntryPoint    common.Address
	Factory       common.Address
	ChainID       *big.Int
	BundlerURL    string
	RPCURL        string
}

type CreateWalletParams struct {
	Owner         common.Address
	Salt          *big.Int
	Guardians     []common.Address
	Config        WalletConfig
}

type Guardian struct {
	Address   common.Address
	AddedAt   uint64
	Threshold uint8
}
