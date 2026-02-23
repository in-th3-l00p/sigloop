package x402

import (
	"encoding/json"
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSignEIP3009Authorization(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	require.NoError(t, err)

	tokenAddr := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	from := crypto.PubkeyToAddress(privateKey.PublicKey)
	to := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	value := big.NewInt(1000000)
	validAfter := big.NewInt(0)
	validBefore := big.NewInt(9999999999)
	nonce := [32]byte{0x01, 0x02, 0x03}
	chainID := big.NewInt(8453)

	t.Run("success", func(t *testing.T) {
		sig, err := SignEIP3009Authorization(
			privateKey, tokenAddr, from, to, value,
			validAfter, validBefore, nonce, chainID,
		)
		require.NoError(t, err)
		assert.Len(t, sig, 65)
		assert.True(t, sig[64] >= 27)
	})

	t.Run("deterministic", func(t *testing.T) {
		sig1, err := SignEIP3009Authorization(
			privateKey, tokenAddr, from, to, value,
			validAfter, validBefore, nonce, chainID,
		)
		require.NoError(t, err)

		sig2, err := SignEIP3009Authorization(
			privateKey, tokenAddr, from, to, value,
			validAfter, validBefore, nonce, chainID,
		)
		require.NoError(t, err)

		assert.Equal(t, sig1, sig2)
	})

	t.Run("different values produce different signatures", func(t *testing.T) {
		sig1, err := SignEIP3009Authorization(
			privateKey, tokenAddr, from, to, value,
			validAfter, validBefore, nonce, chainID,
		)
		require.NoError(t, err)

		sig2, err := SignEIP3009Authorization(
			privateKey, tokenAddr, from, to, big.NewInt(2000000),
			validAfter, validBefore, nonce, chainID,
		)
		require.NoError(t, err)

		assert.NotEqual(t, sig1, sig2)
	})
}

func TestBuildPaymentHeader(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	require.NoError(t, err)
	from := crypto.PubkeyToAddress(privateKey.PublicKey)
	chainID := big.NewInt(8453)

	t.Run("success", func(t *testing.T) {
		req := &PaymentRequirement{
			Scheme:            "exact",
			Network:           "base",
			MaxAmountRequired: "1000000",
			PayTo:             common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
			RequiredDeadline:  "9999999999",
		}

		header, err := BuildPaymentHeader(privateKey, req, from, chainID)
		require.NoError(t, err)
		assert.NotEmpty(t, header)

		var parsed map[string]interface{}
		err = json.Unmarshal([]byte(header), &parsed)
		require.NoError(t, err)

		assert.Equal(t, float64(1), parsed["x402Version"])
		assert.Equal(t, "exact", parsed["scheme"])
		assert.Equal(t, "base", parsed["network"])

		payload, ok := parsed["payload"].(map[string]interface{})
		require.True(t, ok)
		assert.NotEmpty(t, payload["signature"])
		assert.Equal(t, from.Hex(), payload["from"])
		assert.Equal(t, "1000000", payload["value"])
		assert.Equal(t, "0", payload["validAfter"])
		assert.Equal(t, "9999999999", payload["validBefore"])
	})

	t.Run("nil requirement", func(t *testing.T) {
		_, err := BuildPaymentHeader(privateKey, nil, from, chainID)
		require.Error(t, err)
		assert.Equal(t, "nil payment requirement", err.Error())
	})

	t.Run("invalid amount", func(t *testing.T) {
		req := &PaymentRequirement{
			MaxAmountRequired: "not-a-number",
			PayTo:             common.HexToAddress("0xbbbb"),
		}
		_, err := BuildPaymentHeader(privateKey, req, from, chainID)
		require.Error(t, err)
		assert.Equal(t, "invalid amount", err.Error())
	})

	t.Run("invalid deadline defaults to zero", func(t *testing.T) {
		req := &PaymentRequirement{
			Scheme:            "exact",
			Network:           "base",
			MaxAmountRequired: "1000000",
			PayTo:             common.HexToAddress("0xbbbb"),
			RequiredDeadline:  "not-a-number",
		}
		header, err := BuildPaymentHeader(privateKey, req, from, chainID)
		require.NoError(t, err)
		assert.NotEmpty(t, header)
	})
}

func TestParsePaymentRequirements(t *testing.T) {
	t.Run("array format", func(t *testing.T) {
		data := []byte(`[{"scheme":"exact","network":"base","maxAmountRequired":"1000","payTo":"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}]`)
		reqs, err := ParsePaymentRequirements(data)
		require.NoError(t, err)
		assert.Len(t, reqs, 1)
		assert.Equal(t, "exact", reqs[0].Scheme)
		assert.Equal(t, "base", reqs[0].Network)
		assert.Equal(t, "1000", reqs[0].MaxAmountRequired)
	})

	t.Run("single object format", func(t *testing.T) {
		data := []byte(`{"scheme":"exact","network":"base","maxAmountRequired":"500"}`)
		reqs, err := ParsePaymentRequirements(data)
		require.NoError(t, err)
		assert.Len(t, reqs, 1)
		assert.Equal(t, "500", reqs[0].MaxAmountRequired)
	})

	t.Run("multiple items", func(t *testing.T) {
		data := []byte(`[{"scheme":"exact","network":"base"},{"scheme":"upto","network":"arbitrum"}]`)
		reqs, err := ParsePaymentRequirements(data)
		require.NoError(t, err)
		assert.Len(t, reqs, 2)
	})

	t.Run("invalid JSON", func(t *testing.T) {
		data := []byte(`{invalid}`)
		_, err := ParsePaymentRequirements(data)
		require.Error(t, err)
		assert.Equal(t, "invalid payment requirements format", err.Error())
	})

	t.Run("empty array", func(t *testing.T) {
		data := []byte(`[]`)
		reqs, err := ParsePaymentRequirements(data)
		require.NoError(t, err)
		assert.Empty(t, reqs)
	})
}
