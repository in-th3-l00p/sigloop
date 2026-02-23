package x402

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewX402Transport(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	require.NoError(t, err)
	chainID := big.NewInt(8453)

	t.Run("with base transport", func(t *testing.T) {
		transport := NewX402Transport(nil, privateKey, chainID, nil, nil, X402Config{})
		assert.NotNil(t, transport)
		assert.NotNil(t, transport.Base)
		assert.Equal(t, chainID, transport.ChainID)
		assert.Equal(t, crypto.PubkeyToAddress(privateKey.PublicKey), transport.From)
	})
}

func TestSelectRequirement(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	require.NoError(t, err)

	requirements := []PaymentRequirement{
		{Scheme: "exact", Network: "base"},
		{Scheme: "upto", Network: "arbitrum"},
		{Scheme: "exact", Network: "optimism"},
	}

	t.Run("no scheme filter returns first", func(t *testing.T) {
		transport := NewX402Transport(nil, privateKey, big.NewInt(1), nil, nil, X402Config{})
		result := transport.selectRequirement(requirements)
		require.NotNil(t, result)
		assert.Equal(t, "base", result.Network)
	})

	t.Run("matching scheme", func(t *testing.T) {
		transport := NewX402Transport(nil, privateKey, big.NewInt(1), nil, nil, X402Config{
			AllowedSchemes: []string{"upto"},
		})
		result := transport.selectRequirement(requirements)
		require.NotNil(t, result)
		assert.Equal(t, "upto", result.Scheme)
		assert.Equal(t, "arbitrum", result.Network)
	})

	t.Run("no matching scheme", func(t *testing.T) {
		transport := NewX402Transport(nil, privateKey, big.NewInt(1), nil, nil, X402Config{
			AllowedSchemes: []string{"stream"},
		})
		result := transport.selectRequirement(requirements)
		assert.Nil(t, result)
	})

	t.Run("first matching scheme when multiple match", func(t *testing.T) {
		transport := NewX402Transport(nil, privateKey, big.NewInt(1), nil, nil, X402Config{
			AllowedSchemes: []string{"exact"},
		})
		result := transport.selectRequirement(requirements)
		require.NotNil(t, result)
		assert.Equal(t, "base", result.Network)
	})
}

func TestNewX402Client(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	require.NoError(t, err)

	policy := &X402Policy{MaxPerRequest: big.NewInt(100)}
	budget := NewBudgetTracker(X402Policy{}, 3600)
	config := X402Config{AutoPay: true}

	client := NewX402Client(privateKey, big.NewInt(8453), budget, policy, config)
	require.NotNil(t, client)
	assert.NotNil(t, client.Transport)

	transport, ok := client.Transport.(*X402Transport)
	require.True(t, ok)
	assert.Equal(t, big.NewInt(8453), transport.ChainID)
	assert.True(t, transport.Config.AutoPay)
}
