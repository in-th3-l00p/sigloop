package wallet

import (
	"errors"
	"sync"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type RecoveryRequest struct {
	WalletAddress common.Address
	NewOwner      common.Address
	Approvals     map[common.Address][]byte
	Threshold     uint8
	Executed      bool
}

type RecoveryService struct {
	requests map[common.Address]*RecoveryRequest
	mu       sync.Mutex
}

func NewRecoveryService() *RecoveryService {
	return &RecoveryService{
		requests: make(map[common.Address]*RecoveryRequest),
	}
}

func (s *WalletService) AddGuardian(walletAddr common.Address, guardian common.Address, threshold uint8) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[walletAddr]
	if !ok {
		return errors.New("wallet not found")
	}

	for _, g := range w.Guardians {
		if g.Address == guardian {
			return errors.New("guardian already exists")
		}
	}

	w.Guardians = append(w.Guardians, Guardian{
		Address:   guardian,
		AddedAt:   0,
		Threshold: threshold,
	})

	return nil
}

func (s *WalletService) RemoveGuardian(walletAddr common.Address, guardian common.Address) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	w, ok := s.wallets[walletAddr]
	if !ok {
		return errors.New("wallet not found")
	}

	for i, g := range w.Guardians {
		if g.Address == guardian {
			w.Guardians = append(w.Guardians[:i], w.Guardians[i+1:]...)
			return nil
		}
	}

	return errors.New("guardian not found")
}

func (rs *RecoveryService) InitiateRecovery(wallet *Wallet, newOwner common.Address) (*RecoveryRequest, error) {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	if len(wallet.Guardians) == 0 {
		return nil, errors.New("no guardians configured")
	}

	req := &RecoveryRequest{
		WalletAddress: wallet.Address,
		NewOwner:      newOwner,
		Approvals:     make(map[common.Address][]byte),
		Threshold:     wallet.Guardians[0].Threshold,
		Executed:      false,
	}

	rs.requests[wallet.Address] = req
	return req, nil
}

func (rs *RecoveryService) ApproveRecovery(walletAddr common.Address, guardian common.Address, signature []byte) error {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	req, ok := rs.requests[walletAddr]
	if !ok {
		return errors.New("no recovery request found")
	}

	if req.Executed {
		return errors.New("recovery already executed")
	}

	recoveryHash := crypto.Keccak256(
		walletAddr.Bytes(),
		req.NewOwner.Bytes(),
	)

	sigPublicKey, err := crypto.SigToPub(recoveryHash, signature)
	if err != nil {
		return errors.New("invalid signature")
	}

	recoveredAddr := crypto.PubkeyToAddress(*sigPublicKey)
	if recoveredAddr != guardian {
		return errors.New("signature does not match guardian")
	}

	req.Approvals[guardian] = signature
	return nil
}

func (rs *RecoveryService) ExecuteRecovery(walletAddr common.Address, walletService *WalletService) error {
	rs.mu.Lock()
	defer rs.mu.Unlock()

	req, ok := rs.requests[walletAddr]
	if !ok {
		return errors.New("no recovery request found")
	}

	if req.Executed {
		return errors.New("recovery already executed")
	}

	if uint8(len(req.Approvals)) < req.Threshold {
		return errors.New("insufficient approvals")
	}

	walletService.mu.Lock()
	defer walletService.mu.Unlock()

	w, ok := walletService.wallets[walletAddr]
	if !ok {
		return errors.New("wallet not found")
	}

	w.Owner = req.NewOwner
	req.Executed = true
	delete(rs.requests, walletAddr)

	return nil
}
