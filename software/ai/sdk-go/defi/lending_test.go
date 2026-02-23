package defi

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/sdk-go/chain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestDeFiService() *DeFiService {
	return NewDeFiService(chain.NewChainService())
}

func TestSupply(t *testing.T) {
	svc := newTestDeFiService()
	token := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	pool := common.HexToAddress("0x1111111111111111111111111111111111111111")
	onBehalf := common.HexToAddress("0x2222222222222222222222222222222222222222")

	t.Run("success with on behalf", func(t *testing.T) {
		result, err := svc.Supply(LendingParams{
			Token:    token,
			Amount:   big.NewInt(1000000),
			Pool:     pool,
			OnBehalf: onBehalf,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, pool, result.To)
		assert.Equal(t, big.NewInt(0), result.Value)
		assert.Equal(t, uint64(250000), result.GasLimit)
		assert.True(t, len(result.Data) > 4)
		assert.Equal(t, []byte{0x61, 0x7b, 0xa0, 0x37}, result.Data[:4])
	})

	t.Run("success without on behalf defaults to pool", func(t *testing.T) {
		result, err := svc.Supply(LendingParams{
			Token:  token,
			Amount: big.NewInt(1000000),
			Pool:   pool,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, pool, result.To)
	})

	t.Run("nil amount", func(t *testing.T) {
		_, err := svc.Supply(LendingParams{
			Token: token,
			Pool:  pool,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("zero amount", func(t *testing.T) {
		_, err := svc.Supply(LendingParams{
			Token:  token,
			Amount: big.NewInt(0),
			Pool:   pool,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("negative amount", func(t *testing.T) {
		_, err := svc.Supply(LendingParams{
			Token:  token,
			Amount: big.NewInt(-1),
			Pool:   pool,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("zero pool address", func(t *testing.T) {
		_, err := svc.Supply(LendingParams{
			Token:  token,
			Amount: big.NewInt(1000),
		})
		require.Error(t, err)
		assert.Equal(t, "pool address required", err.Error())
	})
}

func TestBorrow(t *testing.T) {
	svc := newTestDeFiService()
	token := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	pool := common.HexToAddress("0x1111111111111111111111111111111111111111")
	onBehalf := common.HexToAddress("0x2222222222222222222222222222222222222222")

	t.Run("success", func(t *testing.T) {
		result, err := svc.Borrow(LendingParams{
			Token:    token,
			Amount:   big.NewInt(500000),
			Pool:     pool,
			OnBehalf: onBehalf,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, pool, result.To)
		assert.Equal(t, big.NewInt(0), result.Value)
		assert.Equal(t, uint64(300000), result.GasLimit)
		assert.Equal(t, []byte{0xa4, 0x15, 0xbc, 0xad}, result.Data[:4])
	})

	t.Run("without on behalf", func(t *testing.T) {
		result, err := svc.Borrow(LendingParams{
			Token:  token,
			Amount: big.NewInt(500000),
			Pool:   pool,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
	})

	t.Run("nil amount", func(t *testing.T) {
		_, err := svc.Borrow(LendingParams{
			Token: token,
			Pool:  pool,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("zero pool", func(t *testing.T) {
		_, err := svc.Borrow(LendingParams{
			Token:  token,
			Amount: big.NewInt(100),
		})
		require.Error(t, err)
		assert.Equal(t, "pool address required", err.Error())
	})
}

func TestRepay(t *testing.T) {
	svc := newTestDeFiService()
	token := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	pool := common.HexToAddress("0x1111111111111111111111111111111111111111")
	onBehalf := common.HexToAddress("0x2222222222222222222222222222222222222222")

	t.Run("success", func(t *testing.T) {
		result, err := svc.Repay(LendingParams{
			Token:    token,
			Amount:   big.NewInt(500000),
			Pool:     pool,
			OnBehalf: onBehalf,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
		assert.Equal(t, pool, result.To)
		assert.Equal(t, big.NewInt(0), result.Value)
		assert.Equal(t, uint64(250000), result.GasLimit)
		assert.Equal(t, []byte{0x57, 0x3e, 0xba, 0x17}, result.Data[:4])
	})

	t.Run("without on behalf", func(t *testing.T) {
		result, err := svc.Repay(LendingParams{
			Token:  token,
			Amount: big.NewInt(500000),
			Pool:   pool,
		})
		require.NoError(t, err)
		require.NotNil(t, result)
	})

	t.Run("nil amount", func(t *testing.T) {
		_, err := svc.Repay(LendingParams{
			Token: token,
			Pool:  pool,
		})
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("zero pool", func(t *testing.T) {
		_, err := svc.Repay(LendingParams{
			Token:  token,
			Amount: big.NewInt(100),
		})
		require.Error(t, err)
		assert.Equal(t, "pool address required", err.Error())
	})
}
