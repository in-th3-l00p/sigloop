// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

struct AgentPolicy {
    address[] allowedTargets;
    bytes4[] allowedSelectors;
    uint256 maxAmountPerTx;
    uint256 dailyLimit;
    uint256 weeklyLimit;
    uint48 validAfter;
    uint48 validUntil;
    bool active;
}
