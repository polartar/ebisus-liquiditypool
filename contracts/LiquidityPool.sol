// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SafeMathLite.sol";
import "./SafePct.sol";

contract LiquidityPool is ERC20, Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMathLite for uint256;
    using SafePct for uint256;

    // Events
    event NewPool(address indexed _address, uint256 lpAmount);
    event NewLiquidity(address indexed _address, uint256 lpAmount);
    event LessLiquidity(address indexed _address, uint256 percent);
    event SwapOutCro(address indexed _address, uint256 inAmount, uint256 outAmount);
    event SwapOutToken(address indexed _address, uint256 inAmount, uint256 outAmount);

    IERC20 public tokenTwo;
    uint256 public basisFee;
    address private feeTo;

    uint256 public tokenOneCnt;
    uint256 public tokenTwoCnt;

    EnumerableSet.AddressSet private addressArray;

    uint256 constant scale = 10 ** 9;

    constructor(
        address tokenAddrTwo,
        uint256 _basisFee,
        address _feeTo
    ) ERC20("Lazy-Cro", "LazyHorse LP") {
        tokenTwo = IERC20(tokenAddrTwo);
        basisFee = _basisFee;
        feeTo = _feeTo;
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

    function initPool(uint256 tTwoAmt) external onlyOwner payable {
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

    function getRateForToken() public view returns(uint256) {
        return tokenOneCnt * scale / tokenTwoCnt ;
    }

    function getRateForCro() public view returns(uint256) {
        return tokenTwoCnt * scale / tokenOneCnt ;
    }

    function addLiquidity(uint256 tTwoAmt) external payable {
        require(
            tokenTwo.allowance(msg.sender, address(this)) >= tTwoAmt,
            "not enough allowance token2"
        );
        require(msg.value != 0 && tTwoAmt != 0, "need non-zero values");
        uint256 rate = getRateForToken();
        
        if (scale * msg.value != rate * tTwoAmt) {
            revert("amounts not matched");
        }

        tokenTwo.transferFrom(msg.sender, address(this), tTwoAmt);
        tokenOneCnt = tokenOneCnt.add(msg.value);
        tokenTwoCnt = tokenTwoCnt.add(tTwoAmt);
        uint256 lpAmount = sqrt(msg.value.mul(tTwoAmt));
        
        addressArray.add(msg.sender);
        
        _mint(msg.sender, lpAmount);
        emit NewLiquidity(msg.sender, lpAmount);
    }

    // 0 to 100 is a invariant -- percent of holdings
    function removeLiquidity(uint256 percent) external nonReentrant {
        require(0 < percent && percent <= 100, "invalid removal percent");
        uint256 balance = balanceOf(msg.sender);

        require(balance > 0, "no stake in the pool");

        uint256 payout = balance.mulDiv(percent, 100);
        uint256 tokenOnePayout = tokenOneCnt.mulDiv(payout, totalSupply());
        uint256 tokenTwoPayout = tokenTwoCnt.mulDiv(payout, totalSupply());

        _burn(msg.sender, payout);

        tokenOneCnt = tokenOneCnt.sub(tokenOnePayout);
        tokenTwoCnt = tokenTwoCnt.sub(tokenTwoPayout);

        (bool success, ) = payable(msg.sender).call{value: tokenOnePayout}("");
        require(success, "Transfer failed.");
        tokenTwo.transfer(msg.sender, tokenTwoPayout);

        if (percent == 100) {
            addressArray.remove(msg.sender);
        }
        emit LessLiquidity(msg.sender, percent);
    }

    function getPriceImpacForCro(uint256 _amount) public view returns(uint256) {
        uint256 newTokenAmount = tokenOneCnt.mulDiv(tokenTwoCnt, tokenOneCnt.add(_amount));
        uint256 croPerToken = _amount.mulDiv(scale, tokenTwoCnt - newTokenAmount);
        uint256 rate = getRateForToken();
        uint256 priceImpact = (croPerToken.sub(rate)).mulDiv(100, rate);
        return priceImpact;
    }

     function getPriceImpacForToken(uint256 _amount) public view returns(uint256) {
        uint256 newCroAmount = tokenTwoCnt.mulDiv(tokenOneCnt, tokenTwoCnt.add(_amount));
        uint256 tokenPerCro = _amount.mulDiv(scale, tokenOneCnt - newCroAmount);
        uint256 rate = getRateForCro();
        uint256 priceImpact = (tokenPerCro.sub(rate)).mulDiv(100, rate);
        return priceImpact;
    }

    function swapOutCro() public payable {
        uint256 tokenAmtOne = msg.value;
        require(tokenAmtOne > 0, "invalid quantity");
        
        uint256 fee = tokenAmtOne.mulDiv(basisFee, 10000);

       (bool success, ) = payable(feeTo).call{value: fee}("");
        require(success, "Fee Transfer failed.");

        uint256 swapIn = tokenAmtOne.sub(fee);
        uint256 priceImpact = getPriceImpacForCro(msg.value);
        uint256 rate = getRateForCro();
        uint256 tokenOut = swapIn.mulDiv(rate, scale).mulDiv(10000 - priceImpact, 10000);
        if (tokenOut > tokenTwoCnt) {
            revert("not enough funds");
        }
        tokenTwo.transfer(msg.sender, tokenOut);
        (success, ) = payable(msg.sender).call{value: tokenOut}("");
        tokenOneCnt = tokenOneCnt.add(swapIn);
        tokenTwoCnt = tokenTwoCnt.sub(tokenOut);

        emit SwapOutCro(msg.sender, msg.value, tokenOut);
    }

    function swapOutToken(uint256 tokenAmtTwo) external {
        require(tokenAmtTwo > 0, "invalid quantity");
        require(
            tokenTwo.allowance(msg.sender, address(this)) >= tokenAmtTwo,
            "not enough allowance"
        );

        uint256 fee = tokenAmtTwo.mulDiv(basisFee, 10000);
        
        tokenTwo.transfer(feeTo, fee);

        uint256 swapIn = tokenAmtTwo.sub(fee);
        uint256 priceImpact = getPriceImpacForToken(tokenAmtTwo);
        uint256 rate = getRateForToken();
        uint256 tokenOut = swapIn.mulDiv(rate, scale).mulDiv(10000 - priceImpact, 10000);

        if (tokenOut > tokenOneCnt) {
            revert("not enough funds");
        }

        tokenOneCnt = tokenOneCnt.sub(tokenOut);
        tokenTwoCnt = tokenTwoCnt.add(swapIn);

        tokenTwo.transferFrom(msg.sender, address(this), tokenAmtTwo);
        (bool success, ) = payable(msg.sender).call{value: tokenOut}("");
        require(success, "Transfer failed.");

        emit SwapOutToken(msg.sender, tokenAmtTwo, tokenOut);
    }

    function getReserves() external view returns(uint256, uint256) {
        return (tokenOneCnt, tokenTwoCnt);
    }

    function setBaseFee(uint256 _fee) external onlyOwner {
        basisFee = _fee;
    }

    function setFeeTo(address _feeTo) external onlyOwner {
        feeTo = _feeTo;
    }
}