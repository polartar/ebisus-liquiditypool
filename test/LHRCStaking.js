const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers, upgrades  } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Test LHRCStaker contract", function () {
  let LHRCStakerFactory;
  let mockERC721Factory;
  let mockERC20Factory;
  let lpFactory;

  let LHRCStaker;
  let ponyNFT;
  let barnNFT;
  let stakeToken;
  let lpToken;
  let croToken;
  let deployer, admin, other;
  before(async() => {
    accounts = await ethers.getSigners();
    [deployer, admin, other] = accounts;
    LHRCStakerFactory = await ethers.getContractFactory("LHRCStaker");
    mockERC721Factory = await ethers.getContractFactory("MockERC721");
    mockERC20Factory = await ethers.getContractFactory("MockERC20");
    lpFactory = await ethers.getContractFactory("LiquidityPool");
 })

  beforeEach(async function () {
    ponyNFT = await mockERC721Factory.deploy();
    await ponyNFT.deployed();
    await ponyNFT.mint(admin.address);
    await ponyNFT.mint(other.address);
    await ponyNFT.mint(admin.address);
    await ponyNFT.mint(admin.address);
    await ponyNFT.mint(admin.address);

    barnNFT = await mockERC721Factory.deploy();
    await barnNFT.deployed();
    await barnNFT.mint(admin.address);
    await barnNFT.mint(other.address);

    stakeToken = await mockERC20Factory.deploy("LHRC", "LazyHorse");
    await stakeToken.deployed();
    await stakeToken.transfer(admin.address, parseEther("1000"));
   
    croToken = await mockERC20Factory.deploy("Cro", "Cro");
    await croToken.deployed();
    await croToken.transfer(admin.address, parseEther("1000"));

    lpToken = await lpFactory.connect(admin).deploy(stakeToken.address, 100);
    await lpToken.deployed();
    await croToken.connect(admin).approve(lpToken.address, parseEther("100"));
    await stakeToken.connect(admin).approve(lpToken.address, parseEther("400"));
    await lpToken.connect(admin).initPool(parseEther("400"), {value: parseEther("100")});
 
    LHRCStaker = await upgrades.deployProxy(LHRCStakerFactory, [stakeToken.address], { kind : "uups" });
    await LHRCStaker.deployed();

    await LHRCStaker.connect(deployer).grantRole(await LHRCStaker.DEFAULT_ADMIN_ROLE(), admin.address);
    await LHRCStaker.connect(admin).setLptoken(lpToken.address);

    await ponyNFT.connect(other).setApprovalForAll(LHRCStaker.address, true);
    await ponyNFT.connect(admin).setApprovalForAll(LHRCStaker.address, true);
    await barnNFT.connect(other).setApprovalForAll(LHRCStaker.address, true);
    await barnNFT.connect(admin).setApprovalForAll(LHRCStaker.address, true);

    await stakeToken.connect(admin).approve(LHRCStaker.address, parseEther("1000"));
    await stakeToken.transfer(LHRCStaker.address, parseEther("1000"));
  })

  it('should only let admin upgrade', async () => {
    await LHRCStaker.grantRole(await LHRCStaker.UPGRADER_ROLE(), admin.address);
    let v2 = await ethers.getContractFactory("LHRCStaker2", other);
    await expect(upgrades.upgradeProxy(LHRCStaker.address, v2)).to.be.reverted;
    
    v2 = await ethers.getContractFactory("LHRCStaker2", admin);
    const upgrade = await upgrades.upgradeProxy(LHRCStaker.address, v2);

    await expect(await upgrade.name()).to.eq("v2");
  })

  it("Should only admin set APY", async function () {
    await expect(LHRCStaker.connect(other).setAPY(20)).to.be.reverted;
    await LHRCStaker.connect(admin).setAPY(30);
    expect(await LHRCStaker.getAPY()).to.be.equal(30);     
  });
 
  it("Should register and remove Boost NFT", async function () {
    await expect(LHRCStaker.connect(other).registerAmplifyNFT(ponyNFT.address, 4)).to.be.reverted;

    // register boost NFT
    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 4);
    expect(await LHRCStaker.getAmplifyNFT(ponyNFT.address)).to.be.equal(4);
    expect(await LHRCStaker.isBoostNFT(ponyNFT.address)).to.be.equal(true);
    
    //remove boost NFT
    await LHRCStaker.connect(admin).removeAmplifyNFT(ponyNFT.address);
    expect(await LHRCStaker.isBoostNFT(ponyNFT.address)).to.be.equal(false);
  });

  it("Should stake Boost NFT", async function () {
    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 4);
    expect(await ponyNFT.ownerOf(1)).to.be.equal(admin.address);
   
    // staked and emit event
    await expect(LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address)).to.emit(LHRCStaker, "NFTStaked").withArgs(admin.address, ponyNFT.address, 1);

    // check owner of nft
    await expect(LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address)).to.be.revertedWith("not nft owner");

    const stakedNFTs = await LHRCStaker.getStakedNFTs(admin.address, stakeToken.address);

    expect(stakedNFTs[0].nft).to.be.equal(ponyNFT.address)
    expect(stakedNFTs[0].id).to.be.equal(1)
    // transfer the nft
    expect(await ponyNFT.ownerOf(1)).to.be.equal(LHRCStaker.address);
  });

  it("Should not stake more than max allowed 4", async function () {
    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 4);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 3, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 4, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 5, stakeToken.address);
    await expect(LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 6, stakeToken.address)).to.be.revertedWith("exceed max nfts");
  });

  it("Should not stake unsupported nft", async function () {
    await expect(LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address)).to.be.revertedWith("not unsupported nft");
  });
  
  it("Should unstake Boost NFT", async function () {
    // when none staked tokens
    await expect(LHRCStaker.connect(admin).unstakeNFT(ponyNFT.address, 1, stakeToken.address)).to.be.revertedWith("none staked");

    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 4);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 3, stakeToken.address);

    // when not exist
    await expect(LHRCStaker.connect(admin).unstakeNFT(ponyNFT.address, 2, stakeToken.address)).to.be.revertedWith("no exists");

    await expect(LHRCStaker.connect(admin).unstakeNFT(ponyNFT.address, 1, stakeToken.address)).to.be.revertedWith("locked NFT");
    // when lock

    let stakedNFTs = await LHRCStaker.getStakedNFTs(admin.address, stakeToken.address);
    expect(stakedNFTs.length).to.be.equal(2);
    expect(await ponyNFT.ownerOf(1)).to.be.equal(LHRCStaker.address);

    await ethers.provider.send("evm_increaseTime", [48 * 3600]);
    await ethers.provider.send("evm_mine");

    // unstake and emit event
    await expect(LHRCStaker.connect(admin).unstakeNFT(ponyNFT.address, 1, stakeToken.address)).to.emit(LHRCStaker, "NFTUnStaked").withArgs(admin.address, ponyNFT.address, 1);
    // refund nft
    expect(await ponyNFT.ownerOf(1)).to.be.equal(admin.address);

    stakedNFTs = await LHRCStaker.getStakedNFTs(admin.address, stakeToken.address);
    expect(stakedNFTs.length).to.be.equal(1);
    expect(stakedNFTs[0].nft).to.be.equal(ponyNFT.address)
    expect(stakedNFTs[0].id).to.be.equal(3)
  });

  it("Should stake 100", async function () {
    await expect(LHRCStaker.connect(admin).stake(ponyNFT.address, parseEther("100"))).to.be.revertedWith("invalid token");
    await expect(LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("2000"))).to.be.revertedWith("not enough funds");
    await expect(() => LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("100"))).to.changeTokenBalance(stakeToken, LHRCStaker, parseEther("100"));
    
    await expect(LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("100"))).to.emit(LHRCStaker, "LHRCStaked").withArgs(admin.address, parseEther("100"));
    
    const userInfo = await LHRCStaker.getUserInfo(admin.address);
    expect(userInfo.totalAmount).to.be.equal(parseEther("200"));
  });

  it("Should stake LPtoken 100", async function () {
    await lpToken.approve(LHRCStaker.address, parseEther("100"));
    await expect(() => LHRCStaker.connect(admin).stake(lpToken.address, parseEther("20"))).to.changeTokenBalance(lpToken, LHRCStaker, parseEther("20"));

    await expect(LHRCStaker.connect(admin).stake(lpToken.address, parseEther("20"))).to.emit(LHRCStaker, "LPStaked").withArgs(admin.address, parseEther("20"));
    
    const userInfo = await LHRCStaker.getUserInfo(admin.address);
    expect(userInfo.totalLPAmount).to.be.equal(parseEther("40"));
  });

  it("Should unstake", async function () {
    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("200"))

    await expect(LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("300"))).to.be.revertedWith("not enough funds");

    await expect (LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("200"))).to.be.revertedWith("token locked");

    await ethers.provider.send("evm_increaseTime", [48 * 3600+1]);
    await ethers.provider.send("evm_mine");
    
    // await expect(() => LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("100"))).to.changeTokenBalance(stakeToken, admin, parseEther("100"));
    let initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("100"))
    let currentBalance = await stakeToken.balanceOf(admin.address);
    // LHRC 200 * 20% *2/365 = 0.219
    await expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("100.2"), parseEther("100.3"));

    let userInfo = await LHRCStaker.getUserInfo(admin.address);
    expect(userInfo.totalAmount).to.be.equal(parseEther("100"));
    await expect(LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("100"))).to.emit(LHRCStaker, "LHRCUnStaked").withArgs(admin.address, parseEther("100"));

    userInfo = await LHRCStaker.getUserInfo(admin.address);
    expect(userInfo.totalAmount).to.be.equal(parseEther("0"));

    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("100"))
    // pass 1 day
    await ethers.provider.send("evm_increaseTime", [24 * 3600]);
    await ethers.provider.send("evm_mine");
    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("100"))

    // pass 1 day
    await ethers.provider.send("evm_increaseTime", [24 * 3600]);
    await ethers.provider.send("evm_mine");
    
    await expect (LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("200"))).to.be.revertedWith("token locked");
    await ethers.provider.send("evm_increaseTime", [24 * 3600]);
    await ethers.provider.send("evm_mine");
    // await expect(() => LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("200"))).to.changeTokenBalance(stakeToken, admin, parseEther("190"));
    initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).unstake(stakeToken.address, parseEther("200"))
    currentBalance = await stakeToken.balanceOf(admin.address);
    // LHRC 200 * 20% *2/365 = 0.219
    await expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("200.2"), parseEther("200.3"));
  });

  it("Should unstake LP", async function () {
    await lpToken.approve(LHRCStaker.address, parseEther("200"));
    await LHRCStaker.connect(admin).stake(lpToken.address, parseEther("100"))

    await expect(LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("300"))).to.be.revertedWith("not enough funds");

    await expect (LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("50"))).to.be.revertedWith("token locked");

    await ethers.provider.send("evm_increaseTime", [48 * 3600+1]);
    await ethers.provider.send("evm_mine");

    await expect(() => LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("50"))).to.changeTokenBalance(lpToken, admin, parseEther("50"));  
    await expect(LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("50"))).to.emit(LHRCStaker, "LPUnStaked").withArgs(admin.address, parseEther("50"));

    let userInfo = await LHRCStaker.getUserInfo(admin.address);
    expect(userInfo.totalLPAmount).to.be.equal(parseEther("0"));

    await LHRCStaker.connect(admin).stake(lpToken.address, parseEther("50"))
    // pass 1 day
    await ethers.provider.send("evm_increaseTime", [24 * 3600]);
    await ethers.provider.send("evm_mine");
    await LHRCStaker.connect(admin).stake(lpToken.address, parseEther("50"))
    
    // pass 1 day
    await ethers.provider.send("evm_increaseTime", [24 * 3600 ]);
    await ethers.provider.send("evm_mine");

    await expect (LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("100"))).to.be.revertedWith("token locked");
    await ethers.provider.send("evm_increaseTime", [24 * 3600 + 1]);
    await ethers.provider.send("evm_mine");
    await expect(() => LHRCStaker.connect(admin).unstake(lpToken.address, parseEther("100"))).to.changeTokenBalance(lpToken, admin, parseEther("100"));
  });

  it("Should harvest when only LHRC token staked", async function () {
    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("200"));
    
    // 1 year pass
    await ethers.provider.send("evm_increaseTime", [31536000]);
    await ethers.provider.send("evm_mine");
    let initialBalance = await stakeToken.balanceOf(admin.address);
    // await expect(() => LHRCStaker.connect(admin).harvest()).to.be.changeTokenBalance(stakeToken, admin, parseEther("40"))
    await LHRCStaker.connect(admin).harvest();
    let currentBalance = await stakeToken.balanceOf(admin.address);

    expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("39.8"), parseEther("40"));
    await expect(LHRCStaker.connect(admin).harvest()).to.be.revertedWith("already harvested");

    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 2);
    await LHRCStaker.connect(admin).registerAmplifyNFT(barnNFT.address, 3);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 3, lpToken.address);
    await LHRCStaker.connect(admin).stakeNFT(barnNFT.address, 1, stakeToken.address);

    // half year pass
    await ethers.provider.send("evm_increaseTime", [15768000 - 1]);
    await ethers.provider.send("evm_mine");
    initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).harvest();
    currentBalance = await stakeToken.balanceOf(admin.address);
    expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("99.5"), parseEther("99.51"));

    // half year pass
    await ethers.provider.send("evm_increaseTime", [15768000]);
    await ethers.provider.send("evm_mine");
    
    await LHRCStaker.connect(admin).unstakeNFT(ponyNFT.address, 1, stakeToken.address);

    // 1 year pass
    await stakeToken.transfer(LHRCStaker.address, parseEther("1000"));
    await ethers.provider.send("evm_increaseTime", [31536000]);
    await ethers.provider.send("evm_mine");

    initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).harvest();
    currentBalance = await stakeToken.balanceOf(admin.address);
    expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("119.4"), parseEther("119.41"));
  });

  it("Should harvest when lptoken and lhrc staked", async function () {
    // deposite 1000 LHRC
    await stakeToken.transfer(LHRCStaker.address, parseEther("1000"));

    await croToken.approve(lpToken.address, parseEther("500"));
    await stakeToken.approve(lpToken.address, parseEther("500"));
    await stakeToken.connect(admin).approve(LHRCStaker.address, parseEther("500"));
    
    await lpToken.connect(deployer).addLiquidity(parseEther("25"), parseEther("100"));
    await lpToken.approve(LHRCStaker.address, parseEther("200"));


    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("200"));
    // // stake LP with 200 LHRC pair
    await LHRCStaker.connect(admin).stake(lpToken.address, parseEther("100"));
    
    // 1 year pass
    await ethers.provider.send("evm_increaseTime", [31536000]);
    await ethers.provider.send("evm_mine");
    let initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).harvest();
    let currentBalance = await stakeToken.balanceOf(admin.address);

    // LHRC 20% + LP 100%  = 40 + 200
    expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("238.80"), parseEther("238.81"));
    await expect(LHRCStaker.connect(admin).harvest()).to.be.revertedWith("already harvested");

    await LHRCStaker.connect(admin).registerAmplifyNFT(ponyNFT.address, 2);
    await LHRCStaker.connect(admin).registerAmplifyNFT(barnNFT.address, 3);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 1, stakeToken.address);
    await LHRCStaker.connect(admin).stakeNFT(ponyNFT.address, 3, lpToken.address);
    await LHRCStaker.connect(admin).stakeNFT(barnNFT.address, 1, stakeToken.address);

    // half year pass
    await ethers.provider.send("evm_increaseTime", [15768000 - 1]);
    await ethers.provider.send("evm_mine");
    initialBalance = await stakeToken.balanceOf(admin.address);
    await LHRCStaker.connect(admin).harvest();
    currentBalance = await stakeToken.balanceOf(admin.address);
    // LHRC 100% /2 + LP 200% /2 = 100 + 200
    await expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("298.50"), parseEther("298.51"));
  });

  it("Should take 0.5% fee", async function () {
    await LHRCStaker.connect(admin).stake(stakeToken.address, parseEther("600"));
    
    // 1 year pass
    await ethers.provider.send("evm_increaseTime", [31536000]);
    await ethers.provider.send("evm_mine");
    let initialBalance = await stakeToken.balanceOf(admin.address);
    // await expect(() => LHRCStaker.connect(admin).harvest()).to.be.changeTokenBalance(stakeToken, admin, parseEther("40"))
    await LHRCStaker.connect(admin).harvest();
    let currentBalance = await stakeToken.balanceOf(admin.address);

    expect(currentBalance.sub(initialBalance)).to.be.within(parseEther("119.40"), parseEther("119.41"));
  });

}); 

