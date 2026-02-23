package helpers

import (
	"context"
	"crypto/ecdsa"
	"math/big"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/sigloop/integration-go/config"
)

func WaitForTx(client *ethclient.Client, tx *types.Transaction) (*types.Receipt, error) {
	ctx := context.Background()
	receipt, err := client.TransactionReceipt(ctx, tx.Hash())
	if err != nil {
		return nil, err
	}
	return receipt, nil
}

func SendTx(client *ethclient.Client, key *ecdsa.PrivateKey, to *common.Address, data []byte, value *big.Int) (*types.Transaction, *types.Receipt, error) {
	ctx := context.Background()
	from := crypto.PubkeyToAddress(key.PublicKey)

	nonce, err := client.PendingNonceAt(ctx, from)
	if err != nil {
		return nil, nil, err
	}

	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, nil, err
	}

	if value == nil {
		value = big.NewInt(0)
	}

	msg := ethereum.CallMsg{
		From:  from,
		To:    to,
		Value: value,
		Data:  data,
	}
	gasLimit, err := client.EstimateGas(ctx, msg)
	if err != nil {
		gasLimit = 8000000
	}

	tx := types.NewTransaction(nonce, *to, value, gasLimit, gasPrice, data)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(config.ChainID), key)
	if err != nil {
		return nil, nil, err
	}

	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return nil, nil, err
	}

	receipt, err := WaitForTx(client, signedTx)
	if err != nil {
		return nil, nil, err
	}

	return signedTx, receipt, nil
}

func DeployContract(client *ethclient.Client, key *ecdsa.PrivateKey, bytecode []byte, parsedABI abi.ABI, args ...interface{}) (common.Address, *types.Transaction, error) {
	ctx := context.Background()
	from := crypto.PubkeyToAddress(key.PublicKey)

	nonce, err := client.PendingNonceAt(ctx, from)
	if err != nil {
		return common.Address{}, nil, err
	}

	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return common.Address{}, nil, err
	}

	input := bytecode
	if len(args) > 0 {
		constructorArgs, err := parsedABI.Pack("", args...)
		if err != nil {
			return common.Address{}, nil, err
		}
		input = append(input, constructorArgs...)
	}

	tx := types.NewContractCreation(nonce, big.NewInt(0), 8000000, gasPrice, input)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(config.ChainID), key)
	if err != nil {
		return common.Address{}, nil, err
	}

	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return common.Address{}, nil, err
	}

	receipt, err := WaitForTx(client, signedTx)
	if err != nil {
		return common.Address{}, nil, err
	}

	return receipt.ContractAddress, signedTx, nil
}
