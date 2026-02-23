package policy

import (
	"encoding/hex"
	"errors"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
)

type PolicyService struct {
	policies map[string]*Policy
	mu       sync.RWMutex
}

func NewPolicyService() *PolicyService {
	return &PolicyService{
		policies: make(map[string]*Policy),
	}
}

func (s *PolicyService) CreatePolicy(p *Policy) (*Policy, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if p == nil {
		return nil, errors.New("nil policy")
	}

	now := time.Now()
	idBytes := crypto.Keccak256([]byte(now.String()))
	p.ID = hex.EncodeToString(idBytes[:16])
	p.CreatedAt = now

	s.policies[p.ID] = p
	return p, nil
}

func (s *PolicyService) GetPolicy(id string) (*Policy, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, ok := s.policies[id]
	if !ok {
		return nil, errors.New("policy not found")
	}
	return p, nil
}

func (s *PolicyService) ValidatePolicy(p *Policy) error {
	if p == nil {
		return errors.New("nil policy")
	}

	for _, sl := range p.SpendingLimits {
		if sl.MaxAmount == nil || sl.MaxAmount.Sign() <= 0 {
			return errors.New("invalid spending limit amount")
		}
		if sl.Period <= 0 {
			return errors.New("invalid spending limit period")
		}
	}

	if p.TimeWindow != nil {
		if !p.TimeWindow.End.IsZero() && p.TimeWindow.Start.After(p.TimeWindow.End) {
			return errors.New("time window start after end")
		}
		if p.TimeWindow.Hours[0] < 0 || p.TimeWindow.Hours[0] > 23 {
			return errors.New("invalid start hour")
		}
		if p.TimeWindow.Hours[1] < 0 || p.TimeWindow.Hours[1] > 23 {
			return errors.New("invalid end hour")
		}
	}

	if p.RateLimit != nil {
		if p.RateLimit.MaxCalls == 0 {
			return errors.New("rate limit max calls must be positive")
		}
		if p.RateLimit.Period <= 0 {
			return errors.New("invalid rate limit period")
		}
	}

	return nil
}
