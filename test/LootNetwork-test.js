const { expect } = require("chai");
const { ethers } = require("hardhat");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of LootNetwork Drop contract", function () {
  let lootNetwork;
  let mockMemberships;
  let mockERC20;
  let accounts;
  const token1Count = 5;
  const token2Count = 3;
  const editionLimit = 7 * 24 * 60 * 60 + 1;
  const normalPrice = parseEther("150");
  const memberPrice = parseEther("100");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];

    // creat mock ERC20 token contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    // create mock ERC1155 membership contract
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const LootNetwork = await ethers.getContractFactory("LootNetwork");
    lootNetwork = await LootNetwork.deploy(mockMemberships.address, artist.address, mockERC20.address);
    await lootNetwork.deployed();
    
    mockERC20.transfer(accounts[1].address, parseEther("15000"));
  })

  it("Should mint 20 tokens for deployer", async function () {
    const count = await lootNetwork.balanceOf(accounts[0].address)
    expect(await count.toString()).to.equal("20");
  });

  it("Should not mint before staring edition", async function () {
    await expect( lootNetwork.mint(1))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should not mint after 7 days", async function () {
    await lootNetwork.startEditionOpen();
    
    await ethers.provider.send('evm_increaseTime', [editionLimit]);
    await ethers.provider.send('evm_mine');
    await expect( lootNetwork.mint(1))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should pay to artist from member: 95", async function () {
    await lootNetwork.startEditionOpen();
    await mockERC20.approve(lootNetwork.address, memberPrice);

    await lootNetwork.mint(1);

    await expect(() => lootNetwork.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("95"));
  });

  it("Should pay to artist from normal people: 142.5", async function () {
    await lootNetwork.startEditionOpen();
    await mockERC20.connect(accounts[1]).approve(lootNetwork.address, normalPrice);
    await lootNetwork.connect(accounts[1]).mint(1);
   
    await expect(() => lootNetwork.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("142.5"));
  });

  it("Should pay the fee from normal people: 5", async function () {
    await lootNetwork.startEditionOpen();
    
    await mockERC20.approve(lootNetwork.address, memberPrice);
    await lootNetwork.mint(1);

    await expect(() => lootNetwork.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("5"));
  });
  
  it("Should pay the fee from normal people: 7.5", async function () {
    await lootNetwork.startEditionOpen();

    await mockERC20.connect(accounts[1]).approve(lootNetwork.address, normalPrice);
    await lootNetwork.connect(accounts[1]).mint(1);
   
    await expect(() => lootNetwork.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("7.5"));
  });

  it("Should pay to the artist for each 10 tokens: 2375", async function () {
    await lootNetwork.startEditionOpen();
    await mockERC20.approve(lootNetwork.address, parseEther("1000"));
    await mockERC20.connect(accounts[1]).approve(lootNetwork.address, parseEther("1500"));

    await lootNetwork.mint(10);
    await lootNetwork.connect(accounts[1]).mint(10);

    await expect(() => lootNetwork.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("2375"));
  });
  
  it("Should pay the fee for each 10 tokens: 125", async function () {
    await lootNetwork.startEditionOpen();

    await mockERC20.approve(lootNetwork.address,parseEther("1000"));
    await mockERC20.connect(accounts[1]).approve(lootNetwork.address, parseEther("1500"));

    await lootNetwork.mint(10);
    await lootNetwork.connect(accounts[1]).mint(10);

    await expect(() => lootNetwork.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("125"));
  });

  it("Should not withdraw for not owner", async function () {
    await lootNetwork.startEditionOpen();

    await mockERC20.approve(lootNetwork.address, memberPrice);
    await lootNetwork.mint(1);

    await expect(lootNetwork.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });
}); 

