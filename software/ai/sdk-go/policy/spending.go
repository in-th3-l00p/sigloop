package policy

import (
	"errors"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

func NewSpendingLimit(token common.Address, maxAmount *big.Int, period time.Duration) *SpendingLimit {
	return &SpendingLimit{
		Token:     token,
		MaxAmount: new(big.Int).Set(maxAmount),
		Spent:     big.NewInt(0),
		Period:    period,
		ResetAt:   time.Now().Add(period),
	}
}

func CheckSpendingLimit(sl *SpendingLimit, amount *big.Int) error {
	if sl == nil {
		return errors.New("nil spending limit")
	}

	if amount == nil || amount.Sign() <= 0 {
		return errors.New("invalid amount")
	}

	now := time.Now()
	if now.After(sl.ResetAt) {
		sl.Spent = big.NewInt(0)
		sl.ResetAt = now.Add(sl.Period)
	}

	newTotal := new(big.Int).Add(sl.Spent, amount)
	if newTotal.Cmp(sl.MaxAmount) > 0 {
		return errors.New("spending limit exceeded")
	}

	return nil
}

func UpdateSpending(sl *SpendingLimit, amount *big.Int) error {
	if err := CheckSpendingLimit(sl, amount); err != nil {
		return err
	}

	sl.Spent = new(big.Int).Add(sl.Spent, amount)
	return nil
}
