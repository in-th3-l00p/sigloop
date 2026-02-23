package defi

import (
	"github.com/sigloop/sdk-go/chain"
)

type DeFiService struct {
	chainService *chain.ChainService
}

func NewDeFiService(chainService *chain.ChainService) *DeFiService {
	return &DeFiService{
		chainService: chainService,
	}
}
