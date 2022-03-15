const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Drop Contract with membership", function () {
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();
  })

  it("Should return the balance of ERC1155 token '1'", async function () {
    const token1Balance = await mockMemberships.balanceOf(accounts[0].address, 1)
    expect(await token1Balance.toString()).to.equal(token1Count.toString());
  });
}); 
