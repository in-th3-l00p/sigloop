package sigloop

import (
	"github.com/sigloop/sdk-go/agent"
	"github.com/sigloop/sdk-go/chain"
	"github.com/sigloop/sdk-go/defi"
	"github.com/sigloop/sdk-go/policy"
	"github.com/sigloop/sdk-go/wallet"
	"github.com/sigloop/sdk-go/x402"
)

type SigloopClient struct {
	WalletService *wallet.WalletService
	AgentService  *agent.AgentService
	PolicyService *policy.PolicyService
	X402Service   *x402.BudgetTracker
	ChainService  *chain.ChainService
	DeFiService   *defi.DeFiService
}

func NewClient(walletConfig wallet.WalletConfig, x402Policy x402.X402Policy, budgetPeriod uint64) *SigloopClient {
	chainService := chain.NewChainService()
	return &SigloopClient{
		WalletService: wallet.NewWalletService(walletConfig),
		AgentService:  agent.NewAgentService(),
		PolicyService: policy.NewPolicyService(),
		X402Service:   x402.NewBudgetTracker(x402Policy, budgetPeriod),
		ChainService:  chainService,
		DeFiService:   defi.NewDeFiService(chainService),
	}
}
