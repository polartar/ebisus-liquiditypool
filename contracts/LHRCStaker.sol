// SPDX-License-Identifier: MIT
//Copyright Ebisusbay.com 2021
pragma solidity ^0.8.4;

import "./ILHRCStaker.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./SafePct.sol";
import "./SafeMathLite.sol";

interface ILiquidityPool {
    function getReserves() external view returns(uint256, uint256);
    function totalSupply() external view returns(uint256);
}

contract LHRCStaker is 
ILHRCStaker,
AccessControlUpgradeable,
OwnableUpgradeable, 
ReentrancyGuardUpgradeable, 
ERC1155ReceiverUpgradeable,
UUPSUpgradeable {
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
    using ERC165Checker for address;
    using SafePct for uint256;
    using SafeMathLite for uint256;

    EnumerableSetUpgradeable.AddressSet private ampliyNFTs;
    mapping(address => uint8) amplifiers;

    uint256 private constant maxNFTPerWallet = 4;
    uint256 private baseAPY;
    uint256 fee;
    uint256 constant SCALE = 10000;
    uint256 lockPeriod;

    // user => multipiedAddress => info
    mapping(address => mapping(address=> NFTInfo[])) stakedNFTs;
    mapping(address => StakeInfo) stakeInfos;
    mapping(address => BalanceHistory[]) recentBalances;
    mapping(address => BalanceHistory[]) recentLPBalances;

    address public stakeToken;
    address public lpToken;
    bytes4 public constant IID_IERC721 = type(IERC721).interfaceId;

    bytes32 public constant UPGRADER_ROLE = keccak256('UPGRADER_ROLE');

     function initialize(address _stakeToken) initializer public {
         __Ownable_init();
         __AccessControl_init();
         __ReentrancyGuard_init();
         __ERC1155Receiver_init();
         __UUPSUpgradeable_init();

         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        stakeToken = _stakeToken;
        lockPeriod = 48 hours;
        fee = 50;
        baseAPY = 20;
        initAmplifies();        
     }
    modifier onlyCorrectToken(address _token) {
        require(_token == stakeToken || _token == lpToken, "invalid token");
        _;
    }
    function initAmplifies() private {
        //testnet Barn, PONY, HORSE, Skybox
         ampliyNFTs.add(0x000732Ddc0f7208b2400944d4a7296bc001aE866);
         ampliyNFTs.add(0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e);
         ampliyNFTs.add(0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D);
         ampliyNFTs.add(0xC997749351CC4C9770f885B0147F455F5907F11A);

         amplifiers[0x000732Ddc0f7208b2400944d4a7296bc001aE866] = 2;
         amplifiers[0xEd8d78449402f44C8e9B0a38de785D0CaD73F76e] = 3;
         amplifiers[0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D] = 4;
         amplifiers[0xC997749351CC4C9770f885B0147F455F5907F11A] = 10;
        
        // //mainnet Barn, PONY, HORSE, Skybox
        //  ampliyNFTs.add(0x8449821E8334D79e455223739D41eeF55e36583e);
        //  ampliyNFTs.add(0x7d0259070B5f513CA543afb6a906d42af5884B1B);
        //  ampliyNFTs.add(0xD504ed871d33dbD4f56f523A37dceC86Ee918cb6);
        //  ampliyNFTs.add(0x96e99d6539bA2a816DEe7239DCDdC48be52835E4);

        //  amplifiers[0x8449821E8334D79e455223739D41eeF55e36583e] = 2;
        //  amplifiers[0x7d0259070B5f513CA543afb6a906d42af5884B1B] = 3;
        //  amplifiers[0xD504ed871d33dbD4f56f523A37dceC86Ee918cb6] = 4;
        //  amplifiers[0x96e99d6539bA2a816DEe7239DCDdC48be52835E4] = 10;
    }
    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADER_ROLE) override { }

    function setFee(uint256 _fee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        fee = _fee;
    }

    function setAPY(uint256 _baseAPY) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseAPY = _baseAPY;
    }

    function getAPY() external override view returns(uint256) {
        return baseAPY;
    }

    function isBoostNFT(address _nft) public override view returns(bool) {
        return ampliyNFTs.contains(_nft);
    }

    function registerAmplifyNFT(address _nft, uint8 amplifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!is721(_nft)) {
            revert("not erc721");
        }

        if (!isBoostNFT(_nft)) {
            amplifiers[_nft] = amplifier;
            ampliyNFTs.add(_nft);
        }
    }

    function removeAmplifyNFT(address _nft) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ampliyNFTs.remove(_nft);
    }

    function getAmplifyNFT(address _nft) external override view returns(uint256) {
        return amplifiers[_nft];
    }

    function getStakedNFTs(address _user, address _multipliedAddress) external override view returns(NFTInfo[] memory) {
        return stakedNFTs[_user][_multipliedAddress];
    }

    // function getCurrentRewards(address _user) external override returns(uint256) {
    //     calculatePendingRewards(_user, block.timestamp);
    //     return stakeInfos[_user].pendingRewards;
    // }
    
    function setLptoken(address _lpToken) external  onlyRole(DEFAULT_ADMIN_ROLE) {
        lpToken = _lpToken;
    }

    function getUserInfo(address _user) external view returns(StakeInfo memory) {
        return stakeInfos[_user];
    }

    function getCurrentRewards(address _user) public view override returns(uint256) {
       uint256 tokenAmplify = calculateAmplify(msg.sender, stakeToken);
       uint256 lpAmplify = calculateAmplify(msg.sender, lpToken);
       uint256 period = block.timestamp - stakeInfos[_user].lastChecked;
       uint256 pendingBalance;
       
       if (stakeInfos[_user].totalAmount > 0) {
           pendingBalance = stakeInfos[_user].totalAmount.mul(tokenAmplify).mulDiv(baseAPY, 100).mulDiv(period, 365 days);
       }
       if (stakeInfos[_user].totalLPAmount > 0) {
           (, uint256 LHRCAmount) = ILiquidityPool(lpToken).getReserves();
            uint256 lpTotal = ILiquidityPool(lpToken).totalSupply();
            // calcualte LHRC paired fro LP
            uint256 pairedAmount = LHRCAmount.mulDiv(stakeInfos[_user].totalLPAmount, lpTotal);
           pendingBalance = pendingBalance + pairedAmount.mul(lpAmplify).mulDiv(period, 365 days);
       }
       
       return pendingBalance;
    }

    function stakeNFT(address _nft, uint256 _nftId, address _multipliedAddress) external{
        require(_multipliedAddress == stakeToken || _multipliedAddress == lpToken, "invalid multipliedAddress");
        uint256 currentTime = block.timestamp;
        require(stakedNFTs[msg.sender][_multipliedAddress].length < maxNFTPerWallet, "exceed max nfts");
        require(IERC721(_nft).ownerOf(_nftId) == msg.sender, "not nft owner");
        if (!isBoostNFT(_nft)) {
            revert("not unsupported nft");
        }
        payCurrentRewards(msg.sender);
       
        NFTInfo memory nftInfo;
        nftInfo.nft = _nft;
        nftInfo.id = _nftId;
        nftInfo.stakedAt = currentTime;
        stakedNFTs[msg.sender][_multipliedAddress].push(nftInfo);
        IERC721(_nft).transferFrom(msg.sender, address(this), _nftId);
        
        emit NFTStaked(msg.sender, _nft, _nftId);
    }

    function getStakedNFTIndex(address _nft, uint256 _nftId, address _multipliedAddress) private view returns(uint256) {
        uint256 len = stakedNFTs[msg.sender][_multipliedAddress].length;
        require(len > 0, "none staked");
        
        for (uint256 i = 0; i < len; i ++) {
            if ((stakedNFTs[msg.sender][_multipliedAddress][i].nft == _nft) && (stakedNFTs[msg.sender][_multipliedAddress][i].id == _nftId)) {
                return i;
            }
        }
        return type(uint256).max;
    }

    function unstakeNFT(address _nft, uint256 _nftId, address _multipliedAddress) external {
        uint _index = getStakedNFTIndex(_nft, _nftId, _multipliedAddress);
        if (_index == type(uint256).max) {
            revert("no exists");
        }
        if (stakedNFTs[msg.sender][_multipliedAddress][_index].stakedAt + lockPeriod >= block.timestamp ) {
            revert("locked NFT");
        }
        payCurrentRewards(msg.sender);
        
        IERC721(_nft).transferFrom(address(this), msg.sender, _nftId);
        if (stakedNFTs[msg.sender][_multipliedAddress].length > 1) {
            stakedNFTs[msg.sender][_multipliedAddress][_index] = stakedNFTs[msg.sender][_multipliedAddress][stakedNFTs[msg.sender][_multipliedAddress].length - 1];
        }
        stakedNFTs[msg.sender][_multipliedAddress].pop();

        emit NFTUnStaked(msg.sender, _nft, _nftId);
    }    

    function stake(address _token, uint256 _amount) external onlyCorrectToken(_token) {
        require(_amount > 0, "invalid amount");
        require(IERC20(_token).balanceOf(msg.sender) >= _amount, "not enough funds");
        
        uint256 currentTime = block.timestamp;
        payCurrentRewards(msg.sender);

        if (_token == stakeToken) {
            stakeInfos[msg.sender].totalAmount = stakeInfos[msg.sender].totalAmount + _amount;

            BalanceHistory memory balanceHistory;
            balanceHistory.amount = _amount;
            balanceHistory.stakedAt = currentTime;
            recentBalances[msg.sender].push(balanceHistory);
            emit LHRCStaked(msg.sender, _amount);
        } else if (_token == lpToken) {
            stakeInfos[msg.sender].totalLPAmount =  stakeInfos[msg.sender].totalLPAmount + _amount;
           
            BalanceHistory memory balanceHistory;
            balanceHistory.amount = _amount;
            balanceHistory.stakedAt = currentTime;
            recentLPBalances[msg.sender].push(balanceHistory);
            emit LPStaked(msg.sender, _amount);
        }

        bool success = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        require(success);
    }

    function calculateAvailableAmount(address _address, bool isStakeToken) private {
        if (stakeInfos[_address].lastChecked + lockPeriod <= block.timestamp) {
            stakeInfos[_address].availableAmount = stakeInfos[_address].totalAmount;
            stakeInfos[_address].availableLPAmount = stakeInfos[_address].totalLPAmount;

            delete recentBalances[_address];
            delete recentLPBalances[_address];
        } else {
            if (isStakeToken) {
                uint256 len = recentBalances[_address].length;
                BalanceHistory[] storage history = recentBalances[_address];

                uint256 availableAmount = stakeInfos[_address].availableAmount;
                for (uint256 i = 0; i < len; i ++) {
                    if (history[i].stakedAt + lockPeriod <= block.timestamp) {
                        availableAmount += history[i].amount;
                    } else if( i != 0) {
                        stakeInfos[_address].availableAmount = availableAmount;
                        for (uint256 j = 0; j < len - i; j ++) {
                            history[j] = history[j + i];
                        }
                        
                        for (uint256 j = 0; j < i; j ++) {
                            history.pop();
                        }

                        return;
                    }
                    if (i == len -1) {
                        delete recentBalances[_address];
                        stakeInfos[_address].availableAmount = availableAmount;
                        return;
                    }
                }
            } else {
                uint256 len = recentLPBalances[_address].length;
                BalanceHistory[] storage history = recentLPBalances[_address];

                uint256 availableAmount = stakeInfos[_address].availableLPAmount;
                for (uint256 i = 0; i < len; i ++) {
                    if (history[i].stakedAt + lockPeriod <= block.timestamp) {
                        availableAmount += history[i].amount;
                    } else if( i != 0) {
                        stakeInfos[_address].availableLPAmount = availableAmount;
                        for (uint256 j = 0; j < len - i; j ++) {
                            history[j] = history[j + i];
                        }

                        for (uint256 j = 0; j < i; j ++) {
                            history.pop();
                        }

                        return;
                    }
                    if (i == len -1) {
                        delete recentLPBalances[_address];
                        stakeInfos[_address].availableLPAmount = availableAmount;
                        return;
                    }
                }
            }            
        }
     }

    function unstake(address _token, uint256 _amount) external onlyCorrectToken(_token) nonReentrant {
        payCurrentRewards(msg.sender);
        StakeInfo storage _user = stakeInfos[msg.sender];

        if (_token == stakeToken) {
            require(_user.totalAmount >= _amount, "not enough funds");
            calculateAvailableAmount(msg.sender, true);
            if (_user.availableAmount >= _amount) {
                _user.totalAmount = _user.totalAmount - _amount;
                _user.availableAmount = _user.availableAmount - _amount;
            } else {
                revert("token locked");
            }

            emit LHRCUnStaked(msg.sender, _amount);
        } else if (_token == lpToken) {
            require(_user.totalLPAmount >= _amount, "not enough funds");
            calculateAvailableAmount(msg.sender, false);
            if (_user.availableLPAmount >= _amount) {
                _user.totalLPAmount = _user.totalLPAmount - _amount;
                _user.availableLPAmount = _user.availableLPAmount - _amount;
            } else {
                revert("token locked");
            }

            emit LPUnStaked(msg.sender, _amount);
        }

        stakeInfos[msg.sender] = _user;

        bool success = IERC20(_token).transfer(msg.sender, _amount);
        require(success);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public virtual override returns (bytes4) {
        revert("erc1155 not accepted");
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        revert("erc1155 not accepted");
    }

    receive() external payable virtual{
        revert("can't receive cro");
    }

    function calculateAmplify(address _user, address _multipliedAddress) public view returns(uint256) {
        uint256 stakedLen = stakedNFTs[_user][_multipliedAddress].length;
        if (stakedLen == 0) {
            return 1;
        }
        NFTInfo[] memory _userNFTInfo = stakedNFTs[_user][_multipliedAddress];
        uint256 amount;

        for(uint256 i = 0; i < stakedLen; i ++) {
            address nft = _userNFTInfo[i].nft;
            amount = amount + amplifiers[nft];
        }
        return amount;
    }

    function payCurrentRewards(address _to) private {
        uint256 _rewards = getCurrentRewards(_to);

       uint256 totalBalance = IERC20(stakeToken).balanceOf(address(this));
       require(_rewards <= totalBalance, "not enough funds");
      
       uint256 amountDue = _rewards - _rewards.mulDiv(fee, SCALE);
       bool success = IERC20(stakeToken).transfer(msg.sender, amountDue);
       require(success);

       stakeInfos[msg.sender].lastChecked = block.timestamp;
    }

    function harvest() external {
       require(stakeInfos[msg.sender].lastChecked != 0, "no available");
       uint256 currentTime = block.timestamp;
       require(currentTime - stakeInfos[msg.sender].lastChecked >= lockPeriod, "already harvested");

        payCurrentRewards(msg.sender);
    }

    // OWNER
    function setLockPeriod(uint _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockPeriod = _period;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165Upgradeable,ERC1155ReceiverUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function is721(address _nft) public view returns(bool){
        return _nft.supportsInterface(IID_IERC721);
    }
}