package tests

import (
	"context"
	"math/big"
	"net/http"
	"testing"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/integration-go/deploy"
	"github.com/sigloop/integration-go/helpers"
	"github.com/sigloop/integration-go/x402"
)

func TestFullFlow(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	owner := helpers.GetAccount(0)
	agent := helpers.GetAccount(1)

	contracts, err := deploy.DeployAll(client, owner)
	if err != nil {
		t.Fatal(err)
	}

	allowedTargets := []common.Address{contracts.Executor}
	allowedSelectors := [][4]byte{}

	addAgentInput, err := contracts.ValidatorABI.Pack("addAgent", agent.Address, struct {
		AllowedTargets   []common.Address
		AllowedSelectors [][4]byte
		MaxAmountPerTx   *big.Int
		DailyLimit       *big.Int
		WeeklyLimit      *big.Int
		ValidAfter       *big.Int
		ValidUntil       *big.Int
		Active           bool
	}{
		AllowedTargets:   allowedTargets,
		AllowedSelectors: allowedSelectors,
		MaxAmountPerTx:   big.NewInt(1000000),
		DailyLimit:       big.NewInt(5000000),
		WeeklyLimit:      big.NewInt(20000000),
		ValidAfter:       big.NewInt(0),
		ValidUntil:       big.NewInt(0),
		Active:           true,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.Validator, addAgentInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	getPolicyData, err := contracts.ValidatorABI.Pack("getPolicy", owner.Address, agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	policyResult, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contracts.Validator,
		Data: getPolicyData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	policyOutput, err := contracts.ValidatorABI.Unpack("getPolicy", policyResult)
	if err != nil {
		t.Fatal(err)
	}

	type PolicyResult struct {
		AllowedTargets   []common.Address
		AllowedSelectors [][4]byte
		MaxAmountPerTx   *big.Int
		DailyLimit       *big.Int
		WeeklyLimit      *big.Int
		ValidAfter       *big.Int
		ValidUntil       *big.Int
		Active           bool
	}

	policy := abi.ConvertType(policyOutput[0], new(PolicyResult)).(*PolicyResult)
	if !policy.Active {
		t.Fatal("agent policy should be active")
	}

	configInput, err := contracts.X402ABI.Pack("configureAgent", agent.Address, struct {
		MaxPerRequest  *big.Int
		DailyBudget    *big.Int
		TotalBudget    *big.Int
		Spent          *big.Int
		DailySpent     *big.Int
		LastReset      *big.Int
		AllowedDomains []string
	}{
		MaxPerRequest:  big.NewInt(100000),
		DailyBudget:    big.NewInt(500000),
		TotalBudget:    big.NewInt(2000000),
		Spent:          big.NewInt(0),
		DailySpent:     big.NewInt(0),
		LastReset:      big.NewInt(0),
		AllowedDomains: []string{"api.example.com", "data.example.com"},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.X402Policy, configInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	requirements := []x402.PaymentRequirement{
		{
			Scheme:    "exact",
			Network:   "base-sepolia",
			MaxAmount: "50000",
			Resource:  "/api/premium-data",
			Address:   contracts.X402Policy.Hex(),
		},
	}

	server, err := x402.NewMockX402Server(requirements)
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()

	x402Client := x402.NewX402Client(agent.Key)
	resp, err := x402Client.Get(server.URL + "/api/premium-data")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 after x402 payment, got %d", resp.StatusCode)
	}

	payments := server.GetPayments()
	if len(payments) != 1 {
		t.Fatalf("expected 1 payment recorded, got %d", len(payments))
	}

	if payments[0].Sender != agent.Address.Hex() {
		t.Fatalf("payment sender mismatch: expected %s, got %s", agent.Address.Hex(), payments[0].Sender)
	}

	preCheckData, err := abi.Arguments{
		{Type: mustType("address")},
		{Type: mustType("uint256")},
	}.Pack(agent.Address, big.NewInt(50000))
	if err != nil {
		t.Fatal(err)
	}

	preCheckInput, err := contracts.X402ABI.Pack("preCheck", owner.Address, big.NewInt(0), preCheckData)
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.X402Policy, preCheckInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	remainingData, err := contracts.X402ABI.Pack("getRemainingBudget", owner.Address, agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	remainingResult, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contracts.X402Policy,
		Data: remainingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	remainingOutput, err := contracts.X402ABI.Unpack("getRemainingBudget", remainingResult)
	if err != nil {
		t.Fatal(err)
	}

	remaining := remainingOutput[0].(*big.Int)
	expected := big.NewInt(1950000)
	if remaining.Cmp(expected) != 0 {
		t.Fatalf("expected remaining budget %s, got %s", expected.String(), remaining.String())
	}

	setLimitsInput, err := contracts.HookABI.Pack("setLimits", agent.Address, common.Address{}, big.NewInt(1000000), big.NewInt(5000000))
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.Hook, setLimitsInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	hookPreCheckData, err := abi.Arguments{
		{Type: mustType("address")},
		{Type: mustType("address")},
		{Type: mustType("uint256")},
	}.Pack(agent.Address, common.Address{}, big.NewInt(50000))
	if err != nil {
		t.Fatal(err)
	}

	hookPreInput, err := contracts.HookABI.Pack("preCheck", owner.Address, big.NewInt(0), hookPreCheckData)
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.Hook, hookPreInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	spendingData, err := contracts.HookABI.Pack("getSpending", owner.Address, agent.Address, common.Address{})
	if err != nil {
		t.Fatal(err)
	}

	spendingResult, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contracts.Hook,
		Data: spendingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	spendingOutput, err := contracts.HookABI.Unpack("getSpending", spendingResult)
	if err != nil {
		t.Fatal(err)
	}

	type SpendingResult struct {
		DailySpent      *big.Int
		WeeklySpent     *big.Int
		LastDailyReset  *big.Int
		LastWeeklyReset *big.Int
	}

	spending := abi.ConvertType(spendingOutput[0], new(SpendingResult)).(*SpendingResult)
	if spending.DailySpent.Cmp(big.NewInt(50000)) != 0 {
		t.Fatalf("expected spending hook dailySpent 50000, got %s", spending.DailySpent.String())
	}
}

func TestFullFlowBudgetExhaustion(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	owner := helpers.GetAccount(0)
	agent := helpers.GetAccount(7)

	contracts, err := deploy.DeployAll(client, owner)
	if err != nil {
		t.Fatal(err)
	}

	configInput, err := contracts.X402ABI.Pack("configureAgent", agent.Address, struct {
		MaxPerRequest  *big.Int
		DailyBudget    *big.Int
		TotalBudget    *big.Int
		Spent          *big.Int
		DailySpent     *big.Int
		LastReset      *big.Int
		AllowedDomains []string
	}{
		MaxPerRequest:  big.NewInt(100),
		DailyBudget:    big.NewInt(250),
		TotalBudget:    big.NewInt(250),
		Spent:          big.NewInt(0),
		DailySpent:     big.NewInt(0),
		LastReset:      big.NewInt(0),
		AllowedDomains: []string{},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &contracts.X402Policy, configInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	for i := 0; i < 2; i++ {
		preCheckData, err := abi.Arguments{
			{Type: mustType("address")},
			{Type: mustType("uint256")},
		}.Pack(agent.Address, big.NewInt(100))
		if err != nil {
			t.Fatal(err)
		}

		preCheckInput, err := contracts.X402ABI.Pack("preCheck", owner.Address, big.NewInt(0), preCheckData)
		if err != nil {
			t.Fatal(err)
		}

		_, _, err = helpers.SendTx(client, owner.Key, &contracts.X402Policy, preCheckInput, nil)
		if err != nil {
			t.Fatal(err)
		}
	}

	remainingData, err := contracts.X402ABI.Pack("getRemainingBudget", owner.Address, agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	remainingResult, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contracts.X402Policy,
		Data: remainingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	remainingOutput, err := contracts.X402ABI.Unpack("getRemainingBudget", remainingResult)
	if err != nil {
		t.Fatal(err)
	}

	remaining := remainingOutput[0].(*big.Int)
	if remaining.Cmp(big.NewInt(50)) != 0 {
		t.Fatalf("expected remaining budget 50, got %s", remaining.String())
	}
}
