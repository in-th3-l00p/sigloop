// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IValidator, PackedUserOperation} from "../interfaces/IERC7579Module.sol";
import {AgentPolicy} from "../interfaces/IAgentPermission.sol";
import {PolicyLib} from "../libraries/PolicyLib.sol";

contract AgentPermissionValidator is IValidator {
    using PolicyLib for AgentPolicy;

    mapping(address => mapping(address => AgentPolicy)) private _policies;

    function onInstall(bytes calldata data) external override {
        (address agent, AgentPolicy memory policy) = abi.decode(data, (address, AgentPolicy));
        _setPolicy(msg.sender, agent, policy);
    }

    function onUninstall(bytes calldata data) external override {
        address agent = abi.decode(data, (address));
        delete _policies[msg.sender][agent];
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external override returns (uint256) {
        bytes calldata sig = userOp.signature;
        if (sig.length < 85) return 1;

        address agent = address(bytes20(sig[0:20]));
        bytes memory ecdsaSig = sig[20:85];

        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(ecdsaSig);
        address recovered = ecrecover(ethHash, v, r, s);
        if (recovered != agent) return 1;

        AgentPolicy storage policy = _policies[userOp.sender][agent];

        if (!policy.isPolicyActive()) return 1;

        if (userOp.callData.length >= 4) {
            bytes4 selector = bytes4(userOp.callData[0:4]);
            if (userOp.callData.length >= 36) {
                address target = abi.decode(userOp.callData[4:36], (address));
                if (!_isTargetAllowed(policy, target)) return 1;
            }
            if (!_isSelectorAllowed(policy, selector)) return 1;
        }

        if (userOp.callData.length >= 68) {
            uint256 value = abi.decode(userOp.callData[36:68], (uint256));
            if (value > policy.maxAmountPerTx) return 1;
        }

        return 0;
    }

    function addAgent(address agent, AgentPolicy calldata policy) external {
        _setPolicy(msg.sender, agent, policy);
    }

    function removeAgent(address agent) external {
        delete _policies[msg.sender][agent];
    }

    function getPolicy(address account, address agent) external view returns (AgentPolicy memory) {
        return _policies[account][agent];
    }

    function isModuleType(uint256 typeId) external pure override returns (bool) {
        return typeId == 1;
    }

    function _setPolicy(address account, address agent, AgentPolicy memory policy) internal {
        AgentPolicy storage stored = _policies[account][agent];
        stored.allowedTargets = policy.allowedTargets;
        stored.allowedSelectors = policy.allowedSelectors;
        stored.maxAmountPerTx = policy.maxAmountPerTx;
        stored.dailyLimit = policy.dailyLimit;
        stored.weeklyLimit = policy.weeklyLimit;
        stored.validAfter = policy.validAfter;
        stored.validUntil = policy.validUntil;
        stored.active = policy.active;
    }

    function _isTargetAllowed(AgentPolicy storage policy, address target) internal view returns (bool) {
        if (policy.allowedTargets.length == 0) return true;
        for (uint256 i = 0; i < policy.allowedTargets.length; i++) {
            if (policy.allowedTargets[i] == target) return true;
        }
        return false;
    }

    function _isSelectorAllowed(AgentPolicy storage policy, bytes4 selector) internal view returns (bool) {
        if (policy.allowedSelectors.length == 0) return true;
        for (uint256 i = 0; i < policy.allowedSelectors.length; i++) {
            if (policy.allowedSelectors[i] == selector) return true;
        }
        return false;
    }

    function _splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
