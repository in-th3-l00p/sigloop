package tests

import (
	"context"
	"encoding/hex"
	"math/big"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/sigloop/integration-go/abis"
	"github.com/sigloop/integration-go/deploy"
	"github.com/sigloop/integration-go/helpers"
)

func deployHook(t *testing.T) (common.Address, abi.ABI, helpers.Account) {
	t.Helper()
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	deployer := helpers.GetAccount(0)
	parsedABI, err := abi.JSON(strings.NewReader(abis.SpendingLimitHookABI))
	if err != nil {
		t.Fatal(err)
	}

	bytecode, err := hex.DecodeString(deploy.HookBytecode)
	if err != nil {
		t.Fatal(err)
	}

	addr, _, err := helpers.DeployContract(client, deployer.Key, bytecode, parsedABI)
	if err != nil {
		t.Fatal(err)
	}

	return addr, parsedABI, deployer
}

func TestSetLimitsAndPreCheck(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployHook(t)
	agent := helpers.GetAccount(1)
	token := common.HexToAddress("0x2222222222222222222222222222222222222222")

	setInput, err := parsedABI.Pack("setLimits", agent.Address, token, big.NewInt(1000000), big.NewInt(5000000))
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, setInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	preCheckData, err := abi.Arguments{
		{Type: mustType("address")},
		{Type: mustType("address")},
		{Type: mustType("uint256")},
	}.Pack(agent.Address, token, big.NewInt(500000))
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

	spendingData, err := parsedABI.Pack("getSpending", owner.Address, agent.Address, token)
	if err != nil {
		t.Fatal(err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &addr,
		Data: spendingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	output, err := parsedABI.Unpack("getSpending", result)
	if err != nil {
		t.Fatal(err)
	}

	type SpendingResult struct {
		DailySpent      *big.Int
		WeeklySpent     *big.Int
		LastDailyReset  *big.Int
		LastWeeklyReset *big.Int
	}

	spending := abi.ConvertType(output[0], new(SpendingResult)).(*SpendingResult)

	if spending.DailySpent.Cmp(big.NewInt(500000)) != 0 {
		t.Fatalf("expected dailySpent 500000, got %s", spending.DailySpent.String())
	}
	if spending.WeeklySpent.Cmp(big.NewInt(500000)) != 0 {
		t.Fatalf("expected weeklySpent 500000, got %s", spending.WeeklySpent.String())
	}
}

func TestResetSpending(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployHook(t)
	agent := helpers.GetAccount(3)
	token := common.HexToAddress("0x3333333333333333333333333333333333333333")

	setInput, err := parsedABI.Pack("setLimits", agent.Address, token, big.NewInt(2000000), big.NewInt(10000000))
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, setInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	preCheckData, err := abi.Arguments{
		{Type: mustType("address")},
		{Type: mustType("address")},
		{Type: mustType("uint256")},
	}.Pack(agent.Address, token, big.NewInt(100000))
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

	resetInput, err := parsedABI.Pack("resetSpending", agent.Address, token)
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, resetInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	spendingData, err := parsedABI.Pack("getSpending", owner.Address, agent.Address, token)
	if err != nil {
		t.Fatal(err)
	}

	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &addr,
		Data: spendingData,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	output, err := parsedABI.Unpack("getSpending", result)
	if err != nil {
		t.Fatal(err)
	}

	type SpendingResult struct {
		DailySpent      *big.Int
		WeeklySpent     *big.Int
		LastDailyReset  *big.Int
		LastWeeklyReset *big.Int
	}

	spending := abi.ConvertType(output[0], new(SpendingResult)).(*SpendingResult)

	if spending.DailySpent.Cmp(big.NewInt(0)) != 0 {
		t.Fatalf("expected dailySpent 0 after reset, got %s", spending.DailySpent.String())
	}
	if spending.WeeklySpent.Cmp(big.NewInt(0)) != 0 {
		t.Fatalf("expected weeklySpent 0 after reset, got %s", spending.WeeklySpent.String())
	}
}

func TestIsModuleTypeHook(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, _ := deployHook(t)

	callData, err := parsedABI.Pack("isModuleType", big.NewInt(4))
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

	output, err := parsedABI.Unpack("isModuleType", result)
	if err != nil {
		t.Fatal(err)
	}

	if !output[0].(bool) {
		t.Fatal("should return true for typeId 4")
	}
}

func mustType(t string) abi.Type {
	typ, _ := abi.NewType(t, "", nil)
	return typ
}
