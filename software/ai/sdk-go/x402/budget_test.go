package x402

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testBudgetTracker(maxPerReq, maxPerPeriod int64, allowedPayees map[common.Address]bool) *BudgetTracker {
	policy := X402Policy{
		AllowedPayees: allowedPayees,
	}
	if maxPerReq > 0 {
		policy.MaxPerRequest = big.NewInt(maxPerReq)
	}
	if maxPerPeriod > 0 {
		policy.MaxPerPeriod = big.NewInt(maxPerPeriod)
	}
	return NewBudgetTracker(policy, 3600)
}

func TestNewBudgetTracker(t *testing.T) {
	policy := X402Policy{
		MaxPerRequest: big.NewInt(100),
		MaxPerPeriod:  big.NewInt(1000),
	}
	bt := NewBudgetTracker(policy, 3600)

	assert.NotNil(t, bt)
	assert.Equal(t, big.NewInt(0), bt.state.TotalSpent)
	assert.Equal(t, big.NewInt(0), bt.state.PeriodSpent)
	assert.Equal(t, uint64(3600), bt.state.PeriodDuration)
	assert.Empty(t, bt.state.Records)
}

func TestBudgetTrackerTrack(t *testing.T) {
	payee := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	otherPayee := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	t.Run("success", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		record := PaymentRecord{
			Amount: big.NewInt(50),
			PayTo:  payee,
		}
		err := bt.Track(record)
		require.NoError(t, err)
		assert.Equal(t, big.NewInt(50), bt.state.TotalSpent)
		assert.Equal(t, big.NewInt(50), bt.state.PeriodSpent)
		assert.Len(t, bt.state.Records, 1)
	})

	t.Run("exceeds per-request limit", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		record := PaymentRecord{
			Amount: big.NewInt(101),
			PayTo:  payee,
		}
		err := bt.Track(record)
		require.Error(t, err)
		assert.Equal(t, "amount exceeds per-request limit", err.Error())
	})

	t.Run("exceeds period budget", func(t *testing.T) {
		bt := testBudgetTracker(1000, 100, nil)
		record := PaymentRecord{
			Amount: big.NewInt(101),
			PayTo:  payee,
		}
		err := bt.Track(record)
		require.Error(t, err)
		assert.Equal(t, "amount exceeds period budget", err.Error())
	})

	t.Run("payee not in allowlist", func(t *testing.T) {
		allowed := map[common.Address]bool{payee: true}
		bt := testBudgetTracker(100, 1000, allowed)
		record := PaymentRecord{
			Amount: big.NewInt(50),
			PayTo:  otherPayee,
		}
		err := bt.Track(record)
		require.Error(t, err)
		assert.Equal(t, "payee not in allowlist", err.Error())
	})

	t.Run("payee in allowlist", func(t *testing.T) {
		allowed := map[common.Address]bool{payee: true}
		bt := testBudgetTracker(100, 1000, allowed)
		record := PaymentRecord{
			Amount: big.NewInt(50),
			PayTo:  payee,
		}
		err := bt.Track(record)
		require.NoError(t, err)
	})

	t.Run("cumulative tracking", func(t *testing.T) {
		bt := testBudgetTracker(100, 200, nil)
		for i := 0; i < 4; i++ {
			err := bt.Track(PaymentRecord{Amount: big.NewInt(50), PayTo: payee})
			require.NoError(t, err)
		}
		err := bt.Track(PaymentRecord{Amount: big.NewInt(1), PayTo: payee})
		require.Error(t, err)
		assert.Equal(t, "amount exceeds period budget", err.Error())
	})

	t.Run("empty allowlist means all allowed", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, map[common.Address]bool{})
		record := PaymentRecord{
			Amount: big.NewInt(50),
			PayTo:  otherPayee,
		}
		err := bt.Track(record)
		require.NoError(t, err)
	})

	t.Run("nil max per request means no limit", func(t *testing.T) {
		bt := testBudgetTracker(0, 0, nil)
		record := PaymentRecord{
			Amount: big.NewInt(999999999),
			PayTo:  payee,
		}
		err := bt.Track(record)
		require.NoError(t, err)
	})
}

func TestBudgetTrackerCheck(t *testing.T) {
	payee := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")

	t.Run("within limits", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		err := bt.Check(big.NewInt(50), payee)
		require.NoError(t, err)
	})

	t.Run("exceeds per-request", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		err := bt.Check(big.NewInt(101), payee)
		require.Error(t, err)
		assert.Equal(t, "amount exceeds per-request limit", err.Error())
	})

	t.Run("exceeds period", func(t *testing.T) {
		bt := testBudgetTracker(1000, 100, nil)
		err := bt.Check(big.NewInt(101), payee)
		require.Error(t, err)
		assert.Equal(t, "amount exceeds period budget", err.Error())
	})

	t.Run("payee blocked", func(t *testing.T) {
		allowed := map[common.Address]bool{
			common.HexToAddress("0x1111111111111111111111111111111111111111"): true,
		}
		bt := testBudgetTracker(100, 1000, allowed)
		err := bt.Check(big.NewInt(50), payee)
		require.Error(t, err)
		assert.Equal(t, "payee not in allowlist", err.Error())
	})

	t.Run("check does not mutate state", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		_ = bt.Check(big.NewInt(50), payee)
		assert.Equal(t, big.NewInt(0), bt.state.PeriodSpent)
	})
}

func TestBudgetTrackerRemaining(t *testing.T) {
	t.Run("no spending", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		remaining := bt.Remaining()
		assert.Equal(t, big.NewInt(1000), remaining)
	})

	t.Run("after spending", func(t *testing.T) {
		bt := testBudgetTracker(500, 1000, nil)
		err := bt.Track(PaymentRecord{
			Amount: big.NewInt(400),
			PayTo:  common.HexToAddress("0xbbbb"),
		})
		require.NoError(t, err)
		remaining := bt.Remaining()
		assert.Equal(t, big.NewInt(600), remaining)
	})

	t.Run("no period limit", func(t *testing.T) {
		bt := testBudgetTracker(100, 0, nil)
		remaining := bt.Remaining()
		assert.Equal(t, big.NewInt(-1), remaining)
	})

	t.Run("overspent returns zero", func(t *testing.T) {
		bt := testBudgetTracker(0, 0, nil)
		bt.policy.MaxPerPeriod = big.NewInt(100)
		bt.state.PeriodSpent = big.NewInt(150)
		remaining := bt.Remaining()
		assert.Equal(t, big.NewInt(0), remaining)
	})
}

func TestBudgetTrackerIsExhausted(t *testing.T) {
	t.Run("not exhausted", func(t *testing.T) {
		bt := testBudgetTracker(100, 1000, nil)
		assert.False(t, bt.IsExhausted())
	})

	t.Run("exhausted", func(t *testing.T) {
		bt := testBudgetTracker(0, 0, nil)
		bt.policy.MaxPerPeriod = big.NewInt(100)
		bt.state.PeriodSpent = big.NewInt(100)
		assert.True(t, bt.IsExhausted())
	})

	t.Run("over exhausted", func(t *testing.T) {
		bt := testBudgetTracker(0, 0, nil)
		bt.policy.MaxPerPeriod = big.NewInt(100)
		bt.state.PeriodSpent = big.NewInt(200)
		assert.True(t, bt.IsExhausted())
	})

	t.Run("no period limit never exhausted", func(t *testing.T) {
		bt := testBudgetTracker(100, 0, nil)
		assert.False(t, bt.IsExhausted())
	})
}
