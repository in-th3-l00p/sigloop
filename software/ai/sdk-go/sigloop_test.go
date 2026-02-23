package sigloop

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/sdk-go/wallet"
	"github.com/sigloop/sdk-go/x402"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewClient(t *testing.T) {
	walletCfg := wallet.WalletConfig{
		EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
		Factory:    common.HexToAddress("0x1234567890abcdef1234567890abcdef12345678"),
		ChainID:    big.NewInt(8453),
		BundlerURL: "https://bundler.base.org",
		RPCURL:     "https://mainnet.base.org",
	}

	x402Policy := x402.X402Policy{
		MaxPerRequest: big.NewInt(1000000),
		MaxPerPeriod:  big.NewInt(10000000),
	}

	t.Run("all services initialized", func(t *testing.T) {
		client := NewClient(walletCfg, x402Policy, 3600)
		require.NotNil(t, client)
		assert.NotNil(t, client.WalletService)
		assert.NotNil(t, client.AgentService)
		assert.NotNil(t, client.PolicyService)
		assert.NotNil(t, client.X402Service)
		assert.NotNil(t, client.ChainService)
		assert.NotNil(t, client.DeFiService)
	})

	t.Run("zero budget period", func(t *testing.T) {
		client := NewClient(walletCfg, x402Policy, 0)
		require.NotNil(t, client)
		assert.NotNil(t, client.X402Service)
	})

	t.Run("empty x402 policy", func(t *testing.T) {
		client := NewClient(walletCfg, x402.X402Policy{}, 3600)
		require.NotNil(t, client)
		assert.NotNil(t, client.X402Service)
	})
}
