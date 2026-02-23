package encoding

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEncodePolicy(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		p := &PolicyEncoding{
			SpendingTokens:  []common.Address{common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")},
			SpendingAmounts: []*big.Int{big.NewInt(1000000)},
			Contracts:       []common.Address{common.HexToAddress("0x1111111111111111111111111111111111111111")},
			FunctionSigs:    [][4]byte{{0x61, 0x7b, 0xa0, 0x37}},
			ValidAfter:      big.NewInt(0),
			ValidUntil:      big.NewInt(9999999999),
			RateMaxCalls:    big.NewInt(100),
			RatePeriod:      big.NewInt(3600),
		}

		data, err := EncodePolicy(p)
		require.NoError(t, err)
		assert.NotEmpty(t, data)
	})

	t.Run("nil policy", func(t *testing.T) {
		_, err := EncodePolicy(nil)
		require.Error(t, err)
		assert.Equal(t, "nil policy encoding", err.Error())
	})

	t.Run("empty arrays", func(t *testing.T) {
		p := &PolicyEncoding{
			SpendingTokens:  []common.Address{},
			SpendingAmounts: []*big.Int{},
			Contracts:       []common.Address{},
			FunctionSigs:    [][4]byte{},
			ValidAfter:      big.NewInt(0),
			ValidUntil:      big.NewInt(0),
			RateMaxCalls:    big.NewInt(0),
			RatePeriod:      big.NewInt(0),
		}

		data, err := EncodePolicy(p)
		require.NoError(t, err)
		assert.NotEmpty(t, data)
	})
}

func TestDecodePolicy(t *testing.T) {
	t.Run("roundtrip", func(t *testing.T) {
		original := &PolicyEncoding{
			SpendingTokens: []common.Address{
				common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
				common.HexToAddress("0x4200000000000000000000000000000000000006"),
			},
			SpendingAmounts: []*big.Int{big.NewInt(1000000), big.NewInt(2000000)},
			Contracts: []common.Address{
				common.HexToAddress("0x1111111111111111111111111111111111111111"),
			},
			FunctionSigs: [][4]byte{{0x61, 0x7b, 0xa0, 0x37}, {0xa4, 0x15, 0xbc, 0xad}},
			ValidAfter:   big.NewInt(100),
			ValidUntil:   big.NewInt(9999999999),
			RateMaxCalls: big.NewInt(50),
			RatePeriod:   big.NewInt(7200),
		}

		data, err := EncodePolicy(original)
		require.NoError(t, err)

		decoded, err := DecodePolicy(data)
		require.NoError(t, err)
		require.NotNil(t, decoded)

		assert.Equal(t, original.SpendingTokens, decoded.SpendingTokens)
		assert.Equal(t, len(original.SpendingAmounts), len(decoded.SpendingAmounts))
		for i := range original.SpendingAmounts {
			assert.Equal(t, 0, original.SpendingAmounts[i].Cmp(decoded.SpendingAmounts[i]))
		}
		assert.Equal(t, original.Contracts, decoded.Contracts)
		assert.Equal(t, original.FunctionSigs, decoded.FunctionSigs)
		assert.Equal(t, 0, original.ValidAfter.Cmp(decoded.ValidAfter))
		assert.Equal(t, 0, original.ValidUntil.Cmp(decoded.ValidUntil))
		assert.Equal(t, 0, original.RateMaxCalls.Cmp(decoded.RateMaxCalls))
		assert.Equal(t, 0, original.RatePeriod.Cmp(decoded.RatePeriod))
	})

	t.Run("invalid data", func(t *testing.T) {
		_, err := DecodePolicy([]byte{0x01, 0x02, 0x03})
		require.Error(t, err)
	})
}

func TestEncodeFunctionCall(t *testing.T) {
	t.Run("no args", func(t *testing.T) {
		data, err := EncodeFunctionCall("totalSupply()")
		require.NoError(t, err)
		assert.Len(t, data, 4)
	})

	t.Run("with args", func(t *testing.T) {
		data, err := EncodeFunctionCall(
			"transfer(address,uint256)",
			common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
			big.NewInt(1000000),
		)
		require.NoError(t, err)
		assert.True(t, len(data) > 4)
		assert.Len(t, data, 4+64)
	})

	t.Run("multiple args", func(t *testing.T) {
		data, err := EncodeFunctionCall(
			"transferFrom(address,address,uint256)",
			common.HexToAddress("0xaaaa"),
			common.HexToAddress("0xbbbb"),
			big.NewInt(500),
		)
		require.NoError(t, err)
		assert.Len(t, data, 4+96)
	})

	t.Run("wrong number of args", func(t *testing.T) {
		_, err := EncodeFunctionCall(
			"transfer(address,uint256)",
			common.HexToAddress("0xbbbb"),
		)
		require.Error(t, err)
	})
}

func TestParseSignatureArgs(t *testing.T) {
	t.Run("no params", func(t *testing.T) {
		args, err := parseSignatureArgs("totalSupply()")
		require.NoError(t, err)
		assert.Empty(t, args)
	})

	t.Run("single param", func(t *testing.T) {
		args, err := parseSignatureArgs("balanceOf(address)")
		require.NoError(t, err)
		assert.Len(t, args, 1)
	})

	t.Run("multiple params", func(t *testing.T) {
		args, err := parseSignatureArgs("transfer(address,uint256)")
		require.NoError(t, err)
		assert.Len(t, args, 2)
	})

	t.Run("no parentheses", func(t *testing.T) {
		args, err := parseSignatureArgs("nope")
		require.NoError(t, err)
		assert.Empty(t, args)
	})
}

func TestSplitParams(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "single param",
			input:    "uint256",
			expected: []string{"uint256"},
		},
		{
			name:     "two params",
			input:    "address,uint256",
			expected: []string{"address", "uint256"},
		},
		{
			name:     "three params",
			input:    "address,address,uint256",
			expected: []string{"address", "address", "uint256"},
		},
		{
			name:     "empty string",
			input:    "",
			expected: nil,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := splitParams(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}
