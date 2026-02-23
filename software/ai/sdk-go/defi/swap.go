package defi

import (
	"errors"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

var swapExactTokensABI = abi.Arguments{
	{Type: mustType("uint256")},
	{Type: mustType("uint256")},
	{Type: mustType("address[]")},
	{Type: mustType("address")},
	{Type: mustType("uint256")},
}

func (s *DeFiService) ExecuteSwap(params SwapParams) (*DeFiResult, error) {
	if params.AmountIn == nil || params.AmountIn.Sign() <= 0 {
		return nil, errors.New("invalid amount in")
	}

	if params.MinOut == nil {
		params.MinOut = big.NewInt(0)
	}

	if params.Router == (common.Address{}) {
		return nil, errors.New("router address required")
	}

	if params.Deadline == nil {
		params.Deadline = big.NewInt(0)
	}

	path := []common.Address{params.TokenIn, params.TokenOut}

	packed, err := swapExactTokensABI.Pack(
		params.AmountIn,
		params.MinOut,
		path,
		params.Recipient,
		params.Deadline,
	)
	if err != nil {
		return nil, err
	}

	selector := []byte{0x38, 0xed, 0x17, 0x39}
	calldata := append(selector, packed...)

	return &DeFiResult{
		To:       params.Router,
		Data:     calldata,
		Value:    big.NewInt(0),
		GasLimit: 300000,
	}, nil
}

func mustType(t string) abi.Type {
	typ, _ := abi.NewType(t, "", nil)
	return typ
}
