package x402

import (
	"crypto/ecdsa"
	"math/big"
	"net/http"
)

func NewX402Client(
	privateKey *ecdsa.PrivateKey,
	chainID *big.Int,
	budget *BudgetTracker,
	policy *X402Policy,
	config X402Config,
) *http.Client {
	transport := NewX402Transport(
		http.DefaultTransport,
		privateKey,
		chainID,
		budget,
		policy,
		config,
	)

	return &http.Client{
		Transport: transport,
	}
}
