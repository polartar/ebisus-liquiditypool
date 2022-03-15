const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of BarbaraBay Drop contract", function () {
  let barbaraBay;
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;
  const editionLimit = 7 * 24 * 60 * 60 + 1;
  const fee = 25;
  const normalPrice = 1500;
  const memberPrice = 1000;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];

    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const BarbaraBay = await ethers.getContractFactory("BarbaraBay");
    barbaraBay = await BarbaraBay.deploy(mockMemberships.address, artist.address);
    await barbaraBay.deployed();

    // initialize the cost for test
    await barbaraBay.setCost(normalPrice, false)
    await barbaraBay.setCost(memberPrice, true)
  })

  it("Should mint 20 tokens for deployer", async function () {
    const count = await barbaraBay.balanceOf(accounts[0].address);

    expect(await count.toString()).to.equal("20");
  });
  
  it("Should not mint before staring edition", async function () {
    await expect( barbaraBay.mint(3, {
      from: accounts[0].address,
      value: memberPrice
    }))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should not mint after 7 days", async function () {
    await barbaraBay.startEditionOpen();
    
    await ethers.provider.send('evm_increaseTime', [editionLimit]);
    await ethers.provider.send('evm_mine');
    await expect( barbaraBay.mint(3, {
        from: accounts[0].address,
        value: memberPrice
      }))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should pay to artist from member: 750", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.mint(1, {
      from: accounts[0].address,
      value: 1000
    });
       
    // const paidAmount = (memberPrice * (100 - discount) / 100)  * (100 - fee) / 100
    await expect(() => barbaraBay.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 750);
  });

  it("Should pay to artist from normal people: 1125", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });
   
    // const paidAmount = normalPrice * 3 * (100 - fee) / 100

    await expect(() => barbaraBay.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1125);
  });

  it("Should pay the fee from normal people: 250", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.mint(1, {
      from: accounts[0].address,
      value: 1000
    });
   
    await expect(() => barbaraBay.withdraw()).to.changeEtherBalance(accounts[0], 250);
  });
  
  it("Should pay the fee from normal people: 375", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });
   
    // const paidFee = normalPrice * 3 * fee / 100

    await expect(() => barbaraBay.withdraw()).to.changeEtherBalance(accounts[0], 375);
  });

  it("Should pay to the artist for each 10 tokens: 18750", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await barbaraBay.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
   
    await expect(() => barbaraBay.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 18750);
  });
  
  it("Should pay the fee for each 10 tokens: 5750", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await barbaraBay.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
   
    await expect(() => barbaraBay.withdraw()).to.changeEtherBalance(accounts[0], 6250);
  });

  it("Should not withdraw for not owner", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.connect(accounts[1]).mint(3, {
      from: accounts[1].address,
      value: normalPrice * 3
    });
   
    await expect(barbaraBay.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });
}); 

