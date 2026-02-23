package defi

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

type SwapParams struct {
	TokenIn    common.Address
	TokenOut   common.Address
	AmountIn   *big.Int
	MinOut     *big.Int
	Recipient  common.Address
	Deadline   *big.Int
	Router     common.Address
}

type LendingParams struct {
	Token      common.Address
	Amount     *big.Int
	Pool       common.Address
	OnBehalf   common.Address
}

type StakeParams struct {
	Token      common.Address
	Amount     *big.Int
	Validator  common.Address
}

type DeFiResult struct {
	To       common.Address
	Data     []byte
	Value    *big.Int
	GasLimit uint64
}
