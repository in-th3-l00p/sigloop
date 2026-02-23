package helpers

import (
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sigloop/integration-go/config"
)

func NewAnvilClient() (*ethclient.Client, error) {
	return ethclient.Dial(config.AnvilRPC)
}
