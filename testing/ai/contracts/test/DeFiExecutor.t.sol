// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/modules/DeFiExecutor.sol";

contract MockRouter {
    event SwapExecuted(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut);

    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external returns (bool) {
        emit SwapExecuted(tokenIn, tokenOut, amountIn, minOut);
        return true;
    }
}

contract MockPool {
    event SupplyExecuted(address asset, uint256 amount);
    event BorrowExecuted(address asset, uint256 amount);

    function supply(address asset, uint256 amount) external returns (bool) {
        emit SupplyExecuted(asset, amount);
        return true;
    }

    function borrow(address asset, uint256 amount) external returns (bool) {
        emit BorrowExecuted(asset, amount);
        return true;
    }
}

contract DeFiExecutorTest is Test {
    DeFiExecutor public executor;
    MockRouter public router;
    MockPool public pool;
    address public tokenA;
    address public tokenB;

    function setUp() public {
        executor = new DeFiExecutor();
        router = new MockRouter();
        pool = new MockPool();
        tokenA = address(0xA);
        tokenB = address(0xB);
    }

    function testEncodeAndExecuteSwap() public {
        bytes memory encoded = executor.encodeSwap(
            address(router),
            tokenA,
            tokenB,
            1 ether,
            0.9 ether
        );

        bytes memory result = executor.executeFromExecutor(address(this), encoded);
        bool success = abi.decode(result, (bool));
        assertTrue(success);
    }

    function testEncodeLendingSupply() public {
        bytes memory encoded = executor.encodeLending(
            address(pool),
            tokenA,
            1 ether,
            true
        );

        bytes memory result = executor.executeFromExecutor(address(this), encoded);
        bool success = abi.decode(result, (bool));
        assertTrue(success);
    }

    function testEncodeLendingBorrow() public {
        bytes memory encoded = executor.encodeLending(
            address(pool),
            tokenA,
            0.5 ether,
            false
        );

        bytes memory result = executor.executeFromExecutor(address(this), encoded);
        bool success = abi.decode(result, (bool));
        assertTrue(success);
    }

    function testZeroTargetReverts() public {
        DeFiExecutor.DeFiAction memory action = DeFiExecutor.DeFiAction({
            actionType: DeFiExecutor.ActionType.Swap,
            target: address(0),
            data: "",
            value: 0
        });
        bytes memory encoded = abi.encode(action);

        vm.expectRevert("DeFiExecutor: zero target");
        executor.executeFromExecutor(address(this), encoded);
    }

    function testExecutionWithBadCallReverts() public {
        DeFiExecutor.DeFiAction memory action = DeFiExecutor.DeFiAction({
            actionType: DeFiExecutor.ActionType.Swap,
            target: address(router),
            data: abi.encodeWithSignature("nonExistentFunction()"),
            value: 0
        });
        bytes memory encoded = abi.encode(action);

        vm.expectRevert("DeFiExecutor: execution failed");
        executor.executeFromExecutor(address(this), encoded);
    }

    function testIsModuleType() public {
        assertTrue(executor.isModuleType(2));
        assertFalse(executor.isModuleType(1));
        assertFalse(executor.isModuleType(4));
    }
}
