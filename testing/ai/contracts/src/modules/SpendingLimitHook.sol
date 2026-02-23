// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IHook} from "../interfaces/IERC7579Module.sol";
import {SpendingRecord, SpendingLib} from "../libraries/SpendingLib.sol";

contract SpendingLimitHook is IHook {
    using SpendingLib for SpendingRecord;

    mapping(address => mapping(address => mapping(address => SpendingRecord))) private _records;
    mapping(address => mapping(address => mapping(address => uint256))) private _dailyLimits;
    mapping(address => mapping(address => mapping(address => uint256))) private _weeklyLimits;

    event SpendingRecorded(address indexed account, address indexed agent, address indexed token, uint256 amount);

    function onInstall(bytes calldata data) external override {
        (address agent, address token, uint256 dailyLimit, uint256 weeklyLimit) =
            abi.decode(data, (address, address, uint256, uint256));
        _dailyLimits[msg.sender][agent][token] = dailyLimit;
        _weeklyLimits[msg.sender][agent][token] = weeklyLimit;
    }

    function onUninstall(bytes calldata data) external override {
        (address agent, address token) = abi.decode(data, (address, address));
        delete _records[msg.sender][agent][token];
        delete _dailyLimits[msg.sender][agent][token];
        delete _weeklyLimits[msg.sender][agent][token];
    }

    function preCheck(
        address msgSender,
        uint256,
        bytes calldata msgData
    ) external override returns (bytes memory) {
        if (msgData.length < 96) return abi.encode(msgSender, address(0), uint256(0));

        (address agent, address token, uint256 amount) = abi.decode(msgData, (address, address, uint256));

        uint256 dailyLimit = _dailyLimits[msg.sender][agent][token];
        uint256 weeklyLimit = _weeklyLimits[msg.sender][agent][token];

        if (dailyLimit > 0 || weeklyLimit > 0) {
            _records[msg.sender][agent][token].checkAndUpdateSpending(amount, dailyLimit, weeklyLimit);
        }

        return abi.encode(agent, token, amount);
    }

    function postCheck(bytes calldata hookData) external override {
        (address agent, address token, uint256 amount) = abi.decode(hookData, (address, address, uint256));
        emit SpendingRecorded(msg.sender, agent, token, amount);
    }

    function setLimits(address agent, address token, uint256 dailyLimit, uint256 weeklyLimit) external {
        _dailyLimits[msg.sender][agent][token] = dailyLimit;
        _weeklyLimits[msg.sender][agent][token] = weeklyLimit;
    }

    function getSpending(address account, address agent, address token) external view returns (SpendingRecord memory) {
        return _records[account][agent][token];
    }

    function resetSpending(address agent, address token) external {
        delete _records[msg.sender][agent][token];
    }

    function isModuleType(uint256 typeId) external pure override returns (bool) {
        return typeId == 4;
    }
}
