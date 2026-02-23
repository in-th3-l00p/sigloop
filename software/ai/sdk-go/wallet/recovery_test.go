package wallet

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupWalletWithGuardians(t *testing.T, guardians []common.Address) (*WalletService, *Wallet) {
	t.Helper()
	cfg := WalletConfig{
		EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
		Factory:    common.HexToAddress("0x1234567890abcdef1234567890abcdef12345678"),
		ChainID:    big.NewInt(8453),
	}
	svc := NewWalletService(cfg)
	w, err := svc.CreateWallet(CreateWalletParams{
		Owner:     common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
		Salt:      big.NewInt(0),
		Guardians: guardians,
		Config:    cfg,
	})
	require.NoError(t, err)
	return svc, w
}

func TestNewRecoveryService(t *testing.T) {
	rs := NewRecoveryService()
	assert.NotNil(t, rs)
	assert.NotNil(t, rs.requests)
	assert.Empty(t, rs.requests)
}

func TestAddGuardian(t *testing.T) {
	guardian1 := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	guardian2 := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	tests := []struct {
		name      string
		setup     func() (*WalletService, common.Address)
		guardian  common.Address
		threshold uint8
		wantErr   string
	}{
		{
			name: "add guardian successfully",
			setup: func() (*WalletService, common.Address) {
				svc, w := setupWalletWithGuardians(t, nil)
				return svc, w.Address
			},
			guardian:  guardian1,
			threshold: 2,
		},
		{
			name: "wallet not found",
			setup: func() (*WalletService, common.Address) {
				svc, _ := setupWalletWithGuardians(t, nil)
				return svc, common.HexToAddress("0xdead")
			},
			guardian:  guardian1,
			threshold: 1,
			wantErr:   "wallet not found",
		},
		{
			name: "duplicate guardian",
			setup: func() (*WalletService, common.Address) {
				svc, w := setupWalletWithGuardians(t, []common.Address{guardian1})
				return svc, w.Address
			},
			guardian:  guardian1,
			threshold: 1,
			wantErr:   "guardian already exists",
		},
		{
			name: "add second guardian",
			setup: func() (*WalletService, common.Address) {
				svc, w := setupWalletWithGuardians(t, []common.Address{guardian1})
				return svc, w.Address
			},
			guardian:  guardian2,
			threshold: 2,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			svc, addr := tc.setup()
			err := svc.AddGuardian(addr, tc.guardian, tc.threshold)
			if tc.wantErr != "" {
				require.Error(t, err)
				assert.Equal(t, tc.wantErr, err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestRemoveGuardian(t *testing.T) {
	guardian1 := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	guardian2 := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	tests := []struct {
		name     string
		setup    func() (*WalletService, common.Address)
		guardian common.Address
		wantErr  string
	}{
		{
			name: "remove existing guardian",
			setup: func() (*WalletService, common.Address) {
				svc, w := setupWalletWithGuardians(t, []common.Address{guardian1, guardian2})
				return svc, w.Address
			},
			guardian: guardian1,
		},
		{
			name: "wallet not found",
			setup: func() (*WalletService, common.Address) {
				svc, _ := setupWalletWithGuardians(t, nil)
				return svc, common.HexToAddress("0xdead")
			},
			guardian: guardian1,
			wantErr:  "wallet not found",
		},
		{
			name: "guardian not found",
			setup: func() (*WalletService, common.Address) {
				svc, w := setupWalletWithGuardians(t, []common.Address{guardian1})
				return svc, w.Address
			},
			guardian: guardian2,
			wantErr:  "guardian not found",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			svc, addr := tc.setup()
			err := svc.RemoveGuardian(addr, tc.guardian)
			if tc.wantErr != "" {
				require.Error(t, err)
				assert.Equal(t, tc.wantErr, err.Error())
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestRemoveGuardianVerifyRemoval(t *testing.T) {
	guardian1 := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	guardian2 := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	svc, w := setupWalletWithGuardians(t, []common.Address{guardian1, guardian2})
	assert.Len(t, w.Guardians, 2)

	err := svc.RemoveGuardian(w.Address, guardian1)
	require.NoError(t, err)

	updated, ok := svc.GetWallet(w.Address)
	require.True(t, ok)
	assert.Len(t, updated.Guardians, 1)
	assert.Equal(t, guardian2, updated.Guardians[0].Address)
}

func TestInitiateRecovery(t *testing.T) {
	guardian := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
	newOwner := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	t.Run("success", func(t *testing.T) {
		_, w := setupWalletWithGuardians(t, []common.Address{guardian})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)
		require.NotNil(t, req)

		assert.Equal(t, w.Address, req.WalletAddress)
		assert.Equal(t, newOwner, req.NewOwner)
		assert.False(t, req.Executed)
		assert.NotNil(t, req.Approvals)
		assert.Equal(t, w.Guardians[0].Threshold, req.Threshold)
	})

	t.Run("no guardians", func(t *testing.T) {
		_, w := setupWalletWithGuardians(t, nil)
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.Error(t, err)
		assert.Nil(t, req)
		assert.Equal(t, "no guardians configured", err.Error())
	})
}

func TestApproveRecovery(t *testing.T) {
	guardianKey, err := crypto.GenerateKey()
	require.NoError(t, err)
	guardianAddr := crypto.PubkeyToAddress(guardianKey.PublicKey)

	newOwner := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	t.Run("success", func(t *testing.T) {
		_, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		recoveryHash := crypto.Keccak256(
			w.Address.Bytes(),
			req.NewOwner.Bytes(),
		)
		sig, err := crypto.Sign(recoveryHash, guardianKey)
		require.NoError(t, err)

		err = rs.ApproveRecovery(w.Address, guardianAddr, sig)
		require.NoError(t, err)

		assert.Len(t, req.Approvals, 1)
		assert.Equal(t, sig, req.Approvals[guardianAddr])
	})

	t.Run("no recovery request", func(t *testing.T) {
		rs := NewRecoveryService()
		err := rs.ApproveRecovery(common.HexToAddress("0xdead"), guardianAddr, []byte{})
		require.Error(t, err)
		assert.Equal(t, "no recovery request found", err.Error())
	})

	t.Run("already executed", func(t *testing.T) {
		_, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)
		req.Executed = true

		err = rs.ApproveRecovery(w.Address, guardianAddr, []byte{})
		require.Error(t, err)
		assert.Equal(t, "recovery already executed", err.Error())
	})

	t.Run("invalid signature", func(t *testing.T) {
		_, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		_, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		err = rs.ApproveRecovery(w.Address, guardianAddr, []byte{0x01, 0x02, 0x03})
		require.Error(t, err)
		assert.Equal(t, "invalid signature", err.Error())
	})

	t.Run("signature mismatch", func(t *testing.T) {
		otherKey, err := crypto.GenerateKey()
		require.NoError(t, err)

		_, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		recoveryHash := crypto.Keccak256(
			w.Address.Bytes(),
			req.NewOwner.Bytes(),
		)
		sig, err := crypto.Sign(recoveryHash, otherKey)
		require.NoError(t, err)

		err = rs.ApproveRecovery(w.Address, guardianAddr, sig)
		require.Error(t, err)
		assert.Equal(t, "signature does not match guardian", err.Error())
	})
}

func TestExecuteRecovery(t *testing.T) {
	guardianKey, err := crypto.GenerateKey()
	require.NoError(t, err)
	guardianAddr := crypto.PubkeyToAddress(guardianKey.PublicKey)
	newOwner := common.HexToAddress("0xcccccccccccccccccccccccccccccccccccccccc")

	t.Run("success", func(t *testing.T) {
		svc, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		recoveryHash := crypto.Keccak256(
			w.Address.Bytes(),
			req.NewOwner.Bytes(),
		)
		sig, err := crypto.Sign(recoveryHash, guardianKey)
		require.NoError(t, err)

		err = rs.ApproveRecovery(w.Address, guardianAddr, sig)
		require.NoError(t, err)

		err = rs.ExecuteRecovery(w.Address, svc)
		require.NoError(t, err)

		updated, ok := svc.GetWallet(w.Address)
		require.True(t, ok)
		assert.Equal(t, newOwner, updated.Owner)
	})

	t.Run("no recovery request", func(t *testing.T) {
		svc, _ := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		err := rs.ExecuteRecovery(common.HexToAddress("0xdead"), svc)
		require.Error(t, err)
		assert.Equal(t, "no recovery request found", err.Error())
	})

	t.Run("already executed", func(t *testing.T) {
		svc, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)
		req.Executed = true

		err = rs.ExecuteRecovery(w.Address, svc)
		require.Error(t, err)
		assert.Equal(t, "recovery already executed", err.Error())
	})

	t.Run("insufficient approvals", func(t *testing.T) {
		svc, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		_, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		err = rs.ExecuteRecovery(w.Address, svc)
		require.Error(t, err)
		assert.Equal(t, "insufficient approvals", err.Error())
	})

	t.Run("wallet not found during execution", func(t *testing.T) {
		svc, w := setupWalletWithGuardians(t, []common.Address{guardianAddr})
		rs := NewRecoveryService()

		req, err := rs.InitiateRecovery(w, newOwner)
		require.NoError(t, err)

		recoveryHash := crypto.Keccak256(
			w.Address.Bytes(),
			req.NewOwner.Bytes(),
		)
		sig, err := crypto.Sign(recoveryHash, guardianKey)
		require.NoError(t, err)

		err = rs.ApproveRecovery(w.Address, guardianAddr, sig)
		require.NoError(t, err)

		emptySvc := NewWalletService(svc.config)
		err = rs.ExecuteRecovery(w.Address, emptySvc)
		require.Error(t, err)
		assert.Equal(t, "wallet not found", err.Error())
	})
}
