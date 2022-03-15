const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of Charity Drop contract", function () {
  // let charity;
  // // let mockMemberships
  // let accounts;
  // const token1Count = 5;
  // const token2Count = 3;
  // const editionLimit = 7 * 24 * 60 * 60 + 1;
  // const fee = 25;
  // const normalPrice = 1000;
  // let artist;

  // beforeEach(async function () {
  //   accounts = await ethers.getSigners();
  //   artist = accounts[2];
  //   // const MockMemberships = await ethers.getContractFactory("MockMemberships");
  //   // mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
  //   // await mockMemberships.deployed();

  //   const Charity = await ethers.getContractFactory("Charity");
  //   charity = await Charity.deploy(artist.address);
  //   await charity.deployed();

  //   // initialize the cost for test
  //   await charity.setCost(normalPrice)
  //   // await charity.setCost(normalPrice, true)
  // })

  // it("Should mint 1 token for deployer", async function () {
  //   const count = await charity.balanceOf(accounts[0].address);
  //   console.log(count.toString());
  //   expect(await count.toString()).to.equal("1");
  // });
  
  // it("Should not mint before staring edition", async function () {
  //   await expect( charity.mint(3, {
  //     from: accounts[0].address,
  //     value: normalPrice
  //   }))
  //   .to.be.revertedWith("The edition is closed");
  // });

  // it("Should not mint after 7 days", async function () {
  //   await charity.startEditionOpen();
    
  //   await ethers.provider.send('evm_increaseTime', [editionLimit]);
  //   await ethers.provider.send('evm_mine');
  //   await expect( charity.mint(3, {
  //       from: accounts[0].address,
  //       value: normalPrice
  //     }))
  //   .to.be.revertedWith("The edition is closed");
  // });

  // it("Should pay to artist from normal people: 1000", async function () {
  //   await charity.startEditionOpen();

  //   await charity.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: 1000
  //   });
   
  //   await expect(() => charity.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1000);
  // });

  // it("Should pay to the artist for each 10 tokens: 10000", async function () {
  //   await charity.startEditionOpen();

  //   await charity.mint(10, {
  //     from: accounts[0].address,
  //     value: 10000
  //   });

  //   await expect(() => charity.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 10000);
  // });

  // it("Should not withdraw for not owner", async function () {
  //   await charity.startEditionOpen();

  //   await charity.connect(accounts[1]).mint(3, {
  //     from: accounts[1].address,
  //     value: normalPrice * 3
  //   });
   
  //   await expect(charity.connect(accounts[1]).withdraw())
  //     .to.be.revertedWith("Ownable: caller is not the owner");
  // });
}); 

