package chain

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type SupportedChain string

const (
	Base            SupportedChain = "base"
	Arbitrum        SupportedChain = "arbitrum"
	BaseSepolia     SupportedChain = "base-sepolia"
	ArbitrumSepolia SupportedChain = "arbitrum-sepolia"
)

type ChainConfig struct {
	Name        string
	Chain       SupportedChain
	ChainID     *big.Int
	RPCURL      string
	BundlerURL  string
	EntryPoint  common.Address
	USDC        common.Address
	IsTestnet   bool
	BlockTime   uint64
	GasMultiple float64
}
