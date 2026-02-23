package policy

import (
	"encoding/hex"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

func NewContractAllowlist(contracts []common.Address) *ContractAllowlist {
	al := &ContractAllowlist{
		Contracts: make(map[common.Address]bool, len(contracts)),
	}
	for _, c := range contracts {
		al.Contracts[c] = true
	}
	return al
}

func NewFunctionAllowlist(signatures []string) *FunctionAllowlist {
	al := &FunctionAllowlist{
		Functions: make(map[string]bool, len(signatures)),
	}
	for _, sig := range signatures {
		selector := crypto.Keccak256([]byte(sig))[:4]
		al.Functions[hex.EncodeToString(selector)] = true
	}
	return al
}

func IsAllowed(p *Policy, contract common.Address, functionSig string) bool {
	if p == nil {
		return false
	}

	if p.ContractAllowlist != nil {
		if !p.ContractAllowlist.Contracts[contract] {
			return false
		}
	}

	if p.FunctionAllowlist != nil {
		selector := crypto.Keccak256([]byte(functionSig))[:4]
		selectorHex := hex.EncodeToString(selector)
		if !p.FunctionAllowlist.Functions[selectorHex] {
			return false
		}
	}

	return true
}
