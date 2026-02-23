// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/modules/SpendingLimitHook.sol";
import {SpendingRecord} from "../src/libraries/SpendingLib.sol";

contract SpendingLimitHookTest is Test {
    SpendingLimitHook public hook;
    address public account;
    address public agent;
    address public token;

    function setUp() public {
        hook = new SpendingLimitHook();
        account = address(this);
        agent = address(0xA1);
        token = address(0x7040);
        hook.setLimits(agent, token, 10 ether, 50 ether);
    }

    function testSpendWithinLimits() public {
        bytes memory msgData = abi.encode(agent, token, 5 ether);
        hook.preCheck(address(0), 0, msgData);

        SpendingRecord memory record = hook.getSpending(account, agent, token);
        assertEq(record.dailySpent, 5 ether);
        assertEq(record.weeklySpent, 5 ether);
    }

    function testSpendOverDailyLimitReverts() public {
        bytes memory msgData = abi.encode(agent, token, 5 ether);
        hook.preCheck(address(0), 0, msgData);

        bytes memory msgData2 = abi.encode(agent, token, 6 ether);
        vm.expectRevert("SpendingLib: daily limit exceeded");
        hook.preCheck(address(0), 0, msgData2);
    }

    function testDailyResetWorks() public {
        bytes memory msgData = abi.encode(agent, token, 9 ether);
        hook.preCheck(address(0), 0, msgData);

        vm.warp(block.timestamp + 1 days);

        bytes memory msgData2 = abi.encode(agent, token, 9 ether);
        hook.preCheck(address(0), 0, msgData2);

        SpendingRecord memory record = hook.getSpending(account, agent, token);
        assertEq(record.dailySpent, 9 ether);
    }

    function testWeeklyLimitTracking() public {
        for (uint256 i = 0; i < 5; i++) {
            bytes memory msgData = abi.encode(agent, token, 9 ether);
            hook.preCheck(address(0), 0, msgData);
            vm.warp(block.timestamp + 1 days);
        }

        bytes memory msgData = abi.encode(agent, token, 6 ether);
        vm.expectRevert("SpendingLib: weekly limit exceeded");
        hook.preCheck(address(0), 0, msgData);
    }

    function testResetSpending() public {
        bytes memory msgData = abi.encode(agent, token, 5 ether);
        hook.preCheck(address(0), 0, msgData);

        hook.resetSpending(agent, token);

        SpendingRecord memory record = hook.getSpending(account, agent, token);
        assertEq(record.dailySpent, 0);
        assertEq(record.weeklySpent, 0);
    }

    function testPostCheckEmitsEvent() public {
        bytes memory hookData = abi.encode(agent, token, 5 ether);
        hook.postCheck(hookData);
    }

    function testIsModuleType() public {
        assertTrue(hook.isModuleType(4));
        assertFalse(hook.isModuleType(1));
    }
}
