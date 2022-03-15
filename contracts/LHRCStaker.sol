// SPDX-License-Identifier: UNLICENSED
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
// import "./RewardsPool.sol";
import "hardhat/console.sol";


contract LHRCStaker is 
ILHRCStaker,
AccessControlUpgradeable,
OwnableUpgradeable, 
ReentrancyGuardUpgradeable, 
ERC1155ReceiverUpgradeable,
UUPSUpgradeable {
    struct USER {
        uint256 balance;
        uint256 lpBalance;
        uint256 pendingRewards;
        uint256 lastChecked;
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

    EnumerableSetUpgradeable.AddressSet private stakers;    
    mapping(address => NFTInfo[]) stakedNFTs;
    mapping(address => USER) users;

    address stakeToken;
    address lpToken;
    uint256 balance;
    uint256 lpBalance;
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
        fee = 500;
        baseAPY = 20;
        initAmplifies();        
     }
    modifier onlyCorrectToken(address _token) {
        require(_token == stakeToken || _token == lpToken, "invalid token");
        _;
    }
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

    function getStakedNFTs(address _user) external override view returns(NFTInfo[] memory) {
        return stakedNFTs[_user];
    }

    function getCurrentRewards(address _user) external override returns(uint256) {
        calculatePendingRewards(_user);
        return users[_user].pendingRewards;
    }

    function calculatePendingRewards(address _user) private {
       uint256 amplify = calculateAmplify(msg.sender);

       uint256 currentTime = block.timestamp;

       uint256 period = currentTime - users[_user].lastChecked;
       uint256 pendingBalance;
       if (users[_user].balance > 0) {
           pendingBalance = users[_user].balance .mul(amplify).mulDiv(baseAPY, 100).mulDiv(period, 365 days);
           console.log("perid", period );
           console.log("pendingbalance", pendingBalance);
       }
       if (users[_user].lpBalance > 0) {
           pendingBalance = pendingBalance + users[_user].lpBalance.mul(amplify).mulDiv(period, 365 days);
       }
       users[_user].pendingRewards = users[_user].pendingRewards + pendingBalance;
       users[_user].lastChecked = currentTime;       
    }

    function stakeNFT(address _nft, uint256 _nftId) external{
        require(stakedNFTs[msg.sender].length < maxNFTPerWallet, "exceed max nfts");
        require(IERC721(_nft).ownerOf(_nftId) == msg.sender, "not nft owner");
        if (!isBoostNFT(_nft)) {
            revert("not unsupported nft");
        }
        calculatePendingRewards(msg.sender);
       
        NFTInfo memory nftInfo;
        nftInfo.nft = _nft;
        nftInfo.id = _nftId;
        stakedNFTs[msg.sender].push(nftInfo);
        IERC721(_nft).transferFrom(msg.sender, address(this), _nftId);
        
        emit NFTStaked(msg.sender, _nft, _nftId);
    }

    function getStakedNFTIndex(address _nft, uint256 _nftId) private view returns(uint256) {
        uint256 len = stakedNFTs[msg.sender].length;
        require(len > 0, "none staked");
        
        for (uint256 i = 0; i < len; i ++) {
            if ((stakedNFTs[msg.sender][i].nft == _nft) && (stakedNFTs[msg.sender][i].id == _nftId)) {
                return i;
            }
        }
        return type(uint256).max;
    }

    function unstakeNFT(address _nft, uint256 _nftId) external {
        uint _index = getStakedNFTIndex(_nft, _nftId);

        if (_index == type(uint256).max) {
            revert("no exists");
        }
        calculatePendingRewards(msg.sender);
        
        IERC721(_nft).transferFrom(address(this), msg.sender, _nftId);
        if (stakedNFTs[msg.sender].length > 1) {
            stakedNFTs[msg.sender][_index] = stakedNFTs[msg.sender][stakedNFTs[msg.sender].length - 1];
        }
        stakedNFTs[msg.sender].pop();

        emit NFTUnStaked(msg.sender, _nft, _nftId);
    }

    function setLptoken(address _lpToken) external  onlyRole(DEFAULT_ADMIN_ROLE) {
        lpToken = _lpToken;
    }

    function getUserInfo(address _user) external view returns(USER memory) {
        return users[_user];
    }

    function stake(address _token, uint256 _amount) external onlyCorrectToken(_token) {
        require(_amount > 0, "invalid amount");
        require(IERC20(_token).balanceOf(msg.sender) >= _amount, "not enough funds");
        
        stakers.add(msg.sender);
        calculatePendingRewards(msg.sender);

        if (_token == stakeToken) {
            users[msg.sender].balance = users[msg.sender].balance + _amount;
            balance = balance + _amount;
            emit LHRCStaked(msg.sender, _amount);
        } else if (_token == lpToken) {
            users[msg.sender].lpBalance =  users[msg.sender].lpBalance + _amount;
            lpBalance = lpBalance + _amount;
            
            emit LPStaked(msg.sender, _amount);
        }

        bool success = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        require(success);
    }

    function unstake(address _token, uint256 _amount) external onlyCorrectToken(_token) nonReentrant {
        calculatePendingRewards(msg.sender);
        USER memory _user = users[msg.sender];

        uint256 amountDue = _amount - _amount.mulDiv(fee, SCALE);
        if (_token == stakeToken) {
            require(_user.balance >= _amount, "not enough funds");
            _user.balance = _user.balance - _amount;

            emit LHRCUnStaked(msg.sender, _amount);
        } else if (_token == lpToken) {
            require(_user.lpBalance >= _amount, "not enough funds");
            _user.lpBalance = _user.lpBalance - _amount;

            emit LPUnStaked(msg.sender, _amount);
        }

        users[msg.sender] = _user;
        bool success = IERC20(_token).transfer(msg.sender, amountDue);
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

    function calculateAmplify(address _user) public view returns(uint256) {
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
       require(users[msg.sender].lastChecked != 0, "no available");
       require(block.timestamp - users[msg.sender].lastChecked >= lockPeriod, "already harvested");

       calculatePendingRewards(msg.sender);
       console.log(balance);
       uint256 _pendingRewards = users[msg.sender].pendingRewards;
       require(_pendingRewards <= balance, "not enough funds");
       balance = balance - _pendingRewards;
       bool success = IERC20(stakeToken).transfer(msg.sender, _pendingRewards);
       require(success);

       users[msg.sender].pendingRewards = 0;
       users[msg.sender].lastChecked = block.timestamp;
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