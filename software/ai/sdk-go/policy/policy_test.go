package policy

import (
	"math/big"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewPolicyService(t *testing.T) {
	svc := NewPolicyService()
	assert.NotNil(t, svc)
	assert.NotNil(t, svc.policies)
	assert.Empty(t, svc.policies)
}

func TestCreatePolicy(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := NewPolicyService()
		p := &Policy{
			SpendingLimits: []SpendingLimit{},
		}

		created, err := svc.CreatePolicy(p)
		require.NoError(t, err)
		require.NotNil(t, created)

		assert.NotEmpty(t, created.ID)
		assert.False(t, created.CreatedAt.IsZero())

		got, err := svc.GetPolicy(created.ID)
		require.NoError(t, err)
		assert.Equal(t, created, got)
	})

	t.Run("nil policy", func(t *testing.T) {
		svc := NewPolicyService()
		_, err := svc.CreatePolicy(nil)
		require.Error(t, err)
		assert.Equal(t, "nil policy", err.Error())
	})
}

func TestGetPolicy(t *testing.T) {
	t.Run("not found", func(t *testing.T) {
		svc := NewPolicyService()
		_, err := svc.GetPolicy("nonexistent")
		require.Error(t, err)
		assert.Equal(t, "policy not found", err.Error())
	})
}

func TestValidatePolicy(t *testing.T) {
	tests := []struct {
		name    string
		policy  *Policy
		wantErr string
	}{
		{
			name:    "nil policy",
			policy:  nil,
			wantErr: "nil policy",
		},
		{
			name: "valid empty policy",
			policy: &Policy{
				SpendingLimits: nil,
			},
		},
		{
			name: "valid with spending limits",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: big.NewInt(1000),
						Period:    time.Hour,
					},
				},
			},
		},
		{
			name: "nil spending limit amount",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: nil,
						Period:    time.Hour,
					},
				},
			},
			wantErr: "invalid spending limit amount",
		},
		{
			name: "zero spending limit amount",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: big.NewInt(0),
						Period:    time.Hour,
					},
				},
			},
			wantErr: "invalid spending limit amount",
		},
		{
			name: "negative spending limit amount",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: big.NewInt(-1),
						Period:    time.Hour,
					},
				},
			},
			wantErr: "invalid spending limit amount",
		},
		{
			name: "zero period",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: big.NewInt(100),
						Period:    0,
					},
				},
			},
			wantErr: "invalid spending limit period",
		},
		{
			name: "negative period",
			policy: &Policy{
				SpendingLimits: []SpendingLimit{
					{
						MaxAmount: big.NewInt(100),
						Period:    -time.Hour,
					},
				},
			},
			wantErr: "invalid spending limit period",
		},
		{
			name: "time window start after end",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Start: time.Now().Add(time.Hour),
					End:   time.Now(),
					Hours: [2]int{0, 23},
				},
			},
			wantErr: "time window start after end",
		},
		{
			name: "valid time window with zero end",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Start: time.Now(),
					End:   time.Time{},
					Hours: [2]int{9, 17},
				},
			},
		},
		{
			name: "invalid start hour negative",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Hours: [2]int{-1, 17},
				},
			},
			wantErr: "invalid start hour",
		},
		{
			name: "invalid start hour over 23",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Hours: [2]int{24, 17},
				},
			},
			wantErr: "invalid start hour",
		},
		{
			name: "invalid end hour negative",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Hours: [2]int{9, -1},
				},
			},
			wantErr: "invalid end hour",
		},
		{
			name: "invalid end hour over 23",
			policy: &Policy{
				TimeWindow: &TimeWindow{
					Hours: [2]int{9, 24},
				},
			},
			wantErr: "invalid end hour",
		},
		{
			name: "rate limit zero max calls",
			policy: &Policy{
				RateLimit: &RateLimit{
					MaxCalls: 0,
					Period:   time.Minute,
				},
			},
			wantErr: "rate limit max calls must be positive",
		},
		{
			name: "rate limit zero period",
			policy: &Policy{
				RateLimit: &RateLimit{
					MaxCalls: 10,
					Period:   0,
				},
			},
			wantErr: "invalid rate limit period",
		},
		{
			name: "rate limit negative period",
			policy: &Policy{
				RateLimit: &RateLimit{
					MaxCalls: 10,
					Period:   -time.Minute,
				},
			},
			wantErr: "invalid rate limit period",
		},
		{
			name: "valid rate limit",
			policy: &Policy{
				RateLimit: &RateLimit{
					MaxCalls: 100,
					Period:   time.Hour,
				},
			},
		},
	}

	svc := NewPolicyService()
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := svc.ValidatePolicy(tc.policy)
			if tc.wantErr != "" {
				require.Error(t, err)
				assert.Equal(t, tc.wantErr, err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}
