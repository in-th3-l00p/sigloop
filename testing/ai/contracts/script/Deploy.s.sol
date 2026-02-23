// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/modules/AgentPermissionValidator.sol";
import "../src/modules/SpendingLimitHook.sol";
import "../src/modules/X402PaymentPolicy.sol";
import "../src/modules/DeFiExecutor.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        AgentPermissionValidator validator = new AgentPermissionValidator();
        SpendingLimitHook spendingHook = new SpendingLimitHook();
        X402PaymentPolicy paymentPolicy = new X402PaymentPolicy();
        DeFiExecutor defiExecutor = new DeFiExecutor();

        console.log("AgentPermissionValidator:", address(validator));
        console.log("SpendingLimitHook:", address(spendingHook));
        console.log("X402PaymentPolicy:", address(paymentPolicy));
        console.log("DeFiExecutor:", address(defiExecutor));

        vm.stopBroadcast();
    }
}
