package chain

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSelectOptimalChain(t *testing.T) {
	t.Run("prefer testnet", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{PreferTestnet: true})
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.True(t, cfg.IsTestnet)
	})

	t.Run("prefer mainnet", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{PreferTestnet: false})
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.False(t, cfg.IsTestnet)
	})

	t.Run("prefer speed", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{
			PreferTestnet: false,
			PreferSpeed:   true,
		})
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.False(t, cfg.IsTestnet)
	})

	t.Run("prefer low cost", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{
			PreferTestnet: false,
			PreferLowCost: true,
		})
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.False(t, cfg.IsTestnet)
	})

	t.Run("prefer speed and low cost for testnet", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{
			PreferTestnet: true,
			PreferSpeed:   true,
			PreferLowCost: true,
		})
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.True(t, cfg.IsTestnet)
	})

	t.Run("empty configs", func(t *testing.T) {
		svc := &ChainService{
			configs: make(map[SupportedChain]ChainConfig),
		}
		_, err := svc.SelectOptimalChain(RoutePreference{})
		require.Error(t, err)
		assert.Equal(t, "no chains configured", err.Error())
	})

	t.Run("all preferences off returns something", func(t *testing.T) {
		svc := NewChainService()
		cfg, err := svc.SelectOptimalChain(RoutePreference{})
		require.NoError(t, err)
		require.NotNil(t, cfg)
	})
}
