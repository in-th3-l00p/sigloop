package chain

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewChainService(t *testing.T) {
	svc := NewChainService()
	assert.NotNil(t, svc)
	assert.Len(t, svc.configs, len(Chains))
}

func TestGetChain(t *testing.T) {
	svc := NewChainService()

	tests := []struct {
		name    string
		chain   SupportedChain
		wantErr bool
	}{
		{name: "base", chain: Base},
		{name: "arbitrum", chain: Arbitrum},
		{name: "base sepolia", chain: BaseSepolia},
		{name: "arbitrum sepolia", chain: ArbitrumSepolia},
		{name: "unsupported", chain: SupportedChain("polygon"), wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			cfg, err := svc.GetChain(tc.chain)
			if tc.wantErr {
				require.Error(t, err)
				assert.Equal(t, "unsupported chain", err.Error())
				assert.Nil(t, cfg)
			} else {
				require.NoError(t, err)
				require.NotNil(t, cfg)
				assert.Equal(t, tc.chain, cfg.Chain)
			}
		})
	}
}

func TestGetChainValues(t *testing.T) {
	svc := NewChainService()

	t.Run("base config", func(t *testing.T) {
		cfg, err := svc.GetChain(Base)
		require.NoError(t, err)
		assert.Equal(t, "Base", cfg.Name)
		assert.Equal(t, big.NewInt(8453), cfg.ChainID)
		assert.Equal(t, "https://mainnet.base.org", cfg.RPCURL)
		assert.Equal(t, DefaultEntryPoint, cfg.EntryPoint)
		assert.False(t, cfg.IsTestnet)
	})

	t.Run("base sepolia is testnet", func(t *testing.T) {
		cfg, err := svc.GetChain(BaseSepolia)
		require.NoError(t, err)
		assert.True(t, cfg.IsTestnet)
		assert.Equal(t, big.NewInt(84532), cfg.ChainID)
	})

	t.Run("arbitrum config", func(t *testing.T) {
		cfg, err := svc.GetChain(Arbitrum)
		require.NoError(t, err)
		assert.Equal(t, "Arbitrum One", cfg.Name)
		assert.Equal(t, big.NewInt(42161), cfg.ChainID)
		assert.False(t, cfg.IsTestnet)
	})
}

func TestListChains(t *testing.T) {
	svc := NewChainService()
	chains := svc.ListChains()

	assert.Len(t, chains, 4)

	chainNames := make(map[SupportedChain]bool)
	for _, c := range chains {
		chainNames[c.Chain] = true
	}

	assert.True(t, chainNames[Base])
	assert.True(t, chainNames[Arbitrum])
	assert.True(t, chainNames[BaseSepolia])
	assert.True(t, chainNames[ArbitrumSepolia])
}

func TestRegisterChain(t *testing.T) {
	svc := NewChainService()

	customChain := ChainConfig{
		Name:        "Custom",
		Chain:       SupportedChain("custom"),
		ChainID:     big.NewInt(99999),
		RPCURL:      "https://custom.rpc.org",
		EntryPoint:  DefaultEntryPoint,
		USDC:        common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
		IsTestnet:   true,
		BlockTime:   5,
		GasMultiple: 2.0,
	}

	svc.RegisterChain(customChain)

	cfg, err := svc.GetChain(SupportedChain("custom"))
	require.NoError(t, err)
	assert.Equal(t, "Custom", cfg.Name)
	assert.Equal(t, big.NewInt(99999), cfg.ChainID)
	assert.True(t, cfg.IsTestnet)

	assert.Len(t, svc.ListChains(), 5)
}

func TestRegisterChainOverwrite(t *testing.T) {
	svc := NewChainService()

	updated := ChainConfig{
		Name:        "Base Updated",
		Chain:       Base,
		ChainID:     big.NewInt(8453),
		RPCURL:      "https://updated.base.org",
		EntryPoint:  DefaultEntryPoint,
		BlockTime:   1,
		GasMultiple: 1.0,
	}

	svc.RegisterChain(updated)

	cfg, err := svc.GetChain(Base)
	require.NoError(t, err)
	assert.Equal(t, "Base Updated", cfg.Name)
	assert.Equal(t, "https://updated.base.org", cfg.RPCURL)

	assert.Len(t, svc.ListChains(), 4)
}
