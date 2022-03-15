// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MockERC721 is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIdCounter;

    constructor () ERC721 ("TEST721", "TT") {
    }

    function mint(address _sender) public onlyOwner {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _mint(_sender, tokenId);
    }
}