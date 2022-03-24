// SPDX-License-Identifier: UNLICENSED
//Copyright Ebisusbay.com 2021
pragma solidity ^0.8.4;

import "./ILHRCStaker.sol";

// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155ReceiverUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./SafePct.sol";
import "./SafeMathLite.sol";


contract Rewards {
    struct BalanceHistory {
        uint256 amount;
        uint256 stakedAt;
    }
    struct StakeInfo {
        uint256 totalAmount;
        uint256 totalLPAmount;
        uint256 pendingRewards;
        uint256 lastChecked;
        uint256 availableAmount;
        uint256 availableLPAmount;
    }

    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafePct for uint256;
    using SafeMathLite for uint256;

    EnumerableSetUpgradeable.AddressSet ampliyNFTs;
    mapping(address => uint8) amplifiers;

    uint256 public baseAPY;
    uint256 lockPeriod;

    EnumerableSetUpgradeable.AddressSet stakers;    
    mapping(address => NFTInfo[]) stakedNFTs;
    mapping(address => StakeInfo) stakeInfos;
    mapping(address => BalanceHistory[]) recentBalances;
    mapping(address => BalanceHistory[]) recentLPBalances;

    address stakeToken;
    address lpToken;
    uint256 totalBalance;
    uint256 totalLPBalance;

    function initAmplifies() private {
        //testnet Barn, PONY, HORSE, Skybox
         ampliyNFTs.add(0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e);
         ampliyNFTs.add(0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e);
         ampliyNFTs.add(0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e);
         ampliyNFTs.add(0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D);

         amplifiers[0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e] = 2;
         amplifiers[0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e] = 3;
         amplifiers[0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D] = 4;
         amplifiers[0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D] = 10;
    }
    
    function calculatePendingRewards(address _user) private {
       uint256 amplify = calculateAmplify(msg.sender);

       uint256 currentTime = block.timestamp;

       uint256 period = currentTime - stakeInfos[_user].lastChecked;
       uint256 pendingBalance;
       if (stakeInfos[_user].totalAmount > 0) {
           pendingBalance = stakeInfos[_user].totalAmount .mul(amplify).mulDiv(baseAPY, 100).mulDiv(period, 365 days);
       }
       if (stakeInfos[_user].totalLPAmount > 0) {
           pendingBalance = pendingBalance + stakeInfos[_user].totalLPAmount.mul(amplify).mulDiv(period, 365 days);
       }
       stakeInfos[_user].pendingRewards = stakeInfos[_user].pendingRewards + pendingBalance;
       stakeInfos[_user].lastChecked = currentTime;       
    }

    // function getStakedNFTIndex(address _nft, uint256 _nftId) private view returns(uint256) {
    //     uint256 len = stakedNFTs[msg.sender].length;
    //     require(len > 0, "none staked");
        
    //     for (uint256 i = 0; i < len; i ++) {
    //         if ((stakedNFTs[msg.sender][i].nft == _nft) && (stakedNFTs[msg.sender][i].id == _nftId)) {
    //             if (stakedNFTs[msg.sender][i].stakedAt + lockPeriod >= block.timestamp ) {
    //                 revert("NFT is locked");
    //             }
    //             return i;
    //         }
    //     }
    //     return type(uint256).max;
    // }

    function calculateAvailableAmount(address _address, bool isStakeToken) private {
        if (isStakeToken) {
            if (stakeInfos[_address].lastChecked + lockPeriod <= block.timestamp) {
                stakeInfos[_address].availableAmount = stakeInfos[_address].totalAmount;
                delete recentBalances[_address];
            } else {
                uint256 len = recentBalances[_address].length;
                BalanceHistory[] memory history = recentBalances[_address];

                uint256 availableAmount = stakeInfos[_address].availableAmount;
                for (uint256 i = 0; i < len; i ++) {
                    if (history[i].stakedAt + lockPeriod <= block.timestamp) {
                        availableAmount += history[i].amount;
                    } else if( i != 0) {
                        stakeInfos[_address].availableAmount = availableAmount;
                        for (uint256 j = 0; j < len - i; j ++) {
                            history[j] = history[j + i];
                        }
                        return;
                    } else {
                        stakeInfos[_address].availableAmount = availableAmount;
                        return;
                    }
                }
            }
        }
    }

    function calculateAmplify(address _user) private view returns(uint256) {
        uint256 stakedLen = stakedNFTs[_user].length;
        if (stakedLen == 0) {
            return 1;
        }
        NFTInfo[] memory _userNFTInfo = stakedNFTs[_user];
        uint256 amount;

        for(uint256 i = 0; i < stakedLen; i ++) {
            address nft = _userNFTInfo[i].nft;
            amount = amount + amplifiers[nft];
        }
        return amount;
    }

    function harvest() external {
       require(stakeInfos[msg.sender].lastChecked != 0, "no available");
       require(block.timestamp - stakeInfos[msg.sender].lastChecked >= lockPeriod, "already harvested");

       calculatePendingRewards(msg.sender);

       uint256 _pendingRewards = stakeInfos[msg.sender].pendingRewards;
       require(_pendingRewards <= totalBalance, "not enough funds");
       totalBalance = totalBalance - _pendingRewards;
       bool success = IERC20(stakeToken).transfer(msg.sender, _pendingRewards);
       require(success);

       stakeInfos[msg.sender].pendingRewards = 0;
       stakeInfos[msg.sender].lastChecked = block.timestamp;
    }
}