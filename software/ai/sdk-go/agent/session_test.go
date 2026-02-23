package agent

import (
	"math/big"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateSessionKey(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
		require.NoError(t, err)
		require.NotNil(t, sk)

		assert.NotNil(t, sk.PrivateKey)
		assert.NotNil(t, sk.PublicKey)
		assert.Equal(t, crypto.PubkeyToAddress(sk.PrivateKey.PublicKey), sk.Address)
		assert.NotNil(t, sk.ValidAfter)
		assert.NotNil(t, sk.ValidUntil)
		assert.Equal(t, big.NewInt(8453), sk.ChainID)
		assert.True(t, sk.ValidUntil.Cmp(sk.ValidAfter) > 0)
	})

	t.Run("different keys each time", func(t *testing.T) {
		sk1, err := GenerateSessionKey(big.NewInt(1), time.Hour)
		require.NoError(t, err)
		sk2, err := GenerateSessionKey(big.NewInt(1), time.Hour)
		require.NoError(t, err)

		assert.NotEqual(t, sk1.Address, sk2.Address)
	})
}

func TestSerializeSessionKey(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
		require.NoError(t, err)

		encoded, err := SerializeSessionKey(sk)
		require.NoError(t, err)
		assert.NotEmpty(t, encoded)
		assert.Len(t, encoded, 256)
	})

	t.Run("nil session key", func(t *testing.T) {
		_, err := SerializeSessionKey(nil)
		require.Error(t, err)
		assert.Equal(t, "nil session key", err.Error())
	})

	t.Run("nil private key", func(t *testing.T) {
		sk := &SessionKey{PrivateKey: nil}
		_, err := SerializeSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "nil session key", err.Error())
	})
}

func TestDeserializeSessionKey(t *testing.T) {
	t.Run("roundtrip", func(t *testing.T) {
		sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
		require.NoError(t, err)

		encoded, err := SerializeSessionKey(sk)
		require.NoError(t, err)

		decoded, err := DeserializeSessionKey(encoded)
		require.NoError(t, err)
		require.NotNil(t, decoded)

		assert.Equal(t, sk.Address, decoded.Address)
		assert.Equal(t, sk.PrivateKey.D.Bytes(), decoded.PrivateKey.D.Bytes())
	})

	t.Run("invalid hex", func(t *testing.T) {
		_, err := DeserializeSessionKey("not-valid-hex!")
		require.Error(t, err)
	})

	t.Run("too short data", func(t *testing.T) {
		_, err := DeserializeSessionKey("aabbccdd")
		require.Error(t, err)
		assert.Equal(t, "invalid session key data", err.Error())
	})
}

