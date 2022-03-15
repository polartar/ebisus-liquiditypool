const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/barnCat-sequence");

describe("Test 4 Busines logic of BarnCat Drop contract", function () {
  let barnCat;
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();

    const BarnCat = await ethers.getContractFactory("BarnCat");
    barnCat = await BarnCat.deploy();
    await barnCat.deployed();

    await barnCat.setSequnceChunk(0, sequence.slice(0, 500));
    await barnCat.setSequnceChunk(1, sequence.slice(500, 1000));
    await barnCat.setSequnceChunk(2, sequence.slice(1000, 1500));
    await barnCat.setSequnceChunk(3, sequence.slice(1500));
  })

  it("Should return 2000 for the sequence length", async function () {     
    const length = await barnCat.getLen();
    expect(length)
      .to.be.equal(2000);
  });

  it("Should return 2000 for maxSupply()", async function () {    
    expect(await barnCat.maxSupply()).to.be.equal(2000);
  });
    
  it("Should mint 10 tokens", async function () {
    await barnCat.airdropMint(accounts[1].address, 10);
       
    const balance = await barnCat.balanceOf(accounts[1].address);
    expect(balance.toNumber())
      .to.be.equal(10);
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await expect(barnCat.tokenURI(2001)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 1711", async function () {
    await barnCat.airdropMint(accounts[0].address, 1);
    
    const tokenURI = await barnCat.tokenURI(1711);
    expect(tokenURI).to.be.equal("https://www.lazyhorseraceclub.com/barncatmeta/1711.json");
  });
  
  it("Should modify the baseURI", async function () {
    await barnCat.airdropMint(accounts[0].address, 1);

    await barnCat.setBaseURI("ipfs://testURI");

    const tokenURI = await barnCat.tokenURI(1711);
    expect(tokenURI).to.be.equal("ipfs://testURI/1711.json");
  });
}); 

