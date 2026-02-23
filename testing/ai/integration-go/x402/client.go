package x402

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type X402Transport struct {
	Base    http.RoundTripper
	Key     *ecdsa.PrivateKey
	Address common.Address
}

func NewX402Client(key *ecdsa.PrivateKey) *http.Client {
	addr := crypto.PubkeyToAddress(key.PublicKey)
	return &http.Client{
		Transport: &X402Transport{
			Base:    http.DefaultTransport,
			Key:     key,
			Address: addr,
		},
	}
}

func (t *X402Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	var bodyBytes []byte
	if req.Body != nil {
		bodyBytes, _ = io.ReadAll(req.Body)
		req.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	}

	resp, err := t.Base.RoundTrip(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusPaymentRequired {
		return resp, nil
	}

	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var requirementResp struct {
		Accepts []PaymentRequirement `json:"accepts"`
	}
	err = json.Unmarshal(respBody, &requirementResp)
	if err != nil {
		return nil, err
	}

	if len(requirementResp.Accepts) == 0 {
		return nil, fmt.Errorf("no payment requirements")
	}

	requirement := requirementResp.Accepts[0]

	paymentMsg := fmt.Sprintf("x402 payment: %s %s", requirement.MaxAmount, requirement.Resource)
	hash := crypto.Keccak256Hash([]byte(paymentMsg))
	sig, err := crypto.Sign(hash.Bytes(), t.Key)
	if err != nil {
		return nil, err
	}

	payment := PaymentHeader{
		Signature: fmt.Sprintf("0x%x", sig),
		Sender:    t.Address.Hex(),
		Amount:    requirement.MaxAmount,
		Resource:  requirement.Resource,
	}

	paymentJSON, err := json.Marshal(payment)
	if err != nil {
		return nil, err
	}

	retryReq, err := http.NewRequestWithContext(req.Context(), req.Method, req.URL.String(), bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}

	for k, v := range req.Header {
		retryReq.Header[k] = v
	}
	retryReq.Header.Set("X-PAYMENT", string(paymentJSON))

	return t.Base.RoundTrip(retryReq)
}
