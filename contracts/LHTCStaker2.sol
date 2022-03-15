// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./LHRCStaker.sol";

contract LHRCStaker2 is LHRCStaker {
    function name() public pure returns (string memory){
        return "v2";
    }
}