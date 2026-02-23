// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

interface IValidator {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) external returns (uint256);
    function isModuleType(uint256 typeId) external pure returns (bool);
}

interface IHook {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function preCheck(address msgSender, uint256 value, bytes calldata msgData) external returns (bytes memory);
    function postCheck(bytes calldata hookData) external;
    function isModuleType(uint256 typeId) external pure returns (bool);
}

interface IExecutor {
    function onInstall(bytes calldata data) external;
    function onUninstall(bytes calldata data) external;
    function executeFromExecutor(address account, bytes calldata data) external returns (bytes memory);
    function isModuleType(uint256 typeId) external pure returns (bool);
}