func TestValidateSessionKey(t *testing.T) {
	t.Run("valid key", func(t *testing.T) {
		sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
		require.NoError(t, err)

		err = ValidateSessionKey(sk)
		require.NoError(t, err)
	})

	t.Run("nil session key", func(t *testing.T) {
		err := ValidateSessionKey(nil)
		require.Error(t, err)
		assert.Equal(t, "nil session key", err.Error())
	})

	t.Run("nil private key", func(t *testing.T) {
		sk := &SessionKey{ChainID: big.NewInt(1)}
		err := ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "missing private key", err.Error())
	})

	t.Run("nil chain ID", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		sk := &SessionKey{
			PrivateKey: key,
			ChainID:    nil,
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "invalid chain ID", err.Error())
	})

	t.Run("zero chain ID", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		sk := &SessionKey{
			PrivateKey: key,
			ChainID:    big.NewInt(0),
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "invalid chain ID", err.Error())
	})

	t.Run("negative chain ID", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		sk := &SessionKey{
			PrivateKey: key,
			ChainID:    big.NewInt(-1),
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "invalid chain ID", err.Error())
	})

	t.Run("expired key", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		sk := &SessionKey{
			PrivateKey: key,
			PublicKey:  &key.PublicKey,
			Address:    crypto.PubkeyToAddress(key.PublicKey),
			ChainID:    big.NewInt(1),
			ValidAfter: big.NewInt(0),
			ValidUntil: big.NewInt(1),
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "session key expired", err.Error())
	})

	t.Run("not yet valid", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		future := big.NewInt(time.Now().Add(time.Hour).Unix())
		sk := &SessionKey{
			PrivateKey: key,
			PublicKey:  &key.PublicKey,
			Address:    crypto.PubkeyToAddress(key.PublicKey),
			ChainID:    big.NewInt(1),
			ValidAfter: future,
			ValidUntil: new(big.Int).Add(future, big.NewInt(3600)),
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "session key not yet valid", err.Error())
	})

	t.Run("address mismatch", func(t *testing.T) {
		key, err := crypto.GenerateKey()
		require.NoError(t, err)
		sk := &SessionKey{
			PrivateKey: key,
			PublicKey:  &key.PublicKey,
			Address:    [20]byte{0xde, 0xad},
			ChainID:    big.NewInt(1),
			ValidAfter: big.NewInt(0),
			ValidUntil: big.NewInt(time.Now().Add(time.Hour).Unix()),
		}
		err = ValidateSessionKey(sk)
		require.Error(t, err)
		assert.Equal(t, "address mismatch", err.Error())
	})
}

func TestSignWithSessionKey(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
		require.NoError(t, err)

		hash := crypto.Keccak256([]byte("test message"))
		sig, err := SignWithSessionKey(sk, hash)
		require.NoError(t, err)
		assert.Len(t, sig, 65)
	})

	t.Run("invalid session key", func(t *testing.T) {
		_, err := SignWithSessionKey(nil, []byte{})
		require.Error(t, err)
	})
}

func TestVerifySessionKeySignature(t *testing.T) {
	sk, err := GenerateSessionKey(big.NewInt(8453), time.Hour)
	require.NoError(t, err)

	hash := crypto.Keccak256([]byte("test data"))
	sig, err := SignWithSessionKey(sk, hash)
	require.NoError(t, err)

	t.Run("valid signature", func(t *testing.T) {
		valid := VerifySessionKeySignature(sk.PublicKey, hash, sig)
		assert.True(t, valid)
	})

	t.Run("wrong hash", func(t *testing.T) {
		wrongHash := crypto.Keccak256([]byte("different data"))
		valid := VerifySessionKeySignature(sk.PublicKey, wrongHash, sig)
		assert.False(t, valid)
	})

	t.Run("wrong key", func(t *testing.T) {
		otherKey, err := crypto.GenerateKey()
		require.NoError(t, err)
		valid := VerifySessionKeySignature(&otherKey.PublicKey, hash, sig)
		assert.False(t, valid)
	})

	t.Run("invalid signature length", func(t *testing.T) {
		valid := VerifySessionKeySignature(sk.PublicKey, hash, []byte{0x01, 0x02})
		assert.False(t, valid)
	})
}

func TestCommonLeftPad(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		size     int
		expected []byte
	}{
		{
			name:     "shorter than size",
			input:    []byte{0x01, 0x02},
			size:     4,
			expected: []byte{0x00, 0x00, 0x01, 0x02},
		},
		{
			name:     "exact size",
			input:    []byte{0x01, 0x02, 0x03, 0x04},
			size:     4,
			expected: []byte{0x01, 0x02, 0x03, 0x04},
		},
		{
			name:     "longer than size",
			input:    []byte{0x01, 0x02, 0x03, 0x04, 0x05},
			size:     4,
			expected: []byte{0x01, 0x02, 0x03, 0x04},
		},
		{
			name:     "empty input",
			input:    []byte{},
			size:     4,
			expected: []byte{0x00, 0x00, 0x00, 0x00},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := common_left_pad(tc.input, tc.size)
			assert.Equal(t, tc.expected, result)
		})
	}
}
