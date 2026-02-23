// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/modules/AgentPermissionValidator.sol";
import {AgentPolicy} from "../src/interfaces/IAgentPermission.sol";
import {PackedUserOperation} from "../src/interfaces/IERC7579Module.sol";

contract AgentPermissionValidatorTest is Test {
    AgentPermissionValidator public validator;
    address public account;
    uint256 public agentKey;
    address public agent;
    address public targetContract;

    function setUp() public {
        validator = new AgentPermissionValidator();
        account = address(this);
        agentKey = 0xA11CE;
        agent = vm.addr(agentKey);
        targetContract = address(0xBEEF);
    }

    function _createPolicy() internal view returns (AgentPolicy memory) {
        address[] memory targets = new address[](1);
        targets[0] = targetContract;
        bytes4[] memory selectors = new bytes4[](1);
        selectors[0] = bytes4(keccak256("transfer(address,uint256)"));
        return AgentPolicy({
            allowedTargets: targets,
            allowedSelectors: selectors,
            maxAmountPerTx: 1 ether,
            dailyLimit: 10 ether,
            weeklyLimit: 50 ether,
            validAfter: uint48(block.timestamp),
            validUntil: uint48(block.timestamp + 365 days),
            active: true
        });
    }

    function _buildUserOp(
        address target,
        uint256 value,
        bytes4 selector
    ) internal view returns (PackedUserOperation memory, bytes32) {
        bytes memory callData = abi.encodeWithSelector(selector, target, value);
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: account,
            nonce: 0,
            initCode: "",
            callData: callData,
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: ""
        });
        bytes32 userOpHash = keccak256(abi.encode(userOp.sender, userOp.nonce, userOp.callData));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentKey, ethHash);
        userOp.signature = abi.encodePacked(agent, r, s, v);
        return (userOp, userOpHash);
    }

    function testAddAgentAndValidate() public {
        AgentPolicy memory policy = _createPolicy();
        validator.addAgent(agent, policy);

        bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
        (PackedUserOperation memory userOp, bytes32 userOpHash) =
            _buildUserOp(targetContract, 0.5 ether, selector);

        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, 0);
    }

    function testUnauthorizedTargetFails() public {
        AgentPolicy memory policy = _createPolicy();
        validator.addAgent(agent, policy);

        address badTarget = address(0xDEAD);
        bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
        (PackedUserOperation memory userOp, bytes32 userOpHash) =
            _buildUserOp(badTarget, 0.5 ether, selector);

        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, 1);
    }

    function testOverLimitAmountFails() public {
        AgentPolicy memory policy = _createPolicy();
        validator.addAgent(agent, policy);

        bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
        (PackedUserOperation memory userOp, bytes32 userOpHash) =
            _buildUserOp(targetContract, 2 ether, selector);

        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, 1);
    }

    function testExpiredTimeWindowFails() public {
        vm.warp(1000);
        AgentPolicy memory policy = _createPolicy();
        policy.validAfter = uint48(100);
        policy.validUntil = uint48(500);
        validator.addAgent(agent, policy);

        bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
        (PackedUserOperation memory userOp, bytes32 userOpHash) =
            _buildUserOp(targetContract, 0.5 ether, selector);

        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, 1);
    }

    function testRemoveAgent() public {
        AgentPolicy memory policy = _createPolicy();
        validator.addAgent(agent, policy);
        validator.removeAgent(agent);

        bytes4 selector = bytes4(keccak256("transfer(address,uint256)"));
        (PackedUserOperation memory userOp, bytes32 userOpHash) =
            _buildUserOp(targetContract, 0.5 ether, selector);

        uint256 result = validator.validateUserOp(userOp, userOpHash);
        assertEq(result, 1);
    }

    function testGetPolicy() public {
        AgentPolicy memory policy = _createPolicy();
        validator.addAgent(agent, policy);

        AgentPolicy memory retrieved = validator.getPolicy(account, agent);
        assertEq(retrieved.maxAmountPerTx, 1 ether);
        assertEq(retrieved.active, true);
        assertEq(retrieved.allowedTargets[0], targetContract);
    }

    function testIsModuleType() public {
        assertTrue(validator.isModuleType(1));
        assertFalse(validator.isModuleType(2));
        assertFalse(validator.isModuleType(4));
    }
}
