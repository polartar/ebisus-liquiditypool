// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC1155ReceiverUpgradeable.sol";

struct NFTInfo {
    address nft;
    uint256 id;
    uint256 stakedAt;
}
interface ILHRCStaker is IERC1155ReceiverUpgradeable {

    /**
     * @dev Emitted when `staker` adds stakes
     */
    event LHRCStaked(address indexed staker, uint256 totalStaked);
    event LHRCUnStaked(address indexed staker, uint256 totalStaked);
    event LPUnStaked(address indexed staker, uint256 totalStaked);
    event LPStaked(address indexed staker, uint256 totalStaked);
    event NFTStaked(address indexed staker, address nft, uint256 nftId);
    event NFTUnStaked(address indexed staker, address nft, uint256 nftId);

    function isBoostNFT(address _nft) external returns(bool);
    function getAmplifyNFT(address _nft) external returns(uint256);
    function getCurrentRewards(address _user) external view returns(uint256);
    function getAPY() external returns(uint256);
    function getStakedNFTs(address _user, address _multipliedAddress) external returns(NFTInfo[] memory);
}