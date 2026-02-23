package helpers

import (
	"crypto/ecdsa"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/sigloop/integration-go/config"
)

type Account struct {
	Key     *ecdsa.PrivateKey
	Address common.Address
}

func GetAccount(index int) Account {
	key, _ := crypto.HexToECDSA(config.AnvilPrivateKeys[index])
	addr := crypto.PubkeyToAddress(key.PublicKey)
	return Account{Key: key, Address: addr}
}
