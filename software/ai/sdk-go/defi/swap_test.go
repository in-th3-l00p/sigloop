package defi

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/sdk-go/chain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExecuteSwap(t *testing.T) {
	svc := NewDeFiService(chain.NewChainService())
	tokenIn := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	tokenOut := common.HexToAddress("0x4200000000000000000000000000000000000006")
	router := common.HexToAddress("0x1111111111111111111111111111111111111111")
	recipient := common.HexToAddress("0x2222222222222222222222222222222222222222")

	t.Run("success", func(t *testing.T) {
		result, err := svc.ExecuteSwap(SwapParams{
			TokenIn:   tokenIn,
			TokenOut:  tokenOut,
			AmountIn:  big.NewInt(1000000),
			MinOut:    big.NewInt(900000),
			Recipient: recipient,
			Deadline:  big.NewInt(9999999999),
			Router:    router,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, router, result.To)
		assert.Equal(t, big.NewInt(0), result.Value)
		assert.Equal(t, uint64(300000), result.GasLimit)
		assert.Equal(t, []byte{0x38, 0xed, 0x17, 0x39}, result.Data[:4])
	})

	t.Run("nil min out defaults to zero", func(t *testing.T) {
		result, err := svc.ExecuteSwap(SwapParams{
			TokenIn:   tokenIn,
			TokenOut:  tokenOut,
			AmountIn:  big.NewInt(1000000),
			MinOut:    nil,
			Recipient: recipient,
			Router:    router,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
	})

	t.Run("nil deadline defaults to zero", func(t *testing.T) {
		result, err := svc.ExecuteSwap(SwapParams{
			TokenIn:  tokenIn,
			TokenOut: tokenOut,
			AmountIn: big.NewInt(1000000),
			Deadline: nil,
			Router:   router,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
	})

	t.Run("nil amount in", func(t *testing.T) {
		_, err := svc.ExecuteSwap(SwapParams{
			TokenIn:  tokenIn,
			TokenOut: tokenOut,
			Router:   router,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount in", err.Error())
	})

	t.Run("zero amount in", func(t *testing.T) {
		_, err := svc.ExecuteSwap(SwapParams{
			TokenIn:  tokenIn,
			TokenOut: tokenOut,
			AmountIn: big.NewInt(0),
			Router:   router,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount in", err.Error())
	})

	t.Run("negative amount in", func(t *testing.T) {
		_, err := svc.ExecuteSwap(SwapParams{
			TokenIn:  tokenIn,
			TokenOut: tokenOut,
			AmountIn: big.NewInt(-1),
			Router:   router,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount in", err.Error())
	})

	t.Run("zero router address", func(t *testing.T) {
		_, err := svc.ExecuteSwap(SwapParams{
			TokenIn:  tokenIn,
			TokenOut: tokenOut,
			AmountIn: big.NewInt(1000),
		})
		require.Error(t, err)
		assert.Equal(t, "router address required", err.Error())
	})
}
