package policy

import (
	"github.com/ethereum/go-ethereum/common"
)

func ComposePolicy(policies ...*Policy) *Policy {
	composed := &Policy{
		SpendingLimits: make([]SpendingLimit, 0),
	}

	contracts := make(map[common.Address]bool)
	functions := make(map[string]bool)

	for _, p := range policies {
		if p == nil {
			continue
		}

		composed.SpendingLimits = append(composed.SpendingLimits, p.SpendingLimits...)

		if p.ContractAllowlist != nil {
			for addr, allowed := range p.ContractAllowlist.Contracts {
				if allowed {
					contracts[addr] = true
				}
			}
		}

		if p.FunctionAllowlist != nil {
			for sig, allowed := range p.FunctionAllowlist.Functions {
				if allowed {
					functions[sig] = true
				}
			}
		}

		if p.TimeWindow != nil {
			if composed.TimeWindow == nil {
				tw := *p.TimeWindow
				composed.TimeWindow = &tw
			} else {
				if p.TimeWindow.Start.After(composed.TimeWindow.Start) {
					composed.TimeWindow.Start = p.TimeWindow.Start
				}
				if !p.TimeWindow.End.IsZero() && (composed.TimeWindow.End.IsZero() || p.TimeWindow.End.Before(composed.TimeWindow.End)) {
					composed.TimeWindow.End = p.TimeWindow.End
				}
			}
		}

		if p.RateLimit != nil {
			if composed.RateLimit == nil {
				rl := *p.RateLimit
				composed.RateLimit = &rl
			} else {
				if p.RateLimit.MaxCalls < composed.RateLimit.MaxCalls {
					composed.RateLimit.MaxCalls = p.RateLimit.MaxCalls
				}
				if p.RateLimit.Period > composed.RateLimit.Period {
					composed.RateLimit.Period = p.RateLimit.Period
				}
			}
		}
	}

	if len(contracts) > 0 {
		composed.ContractAllowlist = &ContractAllowlist{Contracts: contracts}
	}

	if len(functions) > 0 {
		composed.FunctionAllowlist = &FunctionAllowlist{Functions: functions}
	}

	return composed
}
