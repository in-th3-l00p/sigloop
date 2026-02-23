package chain

import (
	"errors"
	"math"
)

type RoutePreference struct {
	PreferTestnet bool
	PreferLowCost bool
	PreferSpeed   bool
}

func (s *ChainService) SelectOptimalChain(pref RoutePreference) (*ChainConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if len(s.configs) == 0 {
		return nil, errors.New("no chains configured")
	}

	var best *ChainConfig
	bestScore := math.Inf(-1)

	for _, cfg := range s.configs {
		score := 0.0

		if pref.PreferTestnet && cfg.IsTestnet {
			score += 100
		}
		if !pref.PreferTestnet && !cfg.IsTestnet {
			score += 100
		}

		if pref.PreferLowCost {
			score += 10.0 / cfg.GasMultiple
		}

		if pref.PreferSpeed {
			score += 10.0 / float64(cfg.BlockTime)
		}

		if score > bestScore {
			bestScore = score
			c := cfg
			best = &c
		}
	}

	if best == nil {
		return nil, errors.New("no suitable chain found")
	}

	return best, nil
}
