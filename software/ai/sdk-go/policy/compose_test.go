package policy

import (
	"math/big"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComposePolicy(t *testing.T) {
	t.Run("empty input", func(t *testing.T) {
		result := ComposePolicy()
		require.NotNil(t, result)
		assert.Empty(t, result.SpendingLimits)
		assert.Nil(t, result.ContractAllowlist)
		assert.Nil(t, result.FunctionAllowlist)
		assert.Nil(t, result.TimeWindow)
		assert.Nil(t, result.RateLimit)
	})

	t.Run("nil policies skipped", func(t *testing.T) {
		result := ComposePolicy(nil, nil)
		require.NotNil(t, result)
		assert.Empty(t, result.SpendingLimits)
	})

	t.Run("single policy passthrough", func(t *testing.T) {
		contract := common.HexToAddress("0x1111111111111111111111111111111111111111")
		p := &Policy{
			SpendingLimits: []SpendingLimit{
				{MaxAmount: big.NewInt(1000), Period: time.Hour},
			},
			ContractAllowlist: NewContractAllowlist([]common.Address{contract}),
			FunctionAllowlist: NewFunctionAllowlist([]string{"transfer(address,uint256)"}),
			TimeWindow: &TimeWindow{
				Start: time.Now(),
				End:   time.Now().Add(24 * time.Hour),
				Hours: [2]int{9, 17},
			},
			RateLimit: &RateLimit{
				MaxCalls: 100,
				Period:   time.Hour,
			},
		}

		result := ComposePolicy(p)
		require.NotNil(t, result)
		assert.Len(t, result.SpendingLimits, 1)
		assert.NotNil(t, result.ContractAllowlist)
		assert.True(t, result.ContractAllowlist.Contracts[contract])
		assert.NotNil(t, result.FunctionAllowlist)
		assert.NotNil(t, result.TimeWindow)
		assert.NotNil(t, result.RateLimit)
	})

	t.Run("spending limits merged", func(t *testing.T) {
		p1 := &Policy{
			SpendingLimits: []SpendingLimit{
				{MaxAmount: big.NewInt(100), Period: time.Hour},
			},
		}
		p2 := &Policy{
			SpendingLimits: []SpendingLimit{
				{MaxAmount: big.NewInt(200), Period: time.Minute},
				{MaxAmount: big.NewInt(300), Period: time.Second},
			},
		}

		result := ComposePolicy(p1, p2)
		assert.Len(t, result.SpendingLimits, 3)
	})

	t.Run("contract allowlists merged", func(t *testing.T) {
		c1 := common.HexToAddress("0x1111111111111111111111111111111111111111")
		c2 := common.HexToAddress("0x2222222222222222222222222222222222222222")
		c3 := common.HexToAddress("0x3333333333333333333333333333333333333333")

		p1 := &Policy{
			ContractAllowlist: NewContractAllowlist([]common.Address{c1, c2}),
		}
		p2 := &Policy{
			ContractAllowlist: NewContractAllowlist([]common.Address{c2, c3}),
		}

		result := ComposePolicy(p1, p2)
		require.NotNil(t, result.ContractAllowlist)
		assert.True(t, result.ContractAllowlist.Contracts[c1])
		assert.True(t, result.ContractAllowlist.Contracts[c2])
		assert.True(t, result.ContractAllowlist.Contracts[c3])
		assert.Len(t, result.ContractAllowlist.Contracts, 3)
	})

	t.Run("function allowlists merged", func(t *testing.T) {
		p1 := &Policy{
			FunctionAllowlist: NewFunctionAllowlist([]string{"transfer(address,uint256)"}),
		}
		p2 := &Policy{
			FunctionAllowlist: NewFunctionAllowlist([]string{"approve(address,uint256)"}),
		}

		result := ComposePolicy(p1, p2)
		require.NotNil(t, result.FunctionAllowlist)
		assert.Len(t, result.FunctionAllowlist.Functions, 2)
	})

	t.Run("time windows - later start wins", func(t *testing.T) {
		now := time.Now()
		p1 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now,
				End:   now.Add(48 * time.Hour),
				Hours: [2]int{9, 17},
			},
		}
		p2 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now.Add(time.Hour),
				End:   now.Add(24 * time.Hour),
				Hours: [2]int{10, 18},
			},
		}

		result := ComposePolicy(p1, p2)
		require.NotNil(t, result.TimeWindow)
		assert.Equal(t, now.Add(time.Hour), result.TimeWindow.Start)
		assert.Equal(t, now.Add(24*time.Hour), result.TimeWindow.End)
	})

	t.Run("time windows - earlier end wins", func(t *testing.T) {
		now := time.Now()
		p1 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now,
				End:   now.Add(24 * time.Hour),
			},
		}
		p2 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now,
				End:   now.Add(48 * time.Hour),
			},
		}

		result := ComposePolicy(p1, p2)
		assert.Equal(t, now.Add(24*time.Hour), result.TimeWindow.End)
	})

	t.Run("time windows - zero end treated specially", func(t *testing.T) {
		now := time.Now()
		endTime := now.Add(24 * time.Hour)
		p1 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now,
				End:   time.Time{},
			},
		}
		p2 := &Policy{
			TimeWindow: &TimeWindow{
				Start: now,
				End:   endTime,
			},
		}

		result := ComposePolicy(p1, p2)
		assert.Equal(t, endTime, result.TimeWindow.End)
	})

	t.Run("rate limits - lower max calls wins", func(t *testing.T) {
		p1 := &Policy{
			RateLimit: &RateLimit{
				MaxCalls: 100,
				Period:   time.Minute,
			},
		}
		p2 := &Policy{
			RateLimit: &RateLimit{
				MaxCalls: 50,
				Period:   time.Second,
			},
		}

		result := ComposePolicy(p1, p2)
		require.NotNil(t, result.RateLimit)
		assert.Equal(t, uint64(50), result.RateLimit.MaxCalls)
	})

	t.Run("rate limits - longer period wins", func(t *testing.T) {
		p1 := &Policy{
			RateLimit: &RateLimit{
				MaxCalls: 100,
				Period:   time.Minute,
			},
		}
		p2 := &Policy{
			RateLimit: &RateLimit{
				MaxCalls: 200,
				Period:   time.Hour,
			},
		}

		result := ComposePolicy(p1, p2)
		assert.Equal(t, time.Hour, result.RateLimit.Period)
	})

	t.Run("mixed nil and non-nil policies", func(t *testing.T) {
		p := &Policy{
			SpendingLimits: []SpendingLimit{
				{MaxAmount: big.NewInt(100), Period: time.Hour},
			},
		}

		result := ComposePolicy(nil, p, nil)
		assert.Len(t, result.SpendingLimits, 1)
	})
}
