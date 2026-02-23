package chain

import (
	"errors"
	"sync"
)

type ChainService struct {
	configs map[SupportedChain]ChainConfig
	mu      sync.RWMutex
}

func NewChainService() *ChainService {
	configs := make(map[SupportedChain]ChainConfig, len(Chains))
	for k, v := range Chains {
		configs[k] = v
	}
	return &ChainService{
		configs: configs,
	}
}

func (s *ChainService) GetChain(chain SupportedChain) (*ChainConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cfg, ok := s.configs[chain]
	if !ok {
		return nil, errors.New("unsupported chain")
	}
	return &cfg, nil
}

func (s *ChainService) ListChains() []ChainConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]ChainConfig, 0, len(s.configs))
	for _, cfg := range s.configs {
		result = append(result, cfg)
	}
	return result
}

func (s *ChainService) RegisterChain(cfg ChainConfig) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.configs[cfg.Chain] = cfg
}
