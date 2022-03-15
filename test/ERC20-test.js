const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test ERC20 token contract", function () {
  let mockERC20;
  let accounts;

  beforeEach(async function () {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    accounts = await ethers.getSigners();
  })

  it("Should deploy 1000000000000 ERC20 tokens", async function () {
    const balance = await mockERC20.balanceOf(accounts[0].address)
    expect(balance).to.equal(ethers.utils.parseEther("1000000000000"));
  });

}); 

