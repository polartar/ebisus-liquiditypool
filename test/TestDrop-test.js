const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test membeship check of Drop contract", function () {
  let barbaraBay;
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const BarbaraBay = await ethers.getContractFactory("BarbaraBay");
    barbaraBay = await BarbaraBay.deploy(mockMemberships.address, accounts[2].address);
    await barbaraBay.deployed();
  })
  
  it("Should check isMember() for members", async function () {      
    expect(await barbaraBay.isMember(accounts[0].address)).to.equal(true);
  });
 
  it("Should check isMember() for general user", async function () {      
    expect(await barbaraBay.isMember(accounts[1].address)).to.equal(false);
  });
}); 

