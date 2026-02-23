package encoding

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testUserOp() *UserOperation {
	return &UserOperation{
		Sender:               common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
		Nonce:                big.NewInt(0),
		InitCode:             []byte{},
		CallData:             []byte{0x01, 0x02, 0x03},
		CallGasLimit:         big.NewInt(100000),
		VerificationGasLimit: big.NewInt(200000),
		PreVerificationGas:   big.NewInt(50000),
		MaxFeePerGas:         big.NewInt(1000000000),
		MaxPriorityFeePerGas: big.NewInt(100000000),
		PaymasterAndData:     []byte{},
		Signature:            []byte{},
	}
}

func TestPackUserOp(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		op := testUserOp()
		data, err := PackUserOp(op)
		require.NoError(t, err)
		assert.NotEmpty(t, data)
	})

	t.Run("deterministic", func(t *testing.T) {
		op := testUserOp()
		data1, err := PackUserOp(op)
		require.NoError(t, err)
		data2, err := PackUserOp(op)
		require.NoError(t, err)
		assert.Equal(t, data1, data2)
	})

	t.Run("different calldata produces different packing", func(t *testing.T) {
		op1 := testUserOp()
		op2 := testUserOp()
		op2.CallData = []byte{0x04, 0x05, 0x06}

		data1, err := PackUserOp(op1)
		require.NoError(t, err)
		data2, err := PackUserOp(op2)
		require.NoError(t, err)
		assert.NotEqual(t, data1, data2)
	})

	t.Run("with init code", func(t *testing.T) {
		op := testUserOp()
		op.InitCode = []byte{0xaa, 0xbb, 0xcc}
		data, err := PackUserOp(op)
		require.NoError(t, err)
		assert.NotEmpty(t, data)
	})

	t.Run("with paymaster data", func(t *testing.T) {
		op := testUserOp()
		op.PaymasterAndData = []byte{0x11, 0x22, 0x33}
		data, err := PackUserOp(op)
		require.NoError(t, err)
		assert.NotEmpty(t, data)
	})
}

func TestHashUserOp(t *testing.T) {
	entryPoint := common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
	chainID := big.NewInt(8453)

	t.Run("success", func(t *testing.T) {
		op := testUserOp()
		hash, err := HashUserOp(op, entryPoint, chainID)
		require.NoError(t, err)
		assert.NotEqual(t, common.Hash{}, hash)
	})

	t.Run("deterministic", func(t *testing.T) {
		op := testUserOp()
		hash1, err := HashUserOp(op, entryPoint, chainID)
		require.NoError(t, err)
		hash2, err := HashUserOp(op, entryPoint, chainID)
		require.NoError(t, err)
		assert.Equal(t, hash1, hash2)
	})

	t.Run("different chain ID produces different hash", func(t *testing.T) {
		op := testUserOp()
		hash1, err := HashUserOp(op, entryPoint, big.NewInt(1))
		require.NoError(t, err)
		hash2, err := HashUserOp(op, entryPoint, big.NewInt(8453))
		require.NoError(t, err)
		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("different entry point produces different hash", func(t *testing.T) {
		op := testUserOp()
		ep1 := common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789")
		ep2 := common.HexToAddress("0x1111111111111111111111111111111111111111")
		hash1, err := HashUserOp(op, ep1, chainID)
		require.NoError(t, err)
		hash2, err := HashUserOp(op, ep2, chainID)
		require.NoError(t, err)
		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("different nonce produces different hash", func(t *testing.T) {
		op1 := testUserOp()
		op2 := testUserOp()
		op2.Nonce = big.NewInt(1)
		hash1, err := HashUserOp(op1, entryPoint, chainID)
		require.NoError(t, err)
		hash2, err := HashUserOp(op2, entryPoint, chainID)
		require.NoError(t, err)
		assert.NotEqual(t, hash1, hash2)
	})
}

func TestEncodeCallData(t *testing.T) {
	target := common.HexToAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
	value := big.NewInt(0)
	data := []byte{0x01, 0x02, 0x03}

	t.Run("success", func(t *testing.T) {
		result, err := EncodeCallData(target, value, data)
		require.NoError(t, err)
		assert.NotEmpty(t, result)
		assert.True(t, len(result) > 4)
	})

	t.Run("deterministic", func(t *testing.T) {
		result1, err := EncodeCallData(target, value, data)
		require.NoError(t, err)
		result2, err := EncodeCallData(target, value, data)
		require.NoError(t, err)
		assert.Equal(t, result1, result2)
	})

	t.Run("empty data", func(t *testing.T) {
		result, err := EncodeCallData(target, value, []byte{})
		require.NoError(t, err)
		assert.NotEmpty(t, result)
	})

	t.Run("with value", func(t *testing.T) {
		result, err := EncodeCallData(target, big.NewInt(1000), data)
		require.NoError(t, err)
		assert.NotEmpty(t, result)
	})

	t.Run("different targets produce different results", func(t *testing.T) {
		target2 := common.HexToAddress("0x1111111111111111111111111111111111111111")
		result1, err := EncodeCallData(target, value, data)
		require.NoError(t, err)
		result2, err := EncodeCallData(target2, value, data)
		require.NoError(t, err)
		assert.NotEqual(t, result1, result2)
	})
}
