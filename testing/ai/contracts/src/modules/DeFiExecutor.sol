// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IExecutor} from "../interfaces/IERC7579Module.sol";

contract DeFiExecutor is IExecutor {
    enum ActionType { Swap, Supply, Borrow, Repay, Stake, Unstake }

    struct DeFiAction {
        ActionType actionType;
        address target;
        bytes data;
        uint256 value;
    }

    function onInstall(bytes calldata) external override {}

    function onUninstall(bytes calldata) external override {}

    function executeFromExecutor(
        address,
        bytes calldata data
    ) external override returns (bytes memory) {
        DeFiAction memory action = abi.decode(data, (DeFiAction));
        require(action.target != address(0), "DeFiExecutor: zero target");
        (bool success, bytes memory result) = action.target.call{value: action.value}(action.data);
        require(success, "DeFiExecutor: execution failed");
        return result;
    }

    function encodeSwap(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minOut
    ) external pure returns (bytes memory) {
        bytes memory swapData = abi.encodeWithSignature(
            "swap(address,address,uint256,uint256)",
            tokenIn,
            tokenOut,
            amountIn,
            minOut
        );
        DeFiAction memory action = DeFiAction({
            actionType: ActionType.Swap,
            target: router,
            data: swapData,
            value: 0
        });
        return abi.encode(action);
    }

    function encodeLending(
        address pool,
        address asset,
        uint256 amount,
        bool isSupply
    ) external pure returns (bytes memory) {
        bytes memory lendData;
        if (isSupply) {
            lendData = abi.encodeWithSignature("supply(address,uint256)", asset, amount);
        } else {
            lendData = abi.encodeWithSignature("borrow(address,uint256)", asset, amount);
        }
        DeFiAction memory action = DeFiAction({
            actionType: isSupply ? ActionType.Supply : ActionType.Borrow,
            target: pool,
            data: lendData,
            value: 0
        });
        return abi.encode(action);
    }

    function isModuleType(uint256 typeId) external pure override returns (bool) {
        return typeId == 2;
    }
}
