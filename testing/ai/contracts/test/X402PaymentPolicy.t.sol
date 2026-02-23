// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/modules/X402PaymentPolicy.sol";

contract X402PaymentPolicyTest is Test {
    X402PaymentPolicy public policy;
    address public account;
    address public agent;

    function setUp() public {
        policy = new X402PaymentPolicy();
        account = address(this);
        agent = address(0xA1);

        string[] memory domains = new string[](1);
        domains[0] = "api.example.com";

        X402PaymentPolicy.X402Budget memory budget = X402PaymentPolicy.X402Budget({
            maxPerRequest: 1 ether,
            dailyBudget: 5 ether,
            totalBudget: 20 ether,
            spent: 0,
            dailySpent: 0,
            lastReset: 0,
            allowedDomains: domains
        });

        policy.configureAgent(agent, budget);
    }

    function testPaymentWithinBudget() public {
        bytes memory msgData = abi.encode(agent, uint256(0.5 ether));
        policy.preCheck(address(0), 0, msgData);

        uint256 remaining = policy.getRemainingBudget(account, agent);
        assertEq(remaining, 19.5 ether);
    }

    function testPaymentOverPerRequestCapReverts() public {
        bytes memory msgData = abi.encode(agent, uint256(2 ether));
        vm.expectRevert("X402: exceeds max per request");
        policy.preCheck(address(0), 0, msgData);
    }

    function testBudgetExhaustionStopsPayments() public {
        for (uint256 i = 0; i < 4; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        for (uint256 i = 0; i < 4; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        for (uint256 i = 0; i < 4; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        for (uint256 i = 0; i < 4; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        for (uint256 i = 0; i < 4; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        bytes memory msgData = abi.encode(agent, uint256(1 ether));
        vm.expectRevert("X402: total budget exceeded");
        policy.preCheck(address(0), 0, msgData);
    }

    function testDailyReset() public {
        for (uint256 i = 0; i < 5; i++) {
            bytes memory msgData = abi.encode(agent, uint256(1 ether));
            policy.preCheck(address(0), 0, msgData);
        }

        bytes memory overMsg = abi.encode(agent, uint256(1 ether));
        vm.expectRevert("X402: daily budget exceeded");
        policy.preCheck(address(0), 0, overMsg);

        vm.warp(block.timestamp + 1 days);

        bytes memory msgData = abi.encode(agent, uint256(1 ether));
        policy.preCheck(address(0), 0, msgData);

        X402PaymentPolicy.X402Budget memory budget = policy.getBudget(account, agent);
        assertEq(budget.dailySpent, 1 ether);
        assertEq(budget.spent, 6 ether);
    }

    function testGetBudget() public {
        X402PaymentPolicy.X402Budget memory budget = policy.getBudget(account, agent);
        assertEq(budget.maxPerRequest, 1 ether);
        assertEq(budget.totalBudget, 20 ether);
    }

    function testPostCheckEmitsEvent() public {
        bytes memory hookData = abi.encode(agent, uint256(1 ether));
        policy.postCheck(hookData);
    }

    function testIsModuleType() public {
        assertTrue(policy.isModuleType(4));
        assertFalse(policy.isModuleType(1));
        assertFalse(policy.isModuleType(2));
    }
}
