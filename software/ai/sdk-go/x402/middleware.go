package x402

import (
	"crypto/ecdsa"
	"io"
	"math/big"
	"net/http"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type X402Transport struct {
	Base       http.RoundTripper
	PrivateKey *ecdsa.PrivateKey
	From       common.Address
	ChainID    *big.Int
	Budget     *BudgetTracker
	Policy     *X402Policy
	Config     X402Config
}

func NewX402Transport(
	base http.RoundTripper,
	privateKey *ecdsa.PrivateKey,
	chainID *big.Int,
	budget *BudgetTracker,
	policy *X402Policy,
	config X402Config,
) *X402Transport {
	if base == nil {
		base = http.DefaultTransport
	}
	from := crypto.PubkeyToAddress(privateKey.PublicKey)
	return &X402Transport{
		Base:       base,
		PrivateKey: privateKey,
		From:       from,
		ChainID:    chainID,
		Budget:     budget,
		Policy:     policy,
		Config:     config,
	}
}

func (t *X402Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := t.Base.RoundTrip(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusPaymentRequired {
		return resp, nil
	}

	if !t.Config.AutoPay {
		return resp, nil
	}

	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return resp, nil
	}

	requirements, err := ParsePaymentRequirements(body)
	if err != nil {
		return resp, nil
	}

	if len(requirements) == 0 {
		return resp, nil
	}

	payReq := t.selectRequirement(requirements)
	if payReq == nil {
		return resp, nil
	}

	amount, ok := new(big.Int).SetString(payReq.MaxAmountRequired, 10)
	if !ok {
		return resp, nil
	}

	if t.Policy != nil {
		if t.Policy.MaxPerRequest != nil && amount.Cmp(t.Policy.MaxPerRequest) > 0 {
			return resp, nil
		}
		if t.Policy.AllowedPayees != nil && len(t.Policy.AllowedPayees) > 0 {
			if !t.Policy.AllowedPayees[payReq.PayTo] {
				return resp, nil
			}
		}
		if t.Policy.AllowedDomains != nil && len(t.Policy.AllowedDomains) > 0 {
			if !t.Policy.AllowedDomains[req.URL.Host] {
				return resp, nil
			}
		}
	}

	if t.Budget != nil {
		if err := t.Budget.Check(amount, payReq.PayTo); err != nil {
			return resp, nil
		}
	}

	paymentHeader, err := BuildPaymentHeader(t.PrivateKey, payReq, t.From, t.ChainID)
	if err != nil {
		return resp, nil
	}

	retryReq := req.Clone(req.Context())
	retryReq.Header.Set("X-PAYMENT", paymentHeader)

	if req.Body != nil {
		if req.GetBody != nil {
			newBody, err := req.GetBody()
			if err != nil {
				return resp, nil
			}
			retryReq.Body = newBody
		}
	}

	retryResp, err := t.Base.RoundTrip(retryReq)
	if err != nil {
		return resp, nil
	}

	if retryResp.StatusCode >= 200 && retryResp.StatusCode < 300 && t.Budget != nil {
		record := PaymentRecord{
			Resource:  req.URL.String(),
			Amount:    amount,
			PayTo:     payReq.PayTo,
			Timestamp: uint64(0),
			Network:   payReq.Network,
		}
		t.Budget.Track(record)
	}

	return retryResp, nil
}

func (t *X402Transport) selectRequirement(requirements []PaymentRequirement) *PaymentRequirement {
	if len(t.Config.AllowedSchemes) == 0 {
		return &requirements[0]
	}

	schemeSet := make(map[string]bool, len(t.Config.AllowedSchemes))
	for _, s := range t.Config.AllowedSchemes {
		schemeSet[s] = true
	}

	for i, r := range requirements {
		if schemeSet[r.Scheme] {
			return &requirements[i]
		}
	}

	return nil
}
