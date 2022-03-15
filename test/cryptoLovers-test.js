const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crypto Lovers", function () {
  const receiver = "0xE3393D0aa89ddCa7Afb871c921d28024df23942F";
  let cryptoLovers;

  it("Should mint 50 tokens for the RECEIVER", async function () {
    const CryptoLovers = await ethers.getContractFactory("CryptoLovers");
    cryptoLovers = await CryptoLovers.deploy();
    await cryptoLovers.deployed();

    const count = await cryptoLovers.balanceOf(receiver);
    expect(await count.toString()).to.equal("50");
  });

  it("Should get token URI", async function () {
    const fifth = await cryptoLovers.tokenURI(5);
    let five = fifth.replace(
      "ipfs://",
      "https://ebisusbay.mypinata.cloud/ipfs/"
    );
    let match =
      "https://ebisusbay.mypinata.cloud/ipfs/QmZ6LNWNwCgzZ7JpAve3SEoJRWjDekKw7jQZG5GKbFC2WA/5.json";
    expect(five).to.equal(match);
  });
});
