package encoding

import (
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type UserOperation struct {
	Sender               common.Address
	Nonce                *big.Int
	InitCode             []byte
	CallData             []byte
	CallGasLimit         *big.Int
	VerificationGasLimit *big.Int
	PreVerificationGas   *big.Int
	MaxFeePerGas         *big.Int
	MaxPriorityFeePerGas *big.Int
	PaymasterAndData     []byte
	Signature            []byte
}

var userOpPackABI = abi.Arguments{
	{Type: mustNewType("address")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("bytes32")},
	{Type: mustNewType("bytes32")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("uint256")},
	{Type: mustNewType("bytes32")},
}

func PackUserOp(op *UserOperation) ([]byte, error) {
	initCodeHash := crypto.Keccak256Hash(op.InitCode)
	callDataHash := crypto.Keccak256Hash(op.CallData)
	paymasterHash := crypto.Keccak256Hash(op.PaymasterAndData)

	return userOpPackABI.Pack(
		op.Sender,
		op.Nonce,
		initCodeHash,
		callDataHash,
		op.CallGasLimit,
		op.VerificationGasLimit,
		op.PreVerificationGas,
		op.MaxFeePerGas,
		op.MaxPriorityFeePerGas,
		paymasterHash,
	)
}

func HashUserOp(op *UserOperation, entryPoint common.Address, chainID *big.Int) (common.Hash, error) {
	packed, err := PackUserOp(op)
	if err != nil {
		return common.Hash{}, err
	}

	opHash := crypto.Keccak256Hash(packed)

	chainArgs := abi.Arguments{
		{Type: mustNewType("bytes32")},
		{Type: mustNewType("address")},
		{Type: mustNewType("uint256")},
	}

	final, err := chainArgs.Pack(opHash, entryPoint, chainID)
	if err != nil {
		return common.Hash{}, err
	}

	return crypto.Keccak256Hash(final), nil
}

func EncodeCallData(target common.Address, value *big.Int, data []byte) ([]byte, error) {
	executeArgs := abi.Arguments{
		{Type: mustNewType("address")},
		{Type: mustNewType("uint256")},
		{Type: mustNewType("bytes")},
	}

	packed, err := executeArgs.Pack(target, value, data)
	if err != nil {
		return nil, err
	}

	selector := crypto.Keccak256([]byte("execute(address,uint256,bytes)"))[:4]
	return append(selector, packed...), nil
}
