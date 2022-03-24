// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor (string memory _symbol, string memory _name) ERC20 (_symbol, _name) {
        _mint(msg.sender, 1000000000000 * 10 ** 18);
    }
}