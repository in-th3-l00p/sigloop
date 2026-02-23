package wallet

import (
	"math/big"
	"sync"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testWalletConfig() WalletConfig {
	return WalletConfig{
		EntryPoint: common.HexToAddress("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"),
		Factory:    common.HexToAddress("0x1234567890abcdef1234567890abcdef12345678"),
		ChainID:    big.NewInt(8453),
		BundlerURL: "https://bundler.base.org",
		RPCURL:     "https://mainnet.base.org",
	}
}

func TestNewWalletService(t *testing.T) {
	cfg := testWalletConfig()
	svc := NewWalletService(cfg)

	assert.NotNil(t, svc)
	assert.NotNil(t, svc.wallets)
	assert.Equal(t, cfg, svc.config)
	assert.Empty(t, svc.wallets)
}

func TestCreateWallet(t *testing.T) {
	cfg := testWalletConfig()
	svc := NewWalletService(cfg)
	owner := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	guardian := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")

	tests := []struct {
		name      string
		params    CreateWalletParams
		checkSalt *big.Int
	}{
		{
			name: "with explicit salt",
			params: CreateWalletParams{
				Owner:     owner,
				Salt:      big.NewInt(42),
				Guardians: []common.Address{guardian},
				Config:    cfg,
			},
			checkSalt: big.NewInt(42),
		},
		{
			name: "nil salt defaults to zero",
			params: CreateWalletParams{
				Owner:     owner,
				Salt:      nil,
				Guardians: []common.Address{guardian},
				Config:    cfg,
			},
			checkSalt: big.NewInt(0),
		},
		{
			name: "no guardians",
			params: CreateWalletParams{
				Owner:     owner,
				Salt:      big.NewInt(1),
				Guardians: nil,
				Config:    cfg,
			},
			checkSalt: big.NewInt(1),
		},
		{
			name: "multiple guardians",
			params: CreateWalletParams{
				Owner: owner,
				Salt:  big.NewInt(99),
				Guardians: []common.Address{
					common.HexToAddress("0x1111111111111111111111111111111111111111"),
					common.HexToAddress("0x2222222222222222222222222222222222222222"),
					common.HexToAddress("0x3333333333333333333333333333333333333333"),
				},
				Config: cfg,
			},
			checkSalt: big.NewInt(99),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w, err := svc.CreateWallet(tc.params)
			require.NoError(t, err)
			require.NotNil(t, w)

			assert.Equal(t, tc.params.Owner, w.Owner)
			assert.Equal(t, tc.checkSalt, w.Salt)
			assert.Equal(t, cfg.EntryPoint, w.EntryPoint)
			assert.Equal(t, cfg.Factory, w.Factory)
			assert.False(t, w.IsDeployed)
			assert.Equal(t, uint64(0), w.Nonce)
			assert.Len(t, w.Guardians, len(tc.params.Guardians))

			for i, g := range w.Guardians {
				assert.Equal(t, tc.params.Guardians[i], g.Address)
				assert.Equal(t, uint64(0), g.AddedAt)
				assert.Equal(t, uint8(1), g.Threshold)
			}

			expectedAddr := computeCounterfactualAddress(tc.params.Owner, cfg.Factory, tc.checkSalt)
			assert.Equal(t, expectedAddr, w.Address)

			stored, ok := svc.GetWallet(w.Address)
			assert.True(t, ok)
			assert.Equal(t, w, stored)
		})
	}
}

func TestGetWallet(t *testing.T) {
	cfg := testWalletConfig()
	svc := NewWalletService(cfg)
	owner := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	t.Run("existing wallet", func(t *testing.T) {
		w, err := svc.CreateWallet(CreateWalletParams{
			Owner:  owner,
			Salt:   big.NewInt(100),
			Config: cfg,
		})
		require.NoError(t, err)

		found, ok := svc.GetWallet(w.Address)
		assert.True(t, ok)
		assert.Equal(t, w, found)
	})

	t.Run("non-existent wallet", func(t *testing.T) {
		_, ok := svc.GetWallet(common.HexToAddress("0xdead"))
		assert.False(t, ok)
	})
}

func TestListWallets(t *testing.T) {
	cfg := testWalletConfig()

	t.Run("empty service", func(t *testing.T) {
		svc := NewWalletService(cfg)
		result := svc.ListWallets()
		assert.Empty(t, result)
	})

	t.Run("multiple wallets", func(t *testing.T) {
		svc := NewWalletService(cfg)
		owner := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

		for i := 0; i < 5; i++ {
			_, err := svc.CreateWallet(CreateWalletParams{
				Owner:  owner,
				Salt:   big.NewInt(int64(i)),
				Config: cfg,
			})
			require.NoError(t, err)
		}

		result := svc.ListWallets()
		assert.Len(t, result, 5)
	})
}

func TestComputeCounterfactualAddress(t *testing.T) {
	owner := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	factory := common.HexToAddress("0x1234567890abcdef1234567890abcdef12345678")

	t.Run("deterministic", func(t *testing.T) {
		addr1 := computeCounterfactualAddress(owner, factory, big.NewInt(0))
		addr2 := computeCounterfactualAddress(owner, factory, big.NewInt(0))
		assert.Equal(t, addr1, addr2)
	})

	t.Run("different salts produce different addresses", func(t *testing.T) {
		addr1 := computeCounterfactualAddress(owner, factory, big.NewInt(0))
		addr2 := computeCounterfactualAddress(owner, factory, big.NewInt(1))
		assert.NotEqual(t, addr1, addr2)
	})

	t.Run("different owners produce different addresses", func(t *testing.T) {
		owner2 := common.HexToAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
		addr1 := computeCounterfactualAddress(owner, factory, big.NewInt(0))
		addr2 := computeCounterfactualAddress(owner2, factory, big.NewInt(0))
		assert.NotEqual(t, addr1, addr2)
	})

	t.Run("different factories produce different addresses", func(t *testing.T) {
		factory2 := common.HexToAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
		addr1 := computeCounterfactualAddress(owner, factory, big.NewInt(0))
		addr2 := computeCounterfactualAddress(owner, factory2, big.NewInt(0))
		assert.NotEqual(t, addr1, addr2)
	})
}

func TestAddressFromPrivateKey(t *testing.T) {
	key, err := crypto.GenerateKey()
	require.NoError(t, err)

	addr := AddressFromPrivateKey(key)
	expected := crypto.PubkeyToAddress(key.PublicKey)
	assert.Equal(t, expected, addr)
}

func TestWalletServiceConcurrency(t *testing.T) {
	cfg := testWalletConfig()
	svc := NewWalletService(cfg)
	owner := common.HexToAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(salt int64) {
			defer wg.Done()
			_, _ = svc.CreateWallet(CreateWalletParams{
				Owner:  owner,
				Salt:   big.NewInt(salt),
				Config: cfg,
			})
		}(int64(i))
	}

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = svc.ListWallets()
		}()
	}

	wg.Wait()
	assert.Len(t, svc.ListWallets(), 50)
}
