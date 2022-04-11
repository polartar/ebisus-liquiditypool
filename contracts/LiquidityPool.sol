// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./SafeMathLite.sol";
import "./SafePct.sol";
import "hardhat/console.sol";

contract LiquidityPool is ERC20, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMathLite for uint256;
    using SafePct for uint256;

    IERC20 public tokenTwo;
    uint256 public basisFee;

    uint256 public tokenOneCnt;
    uint256 public tokenTwoCnt;

    EnumerableSet.AddressSet private addressArray;

    mapping(address => uint256) public tokenOneFees;
    mapping(address => uint256) public tokenTwoFees;

    uint256 constant scale = 10 ** 9;

    // Events
    event NewPool(address _address, uint256 tokens);
    event NewLiquidity(address _address);
    event LessLiquidity(address _address);
    event SwapDone(address _address);

    constructor(
        address tokenAddrTwo,
        uint256 _basisFee
    ) ERC20("Layzy-Cro", "LazyHorse LP") {
        tokenTwo = IERC20(tokenAddrTwo);
        basisFee = _basisFee;
    }

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function initPool(uint256 tTwoAmt) public onlyOwner payable {
        require(totalSupply() == 0, "already initialized pool");
        require(msg.value != 0 && tTwoAmt !=0 , "can't zero amount");

        require(
            tokenTwo.allowance(msg.sender, address(this)) >= tTwoAmt,
            "not enough allowance"
        );
        tokenTwo.transferFrom(msg.sender, address(this), tTwoAmt);
 
        tokenOneCnt = msg.value;
        tokenTwoCnt = tokenTwo.balanceOf(address(this));

        addressArray.add(msg.sender);
        uint256 lpAmount = sqrt(tokenOneCnt.mul(tTwoAmt));
        _mint(msg.sender, lpAmount);

        emit NewPool(msg.sender, lpAmount);
    }

    function getRate() public view returns(uint256) {
        return tokenOneCnt * scale / tokenTwoCnt ;
    }

    function addLiquidity(uint256 tTwoAmt) public payable {
        require(
            tokenTwo.allowance(msg.sender, address(this)) >= tTwoAmt,
            "not enough allowance token2"
        );
        require(msg.value != 0 && tTwoAmt != 0, "need non-zero values");
        uint256 rate = getRate();
        
        if (scale * msg.value != rate * tTwoAmt) {
            revert("amounts not matched");
        }

        tokenTwo.transferFrom(msg.sender, address(this), tTwoAmt);
        tokenOneCnt = tokenOneCnt.add(msg.value);
        tokenTwoCnt = tokenTwoCnt.add(tTwoAmt);
        uint256 lpAmount = sqrt(msg.value.mul(tTwoAmt));
        
        addressArray.add(msg.sender);
        
        _mint(msg.sender, lpAmount);
        emit NewLiquidity(msg.sender);
    }

    // 0 to 100 is a invariant -- percent of holdings
    function removeLiquidity(uint256 percent) external {
        require(0 < percent && percent <= 100, "invalid removal percent");
        uint256 balance = balanceOf(msg.sender);

        require(balance > 0, "no stake in the pool");

        uint256 payout = balance.mulDiv(percent, 100);
        uint256 tokenOnePayout = tokenOneCnt.mulDiv(payout, totalSupply());
        uint256 tokenTwoPayout = tokenTwoCnt.mulDiv(payout, totalSupply());

        _burn(msg.sender, payout);

        (bool success, ) = payable(msg.sender).call{value: tokenOnePayout}("");
        require(success, "Transfer failed.");
        tokenTwo.transfer(msg.sender, tokenTwoPayout);

        tokenOneCnt = tokenOneCnt.sub(tokenOnePayout);
        tokenTwoCnt = tokenTwoCnt.sub(tokenTwoPayout);

        if (percent == 100) {
            addressArray.remove(msg.sender);
        }
        emit LessLiquidity(msg.sender);
    }

    function swapOutOne() public payable {
        uint256 tokenAmtOne = msg.value;
        require(tokenAmtOne > 0, "invalid quantity");
        
        uint256 fee = tokenAmtOne.mulDiv(basisFee, 10000);
        uint256 swapIn = tokenAmtOne.sub(fee);
        uint256 rate = getRate();
        uint256 tokenOut = swapIn.div(rate).div(scale);

        if (tokenOut > tokenTwoCnt) {
            revert("not enough funds");
        }
        tokenTwo.transfer(msg.sender, tokenOut);
        tokenOneCnt = tokenOneCnt.add(swapIn);
        tokenTwoCnt = tokenTwoCnt.sub(tokenOut);

        uint256 addressLen = addressArray.length();
        // fee aggregate
        for (uint256 i = 0; i < addressLen; i++) {
            address toAdd = addressArray.at(i);
            uint256 liqTokens = balanceOf(toAdd);
            tokenOneFees[toAdd] += fee.mulDiv(liqTokens, totalSupply());
        }

        emit SwapDone(msg.sender);
    }

    function swapOutTwo(uint256 tokenAmtTwo) external {
        require(tokenAmtTwo > 0, "invalid quantity");
        require(
            tokenTwo.allowance(msg.sender, address(this)) >= tokenAmtTwo,
            "not enough allowance"
        );

        uint256 fee = tokenAmtTwo.mulDiv(basisFee, 10000);
        uint256 swapIn = tokenAmtTwo.sub(fee);
        uint256 rate = getRate();
        uint256 tokenOut = rate.mulDiv(swapIn ,scale);

        if (tokenOut > tokenOneCnt) {
            revert("not enough funds");
        }
        tokenTwo.transferFrom(msg.sender, address(this), tokenAmtTwo);
        (bool success, ) = payable(msg.sender).call{value: tokenOut}("");
        require(success, "Transfer failed.");
        tokenOneCnt = tokenOneCnt.sub(tokenOut);
        tokenTwoCnt = tokenTwoCnt.add(swapIn);
        
        uint256 addressLen = addressArray.length();
        // fee aggregate
        for (uint256 i = 0; i < addressLen; i++) {
            address toAdd = addressArray.at(i);
            uint256 liqTokens = balanceOf(toAdd);

            tokenTwoFees[toAdd] += fee.mulDiv(liqTokens, totalSupply());
        }

        emit SwapDone(msg.sender);
    }

    function payoutRewards() external payable {
        uint256 tokenOnePayout = tokenOneFees[msg.sender];
        uint256 tokenTwoPayout = tokenTwoFees[msg.sender];
        tokenOneFees[msg.sender] = 0;
        tokenTwoFees[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: tokenOnePayout}("");
        require(success, "Transfer failed.");

        tokenTwo.transfer(msg.sender, tokenTwoPayout);
    }

     function getReserves() external view returns(uint256, uint256) {
        return (tokenOneCnt, tokenTwoCnt);
    }
}