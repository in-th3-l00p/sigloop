package x402

import (
	"errors"
	"math/big"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

type BudgetTracker struct {
	state  BudgetState
	policy X402Policy
	mu     sync.Mutex
}

func NewBudgetTracker(policy X402Policy, periodDuration uint64) *BudgetTracker {
	return &BudgetTracker{
		state: BudgetState{
			TotalSpent:     big.NewInt(0),
			PeriodSpent:    big.NewInt(0),
			PeriodStart:    uint64(time.Now().Unix()),
			PeriodDuration: periodDuration,
			Records:        make([]PaymentRecord, 0),
		},
		policy: policy,
	}
}

func (bt *BudgetTracker) Track(record PaymentRecord) error {
	bt.mu.Lock()
	defer bt.mu.Unlock()

	bt.resetPeriodIfNeeded()

	if bt.policy.AllowedPayees != nil && len(bt.policy.AllowedPayees) > 0 {
		if !bt.policy.AllowedPayees[record.PayTo] {
			return errors.New("payee not in allowlist")
		}
	}

	if bt.policy.MaxPerRequest != nil && record.Amount.Cmp(bt.policy.MaxPerRequest) > 0 {
		return errors.New("amount exceeds per-request limit")
	}

	newPeriodTotal := new(big.Int).Add(bt.state.PeriodSpent, record.Amount)
	if bt.policy.MaxPerPeriod != nil && newPeriodTotal.Cmp(bt.policy.MaxPerPeriod) > 0 {
		return errors.New("amount exceeds period budget")
	}

	bt.state.TotalSpent = new(big.Int).Add(bt.state.TotalSpent, record.Amount)
	bt.state.PeriodSpent = newPeriodTotal
	bt.state.Records = append(bt.state.Records, record)

	return nil
}

func (bt *BudgetTracker) Check(amount *big.Int, payTo common.Address) error {
	bt.mu.Lock()
	defer bt.mu.Unlock()

	bt.resetPeriodIfNeeded()

	if bt.policy.AllowedPayees != nil && len(bt.policy.AllowedPayees) > 0 {
		if !bt.policy.AllowedPayees[payTo] {
			return errors.New("payee not in allowlist")
		}
	}

	if bt.policy.MaxPerRequest != nil && amount.Cmp(bt.policy.MaxPerRequest) > 0 {
		return errors.New("amount exceeds per-request limit")
	}

	newPeriodTotal := new(big.Int).Add(bt.state.PeriodSpent, amount)
	if bt.policy.MaxPerPeriod != nil && newPeriodTotal.Cmp(bt.policy.MaxPerPeriod) > 0 {
		return errors.New("amount exceeds period budget")
	}

	return nil
}

func (bt *BudgetTracker) Remaining() *big.Int {
	bt.mu.Lock()
	defer bt.mu.Unlock()

	bt.resetPeriodIfNeeded()

	if bt.policy.MaxPerPeriod == nil {
		return new(big.Int).SetInt64(-1)
	}

	remaining := new(big.Int).Sub(bt.policy.MaxPerPeriod, bt.state.PeriodSpent)
	if remaining.Sign() < 0 {
		return big.NewInt(0)
	}
	return remaining
}

func (bt *BudgetTracker) IsExhausted() bool {
	bt.mu.Lock()
	defer bt.mu.Unlock()

	bt.resetPeriodIfNeeded()

	if bt.policy.MaxPerPeriod == nil {
		return false
	}

	return bt.state.PeriodSpent.Cmp(bt.policy.MaxPerPeriod) >= 0
}

func (bt *BudgetTracker) resetPeriodIfNeeded() {
	now := uint64(time.Now().Unix())
	if bt.state.PeriodDuration > 0 && now >= bt.state.PeriodStart+bt.state.PeriodDuration {
		bt.state.PeriodSpent = big.NewInt(0)
		bt.state.PeriodStart = now
	}
}
