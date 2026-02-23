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

func deployValidator(t *testing.T) (common.Address, abi.ABI, helpers.Account) {
	t.Helper()
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	deployer := helpers.GetAccount(0)
	parsedABI, err := abi.JSON(strings.NewReader(abis.AgentPermissionValidatorABI))
	if err != nil {
		t.Fatal(err)
	}

	bytecode, err := hex.DecodeString(deploy.ValidatorBytecode)
	if err != nil {
		t.Fatal(err)
	}

	addr, _, err := helpers.DeployContract(client, deployer.Key, bytecode, parsedABI)
	if err != nil {
		t.Fatal(err)
	}

	return addr, parsedABI, deployer
}

func TestAddAgentAndGetPolicy(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployValidator(t)
	agent := helpers.GetAccount(1)

	allowedTargets := []common.Address{common.HexToAddress("0x1111111111111111111111111111111111111111")}
	allowedSelectors := [][4]byte{{0xa9, 0x05, 0x9c, 0xbb}}

	input, err := parsedABI.Pack("addAgent", agent.Address, struct {
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

	_, _, err = helpers.SendTx(client, owner.Key, &addr, input, nil)
	if err != nil {
		t.Fatal(err)
	}

	callData, err := parsedABI.Pack("getPolicy", owner.Address, agent.Address)
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

	output, err := parsedABI.Unpack("getPolicy", result)
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

	policy := abi.ConvertType(output[0], new(PolicyResult)).(*PolicyResult)

	if !policy.Active {
		t.Fatal("policy should be active")
	}
	if policy.MaxAmountPerTx.Cmp(big.NewInt(1000000)) != 0 {
		t.Fatalf("expected maxAmountPerTx 1000000, got %s", policy.MaxAmountPerTx.String())
	}
	if len(policy.AllowedTargets) != 1 {
		t.Fatalf("expected 1 allowed target, got %d", len(policy.AllowedTargets))
	}
}

func TestRemoveAgent(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, owner := deployValidator(t)
	agent := helpers.GetAccount(2)

	addInput, err := parsedABI.Pack("addAgent", agent.Address, struct {
		AllowedTargets   []common.Address
		AllowedSelectors [][4]byte
		MaxAmountPerTx   *big.Int
		DailyLimit       *big.Int
		WeeklyLimit      *big.Int
		ValidAfter       *big.Int
		ValidUntil       *big.Int
		Active           bool
	}{
		AllowedTargets:   []common.Address{},
		AllowedSelectors: [][4]byte{},
		MaxAmountPerTx:   big.NewInt(500000),
		DailyLimit:       big.NewInt(1000000),
		WeeklyLimit:      big.NewInt(5000000),
		ValidAfter:       big.NewInt(0),
		ValidUntil:       big.NewInt(0),
		Active:           true,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, addInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	removeInput, err := parsedABI.Pack("removeAgent", agent.Address)
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, owner.Key, &addr, removeInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	callData, err := parsedABI.Pack("getPolicy", owner.Address, agent.Address)
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

	output, err := parsedABI.Unpack("getPolicy", result)
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

	policy := abi.ConvertType(output[0], new(PolicyResult)).(*PolicyResult)

	if policy.Active {
		t.Fatal("policy should be inactive after removal")
	}
	if policy.MaxAmountPerTx.Cmp(big.NewInt(0)) != 0 {
		t.Fatal("maxAmountPerTx should be 0 after removal")
	}
}

func TestIsModuleTypeValidator(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, _ := deployValidator(t)

	callData, err := parsedABI.Pack("isModuleType", big.NewInt(1))
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

	isType := output[0].(bool)
	if !isType {
		t.Fatal("should return true for typeId 1")
	}

	callData2, err := parsedABI.Pack("isModuleType", big.NewInt(2))
	if err != nil {
		t.Fatal(err)
	}

	result2, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &addr,
		Data: callData2,
	}, nil)
	if err != nil {
		t.Fatal(err)
	}

	output2, err := parsedABI.Unpack("isModuleType", result2)
	if err != nil {
		t.Fatal(err)
	}

	isType2 := output2[0].(bool)
	if isType2 {
		t.Fatal("should return false for typeId 2")
	}
}
