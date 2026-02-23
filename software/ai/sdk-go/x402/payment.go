package x402

import (
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
	"github.com/ethereum/go-ethereum/crypto"
)

func SignEIP3009Authorization(
	privateKey *ecdsa.PrivateKey,
	tokenAddress common.Address,
	from common.Address,
	to common.Address,
	value *big.Int,
	validAfter *big.Int,
	validBefore *big.Int,
	nonce [32]byte,
	chainID *big.Int,
) ([]byte, error) {
	domainSeparator := buildDomainSeparator(tokenAddress, chainID)

	transferTypeHash := crypto.Keccak256([]byte(
		"TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
	))

	structHash := crypto.Keccak256(
		transferTypeHash,
		common.LeftPadBytes(from.Bytes(), 32),
		common.LeftPadBytes(to.Bytes(), 32),
		math.U256Bytes(value),
		math.U256Bytes(validAfter),
		math.U256Bytes(validBefore),
		nonce[:],
	)

	digestInput := make([]byte, 0, 66)
	digestInput = append(digestInput, 0x19, 0x01)
	digestInput = append(digestInput, domainSeparator...)
	digestInput = append(digestInput, structHash...)
	digest := crypto.Keccak256(digestInput)

	sig, err := crypto.Sign(digest, privateKey)
	if err != nil {
		return nil, err
	}

	if sig[64] < 27 {
		sig[64] += 27
	}

	return sig, nil
}

func buildDomainSeparator(tokenAddress common.Address, chainID *big.Int) []byte {
	domainTypeHash := crypto.Keccak256([]byte(
		"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
	))

	nameHash := crypto.Keccak256([]byte("USD Coin"))
	versionHash := crypto.Keccak256([]byte("2"))

	return crypto.Keccak256(
		domainTypeHash,
		nameHash,
		versionHash,
		math.U256Bytes(chainID),
		common.LeftPadBytes(tokenAddress.Bytes(), 32),
	)
}

func BuildPaymentHeader(
	privateKey *ecdsa.PrivateKey,
	req *PaymentRequirement,
	from common.Address,
	chainID *big.Int,
) (string, error) {
	if req == nil {
		return "", errors.New("nil payment requirement")
	}

	amount, ok := new(big.Int).SetString(req.MaxAmountRequired, 10)
	if !ok {
		return "", errors.New("invalid amount")
	}

	deadline, ok := new(big.Int).SetString(req.RequiredDeadline, 10)
	if !ok {
		deadline = big.NewInt(0)
	}

	var nonce [32]byte
	nonceHash := crypto.Keccak256(
		from.Bytes(),
		req.PayTo.Bytes(),
		math.U256Bytes(amount),
	)
	copy(nonce[:], nonceHash[:32])

	tokenAddress := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")

	sig, err := SignEIP3009Authorization(
		privateKey,
		tokenAddress,
		from,
		req.PayTo,
		amount,
		big.NewInt(0),
		deadline,
		nonce,
		chainID,
	)
	if err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"x402Version": 1,
		"scheme":      req.Scheme,
		"network":     req.Network,
		"payload": map[string]interface{}{
			"signature":   common.Bytes2Hex(sig),
			"from":        from.Hex(),
			"to":          req.PayTo.Hex(),
			"value":       req.MaxAmountRequired,
			"validAfter":  "0",
			"validBefore": req.RequiredDeadline,
			"nonce":       common.Bytes2Hex(nonce[:]),
		},
	}

	headerBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	return string(headerBytes), nil
}

func ParsePaymentRequirements(data []byte) ([]PaymentRequirement, error) {
	var requirements []PaymentRequirement
	if err := json.Unmarshal(data, &requirements); err != nil {
		var single PaymentRequirement
		if err2 := json.Unmarshal(data, &single); err2 != nil {
			return nil, errors.New("invalid payment requirements format")
		}
		return []PaymentRequirement{single}, nil
	}
	return requirements, nil
}
