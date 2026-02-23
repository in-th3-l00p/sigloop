package tests

import (
	"context"
	"encoding/hex"
	"math/big"
	"net/http"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/integration-go/abis"
	"github.com/sigloop/integration-go/deploy"
	"github.com/sigloop/integration-go/helpers"
	"github.com/sigloop/integration-go/x402"
)

func deployX402(t *testing.T) (common.Address, abi.ABI, helpers.Account) {
	t.Helper()
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	deployer := helpers.GetAccount(0)
	parsedABI, err := abi.JSON(strings.NewReader(abis.X402PaymentPolicyABI))
	if err != nil {
		t.Fatal(err)
	}

	bytecode, err := hex.DecodeString(deploy.X402PolicyBytecode)
	if err != nil {
		t.Fatal(err)
	}

	addr, _, err := helpers.DeployContract(client, deployer.Key, bytecode, parsedABI)
	if err != nil {
		t.Fatal(err)
	}

	return addr, parsedABI, deployer
}

func TestConfigureAndGetBudget(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployX402(t)
	agent := helpers.GetAccount(4)

	input, err := parsedABI.Pack("configureAgent", agent.Address, struct {
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
		AllowedDomains: []string{"api.example.com"},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, input, nil)
	if err != nil {
		t.Fatal(err)
	}

	callData, err := parsedABI.Pack("getBudget", owner.Address, agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &addr,
		Data: callData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	output, err := parsedABI.Unpack("getBudget", result)
	if err != nil {
		t.Fatal(err)
	}

	type BudgetResult struct {
		MaxPerRequest  *big.Int
		DailyBudget    *big.Int
		TotalBudget    *big.Int
		Spent          *big.Int
		DailySpent     *big.Int
		LastReset      *big.Int
		AllowedDomains []string
	}

	budget := abi.ConvertType(output[0], new(BudgetResult)).(*BudgetResult)

	if budget.MaxPerRequest.Cmp(big.NewInt(100000)) != 0 {
		t.Fatalf("expected maxPerRequest 100000, got %s", budget.MaxPerRequest.String())
	}
	if budget.TotalBudget.Cmp(big.NewInt(2000000)) != 0 {
		t.Fatalf("expected totalBudget 2000000, got %s", budget.TotalBudget.String())
	}
}

func TestPreCheckRecordsSpending(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployX402(t)
	agent := helpers.GetAccount(5)

	configInput, err := parsedABI.Pack("configureAgent", agent.Address, struct {
		MaxPerRequest  *big.Int
		DailyBudget    *big.Int
		TotalBudget    *big.Int
		Spent          *big.Int
		DailySpent     *big.Int
		LastReset      *big.Int
		AllowedDomains []string
	}{
		MaxPerRequest:  big.NewInt(200000),
		DailyBudget:    big.NewInt(1000000),
		TotalBudget:    big.NewInt(5000000),
		Spent:          big.NewInt(0),
		DailySpent:     big.NewInt(0),
		LastReset:      big.NewInt(0),
		AllowedDomains: []string{},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, configInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	preCheckData, err := abi.Arguments{
		{Type: mustType("address")},
		{Type: mustType("uint256")},
	}.Pack(agent.Address, big.NewInt(150000))
	if err != nil {
		t.Fatal(err)
	}

	preCheckInput, err := parsedABI.Pack("preCheck", owner.Address, big.NewInt(0), preCheckData)
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, preCheckInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	remainingData, err := parsedABI.Pack("getRemainingBudget", owner.Address, agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &addr,
		Data: remainingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	output, err := parsedABI.Unpack("getRemainingBudget", result)
	if err != nil {
		t.Fatal(err)
	}

	remaining := output[0].(*big.Int)
	expected := big.NewInt(4850000)
	if remaining.Cmp(expected) != 0 {
		t.Fatalf("expected remaining budget %s, got %s", expected.String(), remaining.String())
	}
}

func TestX402MockServerPaymentFlow(t *testing.T) {
	requirements := []x402.PaymentRequirement{
		{
			Scheme:    "exact",
			Network:   "base-sepolia",
			MaxAmount: "1000",
			Resource:  "/api/data",
			Address:   "0x0000000000000000000000000000000000000000",
		},
	}

	server, err := x402.NewMockX402Server(requirements)
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()

	agent := helpers.GetAccount(6)
	x402Client := x402.NewX402Client(agent.Key)

	resp, err := x402Client.Get(server.URL + "/api/data")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	payments := server.GetPayments()
	if len(payments) != 1 {
		t.Fatalf("expected 1 payment, got %d", len(payments))
	}

	if payments[0].Amount != "1000" {
		t.Fatalf("expected amount 1000, got %s", payments[0].Amount)
	}

	if payments[0].Sender != agent.Address.Hex() {
		t.Fatalf("expected sender %s, got %s", agent.Address.Hex(), payments[0].Sender)
	}
}

func TestX402ServerReturns402WithoutPayment(t *testing.T) {
	requirements := []x402.PaymentRequirement{
		{
			Scheme:    "exact",
			Network:   "base-sepolia",
			MaxAmount: "500",
			Resource:  "/api/premium",
			Address:   "0x0000000000000000000000000000000000000000",
		},
	}

	server, err := x402.NewMockX402Server(requirements)
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()

	plainClient := &http.Client{}
	resp, err := plainClient.Get(server.URL + "/api/premium")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusPaymentRequired {
		t.Fatalf("expected 402, got %d", resp.StatusCode)
	}
}
