package policy

import (
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type Policy struct {
	ID                string
	SpendingLimits    []SpendingLimit
	ContractAllowlist *ContractAllowlist
	FunctionAllowlist *FunctionAllowlist
	TimeWindow        *TimeWindow
	RateLimit         *RateLimit
	CreatedAt         time.Time
}

type SpendingLimit struct {
	Token       common.Address
	MaxAmount   *big.Int
	Spent       *big.Int
	Period      time.Duration
	ResetAt     time.Time
}

type ContractAllowlist struct {
	Contracts map[common.Address]bool
}

type FunctionAllowlist struct {
	Functions map[string]bool
}

type TimeWindow struct {
	Start time.Time
	End   time.Time
	Days  []time.Weekday
	Hours [2]int
}

type RateLimit struct {
	MaxCalls  uint64
	Calls     uint64
	Period    time.Duration
	ResetAt   time.Time
}
