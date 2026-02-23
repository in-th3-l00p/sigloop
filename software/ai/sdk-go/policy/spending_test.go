package policy

import (
	"math/big"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewSpendingLimit(t *testing.T) {
	token := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	maxAmount := big.NewInt(1000000)
	period := time.Hour

	sl := NewSpendingLimit(token, maxAmount, period)

	assert.Equal(t, token, sl.Token)
	assert.Equal(t, maxAmount, sl.MaxAmount)
	assert.NotSame(t, maxAmount, sl.MaxAmount)
	assert.Equal(t, big.NewInt(0), sl.Spent)
	assert.Equal(t, period, sl.Period)
	assert.False(t, sl.ResetAt.IsZero())
	assert.True(t, sl.ResetAt.After(time.Now()))
}

func TestCheckSpendingLimit(t *testing.T) {
	tests := []struct {
		name    string
		sl      *SpendingLimit
		amount  *big.Int
		wantErr string
	}{
		{
			name:    "nil spending limit",
			sl:      nil,
			amount:  big.NewInt(100),
			wantErr: "nil spending limit",
		},
		{
			name: "nil amount",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(0),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount:  nil,
			wantErr: "invalid amount",
		},
		{
			name: "zero amount",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(0),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount:  big.NewInt(0),
			wantErr: "invalid amount",
		},
		{
			name: "negative amount",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(0),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount:  big.NewInt(-1),
			wantErr: "invalid amount",
		},
		{
			name: "within limit",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(0),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount: big.NewInt(500),
		},
		{
			name: "exactly at limit",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(0),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount: big.NewInt(1000),
		},
		{
			name: "exceeds limit",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(500),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount:  big.NewInt(501),
			wantErr: "spending limit exceeded",
		},
		{
			name: "exceeds limit - already at max",
			sl: &SpendingLimit{
				MaxAmount: big.NewInt(1000),
				Spent:     big.NewInt(1000),
				Period:    time.Hour,
				ResetAt:   time.Now().Add(time.Hour),
			},
			amount:  big.NewInt(1),
			wantErr: "spending limit exceeded",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := CheckSpendingLimit(tc.sl, tc.amount)
			if tc.wantErr != "" {
				require.Error(t, err)
				assert.Equal(t, tc.wantErr, err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestCheckSpendingLimitPeriodReset(t *testing.T) {
	sl := &SpendingLimit{
		MaxAmount: big.NewInt(1000),
		Spent:     big.NewInt(999),
		Period:    time.Millisecond,
		ResetAt:   time.Now().Add(-time.Second),
	}

	err := CheckSpendingLimit(sl, big.NewInt(500))
	require.NoError(t, err)
	assert.Equal(t, big.NewInt(0), sl.Spent)
}

func TestUpdateSpending(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		sl := NewSpendingLimit(
			common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
			big.NewInt(1000),
			time.Hour,
		)

		err := UpdateSpending(sl, big.NewInt(400))
		require.NoError(t, err)
		assert.Equal(t, big.NewInt(400), sl.Spent)

		err = UpdateSpending(sl, big.NewInt(300))
		require.NoError(t, err)
		assert.Equal(t, big.NewInt(700), sl.Spent)
	})

	t.Run("exceeds limit", func(t *testing.T) {
		sl := NewSpendingLimit(
			common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
			big.NewInt(1000),
			time.Hour,
		)

		err := UpdateSpending(sl, big.NewInt(1001))
		require.Error(t, err)
		assert.Equal(t, "spending limit exceeded", err.Error())
		assert.Equal(t, big.NewInt(0), sl.Spent)
	})

	t.Run("nil spending limit", func(t *testing.T) {
		err := UpdateSpending(nil, big.NewInt(100))
		require.Error(t, err)
	})

	t.Run("nil amount", func(t *testing.T) {
		sl := NewSpendingLimit(
			common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
			big.NewInt(1000),
			time.Hour,
		)
		err := UpdateSpending(sl, nil)
		require.Error(t, err)
	})
}
