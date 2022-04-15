const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers, upgrades  } = require("hardhat");

function getSwapAmount(amount, impactPrice) {
  return amount.mul(10000 - impactPrice).div(10000);
}
describe("Test LiquidityPool contract", function () {
  let liquidityPoolFactory;
  let mockERC20Factory;

  let liquidityPool;
  let token1;
  let token2;
  let lpToken;
  let owner, other1, other2, feeTo;

  before(async() => {
    accounts = await ethers.getSigners();
    [owner, other1, other2, feeTo] = accounts;
    liquidityPoolFactory = await ethers.getContractFactory("LiquidityPool");
    mockERC20Factory = await ethers.getContractFactory("MockERC20");
 })

  beforeEach(async function () {
    token2 = await mockERC20Factory.deploy("Token2", "Token2");
    await token2.deployed();
    await token2.transfer(other1.address, parseEther("1000"));
    
    // fee is 1%
    liquidityPool = await liquidityPoolFactory.deploy(token2.address, 100, feeTo.address);
    await liquidityPool.deployed();
    
    await token2.approve(liquidityPool.address, parseEther("400"));
    await liquidityPool.initPool(parseEther("400"), {value: parseEther("100")});
   })

  // it("Should deposit and get LP", async function () {
  //   const reserves = await liquidityPool.getReserves();

  //   expect(reserves[0]).to.be.equal(parseEther("100"));
  //   expect(reserves[1]).to.be.equal(parseEther("400"));

  //   const balance = await liquidityPool.balanceOf(owner.address);
  //   expect(balance).to.be.equal(parseEther("200"));
  // });

  // it("Should add liquidity", async function () {
  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther('200'), {from: other1.address , value: parseEther("100")})).to.be.revertedWith("not enough allowance token2");

  //   await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
  //   await expect(liquidityPool.connect(other1).addLiquidity(0, {value: parseEther("1")})).to.be.revertedWith("need non-zero values");
  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther("200"), {from: other1.address , value: parseEther("100")})).to.be.revertedWith("amounts not matched");

  //   await expect(liquidityPool.connect(other1).addLiquidity(parseEther("36"), {from: other1.address, value: parseEther("9")})).to.emit(liquidityPool, "NewLiquidity");
    
  //   const reserves = await liquidityPool.getReserves();

  //   expect(reserves[0]).to.be.equal(parseEther("109"));
  //   expect(reserves[1]).to.be.equal(parseEther("436"));

  //   const balance = await liquidityPool.balanceOf(other1.address);
  //   expect(balance).to.be.equal(parseEther("18"));
  // });
  
  // it("Should remove liquidity", async function () {
  //   await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
  //   await liquidityPool.connect(other1).addLiquidity(parseEther("36"), {value: parseEther("9")});
    
  //   await expect(() => liquidityPool.connect(other1).removeLiquidity(20)).to.changeEtherBalance(other1, parseEther("1.8"));
  //   await expect(() => liquidityPool.connect(other1).removeLiquidity(25)).to.changeTokenBalance(token2, other1, parseEther("7.2"));

  //   const balance = await liquidityPool.balanceOf(other1.address);
  //   expect(balance).to.be.equal(parseEther("10.8"));
  // });

  // it("Should swap Cro to token2", async function () {   
  //   const initBalance = await token2.balanceOf(other1.address);
  //   await expect(() => liquidityPool.connect(other1).swapOutCro({value: parseEther("4")})).to.changeEtherBalance(other1, parseEther("-4"));
  //   const afterBalance = await token2.balanceOf(other1.address);
  //   const priceImpact = await liquidityPool.getPriceImpacForCro(parseEther("4"));
  //   expect(afterBalance.sub(initBalance)).to.be.equal(getSwapAmount(parseEther("16").mul(99).div(100), priceImpact));
  // });
 
  it("Should swap token2 to Cro", async function () {
    await token2.approve(liquidityPool.address, parseEther("100"));
    
    const initBalance = await token2.balanceOf(owner.address);
    const priceImpact = await liquidityPool.getPriceImpacForToken(parseEther("16"));
    await expect(() => liquidityPool.swapOutToken(parseEther("16"))).to.changeEtherBalance(liquidityPool, getSwapAmount(parseEther("4").mul(-99).div(100), priceImpact));
    const afterBalance = await token2.balanceOf(owner.address);
    expect(afterBalance.sub(initBalance)).to.be.equal(parseEther("-16"));
  });

  it("Should pay the rewards CRO", async function () {   
    await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
    await liquidityPool.connect(other1).addLiquidity(parseEther("100"), {from: other1.address , value: parseEther("25")});

    await expect(liquidityPool.connect(other1).swapOutCro({from: other1.address , value: parseEther("200")})).to.be.revertedWith("not enough funds");    
    await expect(() => liquidityPool.connect(other1).swapOutCro({from: other1.address , value: parseEther("100")})).to.changeEtherBalance(feeTo, parseEther("1"));    
    
    await expect(liquidityPool.connect(other1).setFeeTo(other2.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });
 
  it("Should pay the rewards token2", async function () {   
    await token2.connect(other1).approve(liquidityPool.address, parseEther("1000"));
    await liquidityPool.connect(other1).addLiquidity(parseEther("100"), {from: other1.address , value: parseEther("25")});

    await liquidityPool.connect(other1).swapOutToken(parseEther("100"));

    await expect(() => liquidityPool.connect(other1).swapOutToken(parseEther("100"))).to.changeTokenBalance(token2,feeTo, parseEther("1"));    
  });
}); 

