const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Test Core logic of Drop contract", function () {
  let barbaraBay;
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;

  const normalPrice = 1500;
  const memberPrice = 1000;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const BarbaraBay = await ethers.getContractFactory("BarbaraBay");
    barbaraBay = await BarbaraBay.deploy(mockMemberships.address, accounts[2].address);
    await barbaraBay.deployed();

     // initialize the cost for test
     await barbaraBay.setCost(normalPrice, false)
     await barbaraBay.setCost(memberPrice, true)
  })
  
  it("Should mint succesfully for members", async function () {
    await barbaraBay.startEditionOpen();

    await barbaraBay.mint(3, {
      from: accounts[0].address,
      value: memberPrice * 3
    });
   
    const tokenBalance = await barbaraBay.balanceOf(accounts[0].address)
   
    expect(await tokenBalance.toString()).to.equal("23");
  });

  it("Should mint succesfully for general people", async function () {
    await barbaraBay.startEditionOpen();
   
    await barbaraBay.connect(accounts[1]).mint(3, {
      from: accounts[1].address,
      value: normalPrice * 3
    });
    
    const tokenBalance = await barbaraBay.balanceOf(accounts[1].address)
    
    expect(await tokenBalance.toString()).to.equal("3");
  });
});