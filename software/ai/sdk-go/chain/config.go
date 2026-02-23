package chain

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

var DefaultEntryPoint = common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")

var Chains = map[SupportedChain]ChainConfig{
	Base: {
		Name:        "Base",
		Chain:       Base,
		ChainID:     big.NewInt(8453),
		RPCURL:      "https://mainnet.base.org",
		BundlerURL:  "https://bundler.base.org",
		EntryPoint:  DefaultEntryPoint,
		USDC:        common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
		IsTestnet:   false,
		BlockTime:   2,
		GasMultiple: 1.1,
	},
	Arbitrum: {
		Name:        "Arbitrum One",
		Chain:       Arbitrum,
		ChainID:     big.NewInt(42161),
		RPCURL:      "https://arb1.arbitrum.io/rpc",
		BundlerURL:  "https://bundler.arbitrum.io",
		EntryPoint:  DefaultEntryPoint,
		USDC:        common.HexToAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
		IsTestnet:   false,
		BlockTime:   1,
		GasMultiple: 1.2,
	},
	BaseSepolia: {
		Name:        "Base Sepolia",
		Chain:       BaseSepolia,
		ChainID:     big.NewInt(84532),
		RPCURL:      "https://sepolia.base.org",
		BundlerURL:  "https://bundler.base-sepolia.org",
		EntryPoint:  DefaultEntryPoint,
		USDC:        common.HexToAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
		IsTestnet:   true,
		BlockTime:   2,
		GasMultiple: 1.5,
	},
	ArbitrumSepolia: {
		Name:        "Arbitrum Sepolia",
		Chain:       ArbitrumSepolia,
		ChainID:     big.NewInt(421614),
		RPCURL:      "https://sepolia-rollup.arbitrum.io/rpc",
		BundlerURL:  "https://bundler.arbitrum-sepolia.io",
		EntryPoint:  DefaultEntryPoint,
		USDC:        common.HexToAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
		IsTestnet:   true,
		BlockTime:   1,
		GasMultiple: 1.5,
	},
}
