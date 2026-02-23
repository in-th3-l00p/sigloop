package defi

import (
	"errors"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

var supplyABI = abi.Arguments{
	{Type: mustType("address")},
	{Type: mustType("uint256")},
	{Type: mustType("address")},
	{Type: mustType("uint16")},
}

var borrowABI = abi.Arguments{
	{Type: mustType("address")},
	{Type: mustType("uint256")},
	{Type: mustType("uint256")},
	{Type: mustType("uint16")},
	{Type: mustType("address")},
}

var repayABI = abi.Arguments{
	{Type: mustType("address")},
	{Type: mustType("uint256")},
	{Type: mustType("uint256")},
	{Type: mustType("address")},
}

func (s *DeFiService) Supply(params LendingParams) (*DeFiResult, error) {
	if params.Amount == nil || params.Amount.Sign() <= 0 {
		return nil, errors.New("invalid amount")
	}

	if params.Pool == (common.Address{}) {
		return nil, errors.New("pool address required")
	}

	onBehalf := params.OnBehalf
	if onBehalf == (common.Address{}) {
		onBehalf = params.Pool
	}

	packed, err := supplyABI.Pack(
		params.Token,
		params.Amount,
		onBehalf,
		uint16(0),
	)
	if err != nil {
		return nil, err
	}

	selector := []byte{0x61, 0x7b, 0xa0, 0x37}
	calldata := append(selector, packed...)

	return &DeFiResult{
		To:       params.Pool,
		Data:     calldata,
		Value:    big.NewInt(0),
		GasLimit: 250000,
	}, nil
}

func (s *DeFiService) Borrow(params LendingParams) (*DeFiResult, error) {
	if params.Amount == nil || params.Amount.Sign() <= 0 {
		return nil, errors.New("invalid amount")
	}

	if params.Pool == (common.Address{}) {
		return nil, errors.New("pool address required")
	}

	onBehalf := params.OnBehalf
	if onBehalf == (common.Address{}) {
		onBehalf = params.Pool
	}

	packed, err := borrowABI.Pack(
		params.Token,
		params.Amount,
		big.NewInt(2),
		uint16(0),
		onBehalf,
	)
	if err != nil {
		return nil, err
	}

	selector := []byte{0xa4, 0x15, 0xbc, 0xad}
	calldata := append(selector, packed...)

	return &DeFiResult{
		To:       params.Pool,
		Data:     calldata,
		Value:    big.NewInt(0),
		GasLimit: 300000,
	}, nil
}

func (s *DeFiService) Repay(params LendingParams) (*DeFiResult, error) {
	if params.Amount == nil || params.Amount.Sign() <= 0 {
		return nil, errors.New("invalid amount")
	}

	if params.Pool == (common.Address{}) {
		return nil, errors.New("pool address required")
	}

	onBehalf := params.OnBehalf
	if onBehalf == (common.Address{}) {
		onBehalf = params.Pool
	}

	packed, err := repayABI.Pack(
		params.Token,
		params.Amount,
		big.NewInt(2),
		onBehalf,
	)
	if err != nil {
		return nil, err
	}

	selector := []byte{0x57, 0x3e, 0xba, 0x17}
	calldata := append(selector, packed...)

	return &DeFiResult{
		To:       params.Pool,
		Data:     calldata,
		Value:    big.NewInt(0),
		GasLimit: 250000,
	}, nil
}
