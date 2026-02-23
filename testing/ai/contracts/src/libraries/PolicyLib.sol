// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AgentPolicy} from "../interfaces/IAgentPermission.sol";

library PolicyLib {
    function encodePolicy(AgentPolicy memory policy) internal pure returns (bytes memory) {
        return abi.encode(policy);
    }

    function decodePolicy(bytes memory data) internal pure returns (AgentPolicy memory) {
        return abi.decode(data, (AgentPolicy));
    }

    function isPolicyActive(AgentPolicy memory policy) internal view returns (bool) {
        if (!policy.active) return false;
        if (policy.validAfter > 0 && block.timestamp < policy.validAfter) return false;
        if (policy.validUntil > 0 && block.timestamp > policy.validUntil) return false;
        return true;
    }
}
