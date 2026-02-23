package deploy

import (
	"encoding/hex"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sigloop/integration-go/abis"
	"github.com/sigloop/integration-go/helpers"
)

type DeployedContracts struct {
	Validator   common.Address
	Hook        common.Address
	X402Policy  common.Address
	Executor    common.Address
	ValidatorABI abi.ABI
	HookABI      abi.ABI
	X402ABI      abi.ABI
	ExecutorABI  abi.ABI
}

func DeployAll(client *ethclient.Client, deployer helpers.Account) (*DeployedContracts, error) {
	validatorABI, err := abi.JSON(strings.NewReader(abis.AgentPermissionValidatorABI))
	if err != nil {
		return nil, err
	}

	hookABI, err := abi.JSON(strings.NewReader(abis.SpendingLimitHookABI))
	if err != nil {
		return nil, err
	}

	x402ABI, err := abi.JSON(strings.NewReader(abis.X402PaymentPolicyABI))
	if err != nil {
		return nil, err
	}

	executorABI, err := abi.JSON(strings.NewReader(abis.DeFiExecutorABI))
	if err != nil {
		return nil, err
	}

	validatorBin, err := hex.DecodeString(ValidatorBytecode)
	if err != nil {
		return nil, err
	}
	validatorAddr, _, err := helpers.DeployContract(client, deployer.Key, validatorBin, validatorABI)
	if err != nil {
		return nil, err
	}

	hookBin, err := hex.DecodeString(HookBytecode)
	if err != nil {
		return nil, err
	}
	hookAddr, _, err := helpers.DeployContract(client, deployer.Key, hookBin, hookABI)
	if err != nil {
		return nil, err
	}

	x402Bin, err := hex.DecodeString(X402PolicyBytecode)
	if err != nil {
		return nil, err
	}
	x402Addr, _, err := helpers.DeployContract(client, deployer.Key, x402Bin, x402ABI)
	if err != nil {
		return nil, err
	}

	executorBin, err := hex.DecodeString(ExecutorBytecode)
	if err != nil {
		return nil, err
	}
	executorAddr, _, err := helpers.DeployContract(client, deployer.Key, executorBin, executorABI)
	if err != nil {
		return nil, err
	}

	return &DeployedContracts{
		Validator:    validatorAddr,
		Hook:         hookAddr,
		X402Policy:   x402Addr,
		Executor:     executorAddr,
		ValidatorABI: validatorABI,
		HookABI:      hookABI,
		X402ABI:      x402ABI,
		ExecutorABI:  executorABI,
	}, nil
}
