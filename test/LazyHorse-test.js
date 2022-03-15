const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of LazyHorse Drop contract", function () {
  let lazyHorse;
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;

  const normalPrice = 1500;
  const memberPrice = 1000;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const LazyHorse = await ethers.getContractFactory("LazyHorse");
    lazyHorse = await LazyHorse.deploy(mockMemberships.address, artist.address);
    await lazyHorse.deployed();

    // initialize the cost for test
    await lazyHorse.setCost(normalPrice, false);
    await lazyHorse.setCost(memberPrice, true);
  })

  it("Should mint 100 tokens for funder", async function () {
    await expect(lazyHorse.connect(accounts[1]).mintForDeployer(100))
    .to.be.revertedWith("Ownable: caller is not the owner");
    await lazyHorse.connect(accounts[0]).mintForDeployer(100);
 
    const count = await lazyHorse.balanceOf(artist.address);
    expect(await count.toString()).to.equal("100");
  });


  it("Should pay to artist 900 from member and 1350 from normal people", async function () {
  

    await lazyHorse.mint(1, {
      from: accounts[0].address,
      value: 1000
    });

    await lazyHorse.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });

    await expect(() => lazyHorse.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 2250);
  });

  it("Should pay the fee from normal people: 100", async function () {

    await lazyHorse.mint(1, {
      from: accounts[0].address,
      value: 1000
    });
   
    await expect(() => lazyHorse.withdraw()).to.changeEtherBalance(accounts[0], 100);
  });
  
  it("Should pay the fee from normal people: 150", async function () {

    await lazyHorse.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });
   
    await expect(() => lazyHorse.withdraw()).to.changeEtherBalance(accounts[0], 150);
  });

  it("Should pay to the artist for each 10 tokens: 22500", async function () {


    await lazyHorse.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await lazyHorse.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
    
    await expect(() => lazyHorse.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 22500);
  });
  
  it("Should pay the fee for each 10 tokens: 2500", async function () {


    await lazyHorse.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await lazyHorse.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
   
    await expect(() => lazyHorse.withdraw()).to.changeEtherBalance(accounts[0], 2500);
  });

  it("Should not withdraw for not owner", async function () {


    await lazyHorse.connect(accounts[1]).mint(3, {
      from: accounts[1].address,
      value: normalPrice * 3
    });
   
    await expect(lazyHorse.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });


  it("Should return tokenURI", async function () {

    await lazyHorse.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    const tokenURI = await lazyHorse.tokenURI(1);
    expect(tokenURI).to.be.equal("https://www.lazyhorseraceclub.com/lhrcmetadata/1.json");
  });
 
  it("Should return totaly supply", async function () {

    await lazyHorse.mint(4, {
      from: accounts[0].address,
      value: normalPrice * 4
    });
    
    const totalSupply = await lazyHorse.totalSupply();
    expect(totalSupply.toString()).to.be.equal("4");
  });

  it("Should not mint more than 200 when maxtoken is 200", async function () {

    await lazyHorse.setMaxToken(100);
    await lazyHorse.setCost(1, true);
    await expect( lazyHorse.mint(101, {
        from: accounts[0].address,
        value: 101
      }))
      .to.be.revertedWith("sold out!");  
  });
}); 

