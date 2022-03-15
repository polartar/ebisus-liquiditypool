const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const airdroplist1 = require("../airdroplists/airdroplist_valentine_fm.json")
const airdroplist2 = require("../airdroplists/airdroplist_valentine_vip.json")
describe("EbisusAirdrops Contract", function () {
  let ebisusAirdrops
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    const EbisusAirdrops = await ethers.getContractFactory("EbisusAirdrops");
    ebisusAirdrops = await EbisusAirdrops.deploy();
    await ebisusAirdrops.deployed();
  })

  it("Should set the uri for tokenId 1", async function () {
    await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");

    const uri = await ebisusAirdrops.uri(1);
    expect(uri).to.be.equal("ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
  });
  
  it("Should return all known ids", async function () {
    await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
    await ebisusAirdrops.setUri(3, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
    await ebisusAirdrops.setUri(4, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");

    const ids = (await ebisusAirdrops.getAllKnownTokenIds()).map(id => id.toNumber());
    expect(JSON.stringify(ids)).to.be.equal(JSON.stringify([1,3,4]));
  });
  
  it("Should mint airdrops", async function () {
    await ebisusAirdrops.setLimit(1, 50);
    await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
    const airdroplist = [...new Set(airdroplist1.concat(airdroplist2))];
    await ebisusAirdrops.mintAirdrop(1, airdroplist.slice(0, 50));

    const balances = (await ebisusAirdrops.balanceOfBatch([airdroplist[0], airdroplist[1], airdroplist[2]], [1,1,1])).map(balance => balance.toNumber());
    expect(JSON.stringify(balances)).to.be.equal(JSON.stringify([1,1,1]));
  });

  
  it("Should set the limit", async function () {
    await ebisusAirdrops.setLimit(1, 10);
    const limit = await ebisusAirdrops.getLimit(1);
    expect(limit).to.be.equal(10);

    await expect(ebisusAirdrops.setLimit(1, 20)).to.be.revertedWith("can't modify the limit");  
  });
  
  it("Should not mint more than limit", async function () {
    await ebisusAirdrops.setLimit(1, 10);
    await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
    await ebisusAirdrops.mintAirdrop(1, airdroplist1.slice(0, 10));
    await expect(ebisusAirdrops.mintAirdrop(1, [airdroplist1[11]])).to.be.revertedWith("can't mint more than limit");  
  });

  it("Should not mint with unknown id", async function () {
    await ebisusAirdrops.setLimit(1, 10);
    await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
    await expect(ebisusAirdrops.mintAirdrop(2, [airdroplist1[11]])).to.be.revertedWith("unknown tokenId");  
  });
}); 
