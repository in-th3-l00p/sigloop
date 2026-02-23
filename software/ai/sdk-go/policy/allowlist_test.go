package policy

import (
	"encoding/hex"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewContractAllowlist(t *testing.T) {
	t.Run("with contracts", func(t *testing.T) {
		contracts := []common.Address{
			common.HexToAddress("0x1111111111111111111111111111111111111111"),
			common.HexToAddress("0x2222222222222222222222222222222222222222"),
		}
		al := NewContractAllowlist(contracts)
		require.NotNil(t, al)
		assert.Len(t, al.Contracts, 2)
		assert.True(t, al.Contracts[contracts[0]])
		assert.True(t, al.Contracts[contracts[1]])
	})

	t.Run("empty list", func(t *testing.T) {
		al := NewContractAllowlist(nil)
		require.NotNil(t, al)
		assert.Empty(t, al.Contracts)
	})
}

func TestNewFunctionAllowlist(t *testing.T) {
	t.Run("with signatures", func(t *testing.T) {
		sigs := []string{
			"transfer(address,uint256)",
			"approve(address,uint256)",
		}
		al := NewFunctionAllowlist(sigs)
		require.NotNil(t, al)
		assert.Len(t, al.Functions, 2)

		for _, sig := range sigs {
			selector := crypto.Keccak256([]byte(sig))[:4]
			selectorHex := hex.EncodeToString(selector)
			assert.True(t, al.Functions[selectorHex])
		}
	})

	t.Run("empty list", func(t *testing.T) {
		al := NewFunctionAllowlist(nil)
		require.NotNil(t, al)
		assert.Empty(t, al.Functions)
	})
}

func TestIsAllowed(t *testing.T) {
	contract1 := common.HexToAddress("0x1111111111111111111111111111111111111111")
	contract2 := common.HexToAddress("0x2222222222222222222222222222222222222222")
	unknownContract := common.HexToAddress("0x3333333333333333333333333333333333333333")

	transferSig := "transfer(address,uint256)"
	approveSig := "approve(address,uint256)"
	unknownSig := "burn(uint256)"

	tests := []struct {
		name        string
		policy      *Policy
		contract    common.Address
		functionSig string
		want        bool
	}{
		{
			name:        "nil policy",
			policy:      nil,
			contract:    contract1,
			functionSig: transferSig,
			want:        false,
		},
		{
			name:        "no allowlists - everything allowed",
			policy:      &Policy{},
			contract:    contract1,
			functionSig: transferSig,
			want:        true,
		},
		{
			name: "contract allowed",
			policy: &Policy{
				ContractAllowlist: NewContractAllowlist([]common.Address{contract1, contract2}),
			},
			contract:    contract1,
			functionSig: transferSig,
			want:        true,
		},
		{
			name: "contract not allowed",
			policy: &Policy{
				ContractAllowlist: NewContractAllowlist([]common.Address{contract1}),
			},
			contract:    unknownContract,
			functionSig: transferSig,
			want:        false,
		},
		{
			name: "function allowed",
			policy: &Policy{
				FunctionAllowlist: NewFunctionAllowlist([]string{transferSig, approveSig}),
			},
			contract:    contract1,
			functionSig: transferSig,
			want:        true,
		},
		{
			name: "function not allowed",
			policy: &Policy{
				FunctionAllowlist: NewFunctionAllowlist([]string{transferSig}),
			},
			contract:    contract1,
			functionSig: unknownSig,
			want:        false,
		},
		{
			name: "both allowlists - both match",
			policy: &Policy{
				ContractAllowlist: NewContractAllowlist([]common.Address{contract1}),
				FunctionAllowlist: NewFunctionAllowlist([]string{transferSig}),
			},
			contract:    contract1,
			functionSig: transferSig,
			want:        true,
		},
		{
			name: "both allowlists - contract blocked",
			policy: &Policy{
				ContractAllowlist: NewContractAllowlist([]common.Address{contract1}),
				FunctionAllowlist: NewFunctionAllowlist([]string{transferSig}),
			},
			contract:    unknownContract,
			functionSig: transferSig,
			want:        false,
		},
		{
			name: "both allowlists - function blocked",
			policy: &Policy{
				ContractAllowlist: NewContractAllowlist([]common.Address{contract1}),
				FunctionAllowlist: NewFunctionAllowlist([]string{transferSig}),
			},
			contract:    contract1,
			functionSig: unknownSig,
			want:        false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := IsAllowed(tc.policy, tc.contract, tc.functionSig)
			assert.Equal(t, tc.want, result)
		})
	}
}
