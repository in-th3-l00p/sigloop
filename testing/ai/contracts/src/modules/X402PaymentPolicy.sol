// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IHook} from "../interfaces/IERC7579Module.sol";

contract X402PaymentPolicy is IHook {
    struct X402Budget {
        uint256 maxPerRequest;
        uint256 dailyBudget;
        uint256 totalBudget;
        uint256 spent;
        uint256 dailySpent;
        uint256 lastReset;
        string[] allowedDomains;
    }

    mapping(address => mapping(address => X402Budget)) private _budgets;

    event PaymentRecorded(address indexed account, address indexed agent, uint256 amount);

    function onInstall(bytes calldata data) external override {
        (address agent, uint256 maxPerRequest, uint256 dailyBudget, uint256 totalBudget, string[] memory domains) =
            abi.decode(data, (address, uint256, uint256, uint256, string[]));
        X402Budget storage budget = _budgets[msg.sender][agent];
        budget.maxPerRequest = maxPerRequest;
        budget.dailyBudget = dailyBudget;
        budget.totalBudget = totalBudget;
        budget.spent = 0;
        budget.dailySpent = 0;
        budget.lastReset = block.timestamp / 1 days;
        budget.allowedDomains = domains;
    }

    function onUninstall(bytes calldata data) external override {
        address agent = abi.decode(data, (address));
        delete _budgets[msg.sender][agent];
    }

    function configureAgent(address agent, X402Budget memory budget) external {
        X402Budget storage stored = _budgets[msg.sender][agent];
        stored.maxPerRequest = budget.maxPerRequest;
        stored.dailyBudget = budget.dailyBudget;
        stored.totalBudget = budget.totalBudget;
        stored.spent = budget.spent;
        stored.dailySpent = budget.dailySpent;
        stored.lastReset = block.timestamp / 1 days;
        stored.allowedDomains = budget.allowedDomains;
    }

    function preCheck(
        address,
        uint256,
        bytes calldata msgData
    ) external override returns (bytes memory) {
        if (msgData.length < 64) return abi.encode(address(0), uint256(0));

        (address agent, uint256 amount) = abi.decode(msgData, (address, uint256));
        X402Budget storage budget = _budgets[msg.sender][agent];

        require(amount <= budget.maxPerRequest, "X402: exceeds max per request");

        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > budget.lastReset) {
            budget.dailySpent = 0;
            budget.lastReset = currentDay;
        }

        require(budget.dailySpent + amount <= budget.dailyBudget, "X402: daily budget exceeded");
        require(budget.spent + amount <= budget.totalBudget, "X402: total budget exceeded");

        budget.dailySpent += amount;
        budget.spent += amount;

        return abi.encode(agent, amount);
    }

    function postCheck(bytes calldata hookData) external override {
        (address agent, uint256 amount) = abi.decode(hookData, (address, uint256));
        emit PaymentRecorded(msg.sender, agent, amount);
    }

    function getBudget(address account, address agent) external view returns (X402Budget memory) {
        return _budgets[account][agent];
    }

    function getRemainingBudget(address account, address agent) external view returns (uint256) {
        X402Budget storage budget = _budgets[account][agent];
        if (budget.spent >= budget.totalBudget) return 0;
        return budget.totalBudget - budget.spent;
    }

    function isModuleType(uint256 typeId) external pure override returns (bool) {
        return typeId == 4;
    }
}
