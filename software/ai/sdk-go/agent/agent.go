package agent

import (
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type AgentService struct {
	agents map[string]*Agent
	mu     sync.RWMutex
}

func NewAgentService() *AgentService {
	return &AgentService{
		agents: make(map[string]*Agent),
	}
}

func (s *AgentService) CreateAgent(params CreateAgentParams) (*Agent, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	sessionKey, err := GenerateSessionKey(params.ChainID, params.Config.Duration)
	if err != nil {
		return nil, err
	}

	idBytes := crypto.Keccak256(
		sessionKey.Address.Bytes(),
		params.Config.WalletAddress.Bytes(),
	)
	id := hex.EncodeToString(idBytes[:16])

	now := time.Now()
	a := &Agent{
		ID:            id,
		Name:          params.Config.Name,
		WalletAddress: params.Config.WalletAddress,
		SessionKey:    sessionKey,
		Status:        AgentStatusActive,
		CreatedAt:     now,
		ExpiresAt:     now.Add(params.Config.Duration),
		Permissions:   params.Config.Permissions,
	}

	s.agents[id] = a
	return a, nil
}

func (s *AgentService) RevokeAgent(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	a, ok := s.agents[id]
	if !ok {
		return errors.New("agent not found")
	}

	a.Status = AgentStatusRevoked
	return nil
}

func (s *AgentService) GetAgent(id string) (*Agent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	a, ok := s.agents[id]
	if !ok {
		return nil, errors.New("agent not found")
	}

	if a.Status == AgentStatusActive && time.Now().After(a.ExpiresAt) {
		a.Status = AgentStatusExpired
	}

	return a, nil
}

func (s *AgentService) ListAgents(walletAddr common.Address) []*Agent {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []*Agent
	now := time.Now()
	for _, a := range s.agents {
		if a.WalletAddress == walletAddr {
			if a.Status == AgentStatusActive && now.After(a.ExpiresAt) {
				a.Status = AgentStatusExpired
			}
			result = append(result, a)
		}
	}
	return result
}
