package encoding

import (
	"errors"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type PolicyEncoding struct {
	SpendingTokens  []common.Address
	SpendingAmounts []*big.Int
	Contracts       []common.Address
	FunctionSigs    [][4]byte
	ValidAfter      *big.Int
	ValidUntil      *big.Int
	RateMaxCalls    *big.Int
	RatePeriod      *big.Int
}

var policyABIArgs = abi.Arguments{
	{Type: mustNewType("address[]")},
	{Type: mustNewType("uint256[]")},
	{Type: mustNewType("address[]")},
	{Type: mustNewType("bytes4[]")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
}

func EncodePolicy(p *PolicyEncoding) ([]byte, error) {
	if p == nil {
		return nil, errors.New("nil policy encoding")
	}

	sigs := make([][4]byte, len(p.FunctionSigs))
	copy(sigs, p.FunctionSigs)

	return policyABIArgs.Pack(
		p.SpendingTokens,
		p.SpendingAmounts,
		p.Contracts,
		sigs,
		p.ValidAfter,
		p.ValidUntil,
		p.RateMaxCalls,
		p.RatePeriod,
	)
}

func DecodePolicy(data []byte) (*PolicyEncoding, error) {
	values, err := policyABIArgs.Unpack(data)
	if err != nil {
		return nil, err
	}

	if len(values) != 8 {
		return nil, errors.New("invalid policy data")
	}

	tokens, ok := values[0].([]common.Address)
	if !ok {
		return nil, errors.New("invalid spending tokens")
	}

	amounts, ok := values[1].([]*big.Int)
	if !ok {
		return nil, errors.New("invalid spending amounts")
	}

	contracts, ok := values[2].([]common.Address)
	if !ok {
		return nil, errors.New("invalid contracts")
	}

	rawSigs, ok := values[3].([][4]byte)
	if !ok {
		return nil, errors.New("invalid function sigs")
	}

	validAfter, ok := values[4].(*big.Int)
	if !ok {
		return nil, errors.New("invalid valid after")
	}

	validUntil, ok := values[5].(*big.Int)
	if !ok {
		return nil, errors.New("invalid valid until")
	}

	rateMax, ok := values[6].(*big.Int)
	if !ok {
		return nil, errors.New("invalid rate max calls")
	}

	ratePeriod, ok := values[7].(*big.Int)
	if !ok {
		return nil, errors.New("invalid rate period")
	}

	return &PolicyEncoding{
		SpendingTokens:  tokens,
		SpendingAmounts: amounts,
		Contracts:       contracts,
		FunctionSigs:    rawSigs,
		ValidAfter:      validAfter,
		ValidUntil:      validUntil,
		RateMaxCalls:    rateMax,
		RatePeriod:      ratePeriod,
	}, nil
}

func EncodeFunctionCall(signature string, args ...interface{}) ([]byte, error) {
	selector := crypto.Keccak256([]byte(signature))[:4]

	if len(args) == 0 {
		return selector, nil
	}

	abiArgs, err := parseSignatureArgs(signature)
	if err != nil {
		return nil, err
	}

	packed, err := abiArgs.Pack(args...)
	if err != nil {
		return nil, err
	}

	return append(selector, packed...), nil
}

func parseSignatureArgs(sig string) (abi.Arguments, error) {
	start := -1
	end := -1
	for i, c := range sig {
		if c == '(' {
			start = i + 1
		}
		if c == ')' {
			end = i
		}
	}

	if start == -1 || end == -1 || start >= end {
		return abi.Arguments{}, nil
	}

	paramStr := sig[start:end]
	if paramStr == "" {
		return abi.Arguments{}, nil
	}

	var args abi.Arguments
	params := splitParams(paramStr)
	for _, p := range params {
		typ, err := abi.NewType(p, "", nil)
		if err != nil {
			return nil, err
		}
		args = append(args, abi.Argument{Type: typ})
	}

	return args, nil
}

func splitParams(s string) []string {
	var result []string
	depth := 0
	start := 0
	for i, c := range s {
		switch c {
		case '(':
			depth++
		case ')':
			depth--
		case ',':
			if depth == 0 {
				result = append(result, s[start:i])
				start = i + 1
			}
		}
	}
	if start < len(s) {
		result = append(result, s[start:])
	}
	return result
}

func mustNewType(t string) abi.Type {
	typ, _ := abi.NewType(t, "", nil)
	return typ
}
