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

func deployExecutor(t *testing.T) (common.Address, abi.ABI, helpers.Account) {
	t.Helper()
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	deployer := helpers.GetAccount(0)
	parsedABI, err := abi.JSON(strings.NewReader(abis.DeFiExecutorABI))
	if err != nil {
		t.Fatal(err)
	}

	bytecode, err := hex.DecodeString(deploy.ExecutorBytecode)
	if err != nil {
		t.Fatal(err)
	}

	addr, _, err := helpers.DeployContract(client, deployer.Key, bytecode, parsedABI)
	if err != nil {
		t.Fatal(err)
	}

	return addr, parsedABI, deployer
}

func TestEncodeSwap(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, _ := deployExecutor(t)

	router := common.HexToAddress("0x4444444444444444444444444444444444444444")
	tokenIn := common.HexToAddress("0x5555555555555555555555555555555555555555")
	tokenOut := common.HexToAddress("0x6666666666666666666666666666666666666666")

	callData, err := parsedABI.Pack("encodeSwap", router, tokenIn, tokenOut, big.NewInt(1000), big.NewInt(900))
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

	output, err := parsedABI.Unpack("encodeSwap", result)
	if err != nil {
		t.Fatal(err)
	}

	encoded := output[0].([]byte)
	if len(encoded) == 0 {
		t.Fatal("encoded swap data should not be empty")
	}
}

func TestEncodeLending(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, _ := deployExecutor(t)

	pool := common.HexToAddress("0x7777777777777777777777777777777777777777")
	asset := common.HexToAddress("0x8888888888888888888888888888888888888888")

	callData, err := parsedABI.Pack("encodeLending", pool, asset, big.NewInt(5000), true)
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

	output, err := parsedABI.Unpack("encodeLending", result)
	if err != nil {
		t.Fatal(err)
	}

	encoded := output[0].([]byte)
	if len(encoded) == 0 {
		t.Fatal("encoded lending data should not be empty")
	}
}

func TestIsModuleTypeExecutor(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, _ := deployExecutor(t)

	callData, err := parsedABI.Pack("isModuleType", big.NewInt(2))
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
		t.Fatal("should return true for typeId 2")
	}

	callData2, err := parsedABI.Pack("isModuleType", big.NewInt(1))
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

	if output2[0].(bool) {
		t.Fatal("should return false for typeId 1")
	}
}

func TestOnInstallOnUninstall(t *testing.T) {
	client, err := helpers.NewAnvilClient()
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	addr, parsedABI, deployer := deployExecutor(t)

	installInput, err := parsedABI.Pack("onInstall", []byte{})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, deployer.Key, &addr, installInput, nil)
	if err != nil {
		t.Fatal(err)
	}

	uninstallInput, err := parsedABI.Pack("onUninstall", []byte{})
	if err != nil {
		t.Fatal(err)
	}

	_, _, err = helpers.SendTx(client, deployer.Key, &addr, uninstallInput, nil)
	if err != nil {
		t.Fatal(err)
	}
}
