package agent

import (
	"crypto/ecdsa"
	"encoding/hex"
	"errors"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
)

func GenerateSessionKey(chainID *big.Int, duration time.Duration) (*SessionKey, error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	validAfter := big.NewInt(now.Unix())
	validUntil := big.NewInt(now.Add(duration).Unix())

	return &SessionKey{
		PrivateKey: privateKey,
		PublicKey:  &privateKey.PublicKey,
		Address:    crypto.PubkeyToAddress(privateKey.PublicKey),
		ValidAfter: validAfter,
		ValidUntil: validUntil,
		ChainID:    chainID,
	}, nil
}

func SerializeSessionKey(sk *SessionKey) (string, error) {
	if sk == nil || sk.PrivateKey == nil {
		return "", errors.New("nil session key")
	}

	privBytes := crypto.FromECDSA(sk.PrivateKey)
	chainBytes := sk.ChainID.Bytes()
	afterBytes := sk.ValidAfter.Bytes()
	untilBytes := sk.ValidUntil.Bytes()

	data := make([]byte, 0, 32+32+32+32)
	data = append(data, privBytes...)
	data = append(data, common_left_pad(chainBytes, 32)...)
	data = append(data, common_left_pad(afterBytes, 32)...)
	data = append(data, common_left_pad(untilBytes, 32)...)

	return hex.EncodeToString(data), nil
}

func DeserializeSessionKey(encoded string) (*SessionKey, error) {
	data, err := hex.DecodeString(encoded)
	if err != nil {
		return nil, err
	}

	if len(data) < 128 {
		return nil, errors.New("invalid session key data")
	}

	privBytes := data[:32]
	chainBytes := data[32:64]
	afterBytes := data[64:96]
	untilBytes := data[96:128]

	privateKey, err := crypto.ToECDSA(privBytes)
	if err != nil {
		return nil, err
	}

	return &SessionKey{
		PrivateKey: privateKey,
		PublicKey:  &privateKey.PublicKey,
		Address:    crypto.PubkeyToAddress(privateKey.PublicKey),
		ValidAfter: new(big.Int).SetBytes(chainBytes),
		ValidUntil: new(big.Int).SetBytes(afterBytes),
		ChainID:    new(big.Int).SetBytes(untilBytes),
	}, nil
}

func ValidateSessionKey(sk *SessionKey) error {
	if sk == nil {
		return errors.New("nil session key")
	}

	if sk.PrivateKey == nil {
		return errors.New("missing private key")
	}

	if sk.ChainID == nil || sk.ChainID.Sign() <= 0 {
		return errors.New("invalid chain ID")
	}

	now := big.NewInt(time.Now().Unix())

	if sk.ValidAfter != nil && now.Cmp(sk.ValidAfter) < 0 {
		return errors.New("session key not yet valid")
	}

	if sk.ValidUntil != nil && now.Cmp(sk.ValidUntil) > 0 {
		return errors.New("session key expired")
	}

	expectedAddr := crypto.PubkeyToAddress(sk.PrivateKey.PublicKey)
	if sk.Address != expectedAddr {
		return errors.New("address mismatch")
	}

	return nil
}

func SignWithSessionKey(sk *SessionKey, hash []byte) ([]byte, error) {
	if err := ValidateSessionKey(sk); err != nil {
		return nil, err
	}
	return crypto.Sign(hash, sk.PrivateKey)
}

func VerifySessionKeySignature(pubKey *ecdsa.PublicKey, hash []byte, sig []byte) bool {
	if len(sig) != 65 {
		return false
	}
	return crypto.VerifySignature(
		crypto.CompressPubkey(pubKey),
		hash,
		sig[:64],
	)
}

func common_left_pad(b []byte, size int) []byte {
	if len(b) >= size {
		return b[:size]
	}
	padded := make([]byte, size)
	copy(padded[size-len(b):], b)
	return padded
}
