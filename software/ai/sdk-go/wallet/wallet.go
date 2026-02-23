package wallet

import (
	"crypto/ecdsa"
	"math/big"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type WalletService struct {
	config  WalletConfig
	wallets map[common.Address]*Wallet
	mu      sync.RWMutex
}

func NewWalletService(config WalletConfig) *WalletService {
	return &WalletService{
		config:  config,
		wallets: make(map[common.Address]*Wallet),
	}
}

func (s *WalletService) CreateWallet(params CreateWalletParams) (*Wallet, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	salt := params.Salt
	if salt == nil {
		salt = big.NewInt(0)
	}

	address := computeCounterfactualAddress(params.Owner, params.Config.Factory, salt)

	guardians := make([]Guardian, len(params.Guardians))
	for i, g := range params.Guardians {
		guardians[i] = Guardian{
			Address:   g,
			AddedAt:   0,
			Threshold: 1,
		}
	}

	w := &Wallet{
		Address:    address,
		Owner:      params.Owner,
		EntryPoint: params.Config.EntryPoint,
		Factory:    params.Config.Factory,
		Salt:       salt,
		ChainID:    params.Config.ChainID,
		Guardians:  guardians,
		IsDeployed: false,
		Nonce:      0,
	}

	s.wallets[address] = w
	return w, nil
}

func (s *WalletService) GetWallet(address common.Address) (*Wallet, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	w, ok := s.wallets[address]
	return w, ok
}

func (s *WalletService) ListWallets() []*Wallet {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]*Wallet, 0, len(s.wallets))
	for _, w := range s.wallets {
		result = append(result, w)
	}
	return result
}

func computeCounterfactualAddress(owner common.Address, factory common.Address, salt *big.Int) common.Address {
	initCodeHash := crypto.Keccak256(owner.Bytes())
	data := make([]byte, 0, 85)
	data = append(data, 0xff)
	data = append(data, factory.Bytes()...)
	data = append(data, common.LeftPadBytes(salt.Bytes(), 32)...)
	data = append(data, initCodeHash...)
	hash := crypto.Keccak256(data)
	return common.BytesToAddress(hash[12:])
}

func AddressFromPrivateKey(key *ecdsa.PrivateKey) common.Address {
	return crypto.PubkeyToAddress(key.PublicKey)
}
