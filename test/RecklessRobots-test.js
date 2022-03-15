const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/recklessRobots-sequence");
const whitelist = require("../whitelists/whitelist_recklessRobots.json");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of RecklessRobots Drop contract", function () {
  let recklessRobots;
  let mockMemberships
  let accounts;
  const regularPrice = parseEther("300");
  const memberPrice = parseEther("200");
  const whitePrice = parseEther("200");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const RecklessRobots = await ethers.getContractFactory("RecklessRobots");
    recklessRobots = await RecklessRobots.deploy(mockMemberships.address, artist.address);
    await recklessRobots.deployed();
    
    // creat mock ERC20 token contract for impersonating Loot contract
     const MockERC20 = await ethers.getContractFactory("MockERC20");
     mockERC20 = await MockERC20.deploy();
     await mockERC20.deployed();
 
     await recklessRobots.setLootContractAddress(mockERC20.address);

    await recklessRobots.setSequnceChunk(0, sequence.slice(0, 500));
    await recklessRobots.setSequnceChunk(1, sequence.slice(500, 1000));
    await recklessRobots.setSequnceChunk(2, sequence.slice(1000, 1500));
    await recklessRobots.setSequnceChunk(3, sequence.slice(1500));
  })

  it("Should mint 35 tokens for the artist", async function () {     
    const balance = await recklessRobots.balanceOf(artist.address);
    expect(balance).to.be.equal(35);
    
    let tokenURI = await recklessRobots.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://QmXULW4NEaHe3SELWLMHGBQy7MwVN14CRMXAtV2ipLmnpw/1.json`);

    tokenURI = await recklessRobots.tokenURI(35);
    expect(tokenURI).to.be.equal(`ipfs://QmXULW4NEaHe3SELWLMHGBQy7MwVN14CRMXAtV2ipLmnpw/35.json`);
  });
  
  it("Should return 2065 for the sequence length", async function () {     
    const length = await recklessRobots.getLen();
    expect(length)
      .to.be.equal(2065);
  });

  it("Should return 2100 for maxSupply()", async function () {    
    expect(await recklessRobots.maxSupply()).to.be.equal(2100);
  });
  
  it("Should return 38 for totalSupply():artist 35 + new 3 tokens", async function () {
      await recklessRobots.mint(3, {
            from: accounts[0].address,
            value: parseEther("600")
          });
    expect(await recklessRobots.totalSupply()).to.be.equal(38);
  });
  
  it("Should return 10 for canMint()", async function () {    
    expect(await recklessRobots.canMint(accounts[1].address)).to.be.equal(10);
  });
 
  it("Should return 200 for member price", async function () {    
    expect(await recklessRobots.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  });
  
  it("Should return 300 for regular price", async function () {    
    expect(await recklessRobots.mintCost(accounts[1].address)).to.be.equal(regularPrice);
  });

  it("Should not mint more than 10 at a time", async function () {
    await expect( recklessRobots.mint(11, {
        from: accounts[0].address,
        value: parseEther("2200")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 2100 tokens", async function () {
    await recklessRobots.setRegularCost(100)
    for(let i = 0; i < 206; i ++) {
      await recklessRobots.connect(accounts[1]).mint(10, {
        from: accounts[1].address,
        value: 100 * 10
      });
    }

    await recklessRobots.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: 100 * 5
    })
    
    await expect( recklessRobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    const tokenURI = await recklessRobots.tokenURI(sequence[2064]);
    expect(tokenURI).to.be.equal(`ipfs://QmXULW4NEaHe3SELWLMHGBQy7MwVN14CRMXAtV2ipLmnpw/${sequence[2064]}.json`);
  });
  
  it("Should pay 20 Cro fee and 180 Cro to the artist from member", async function () {
    await recklessRobots.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("180"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("20"));
  });

  it("Should pay 30 Cro fee and 270 Cro to artist from regular people", async function () {
    await recklessRobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("270"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("30"));
  });

  it("Should pay 20 Cro fee and 180Cro to artist from whitelist", async function () {
    await recklessRobots.addWhiteList([accounts[3].address]);

    await recklessRobots.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: whitePrice
    });
   
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("180"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("20"));
  });

  it("Should pay 20Cro fee and 180 Cro to artist from millions loot holders", async function () {
    await mockERC20.transfer(accounts[4].address, 8000000);

    await recklessRobots.connect(accounts[4]).mint(1, {
      from: accounts[4].address,
      value: whitePrice
    });
   
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("180"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("20"));
  });
 
  it("Should pay 200Cro fee and 1800 Cro to the artist for 10 tokens of membership", async function () {
    await recklessRobots.mint(10, {
      from: accounts[0].address,
      value: parseEther("2000")
    });
  
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1800"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("200"));
  });

  it("Should pay 300 Cro fee and 2700 Cro to the artist for 10 tokens of regular people", async function () {
    await recklessRobots.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: parseEther("3000")
    });
  
    await expect(() => recklessRobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2700"));
    await expect(() => recklessRobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("300"));
  });
  
  it("Should not withdraw for not owner", async function () {
    await recklessRobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(recklessRobots.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {    
    await expect(recklessRobots.tokenURI(sequence[150])).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await recklessRobots.mint(5, {
      from: accounts[0].address,
      value: parseEther("1000")
    });
    
    const tokenURI = await recklessRobots.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmXULW4NEaHe3SELWLMHGBQy7MwVN14CRMXAtV2ipLmnpw/${sequence[4]}.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await recklessRobots.setBaseURI("ipfs://testURI");

    const tokenURI = await recklessRobots.tokenURI(35);
    expect(tokenURI).to.be.equal(`ipfs://testURI/35.json`);
  });

  it("Should add whitelist", async function () {
    // add whitelist
    let i = 0;
    const whitelistLen = whitelist.length;
    while(i < whitelistLen) {
      if (i + 50 >= whitelistLen) {
        await recklessRobots.addWhiteList(whitelist.slice(i));
        break;
      } else {
        await recklessRobots.addWhiteList(whitelist.slice(i, i + 50));
      }
      i += 50;
    }

    expect(await recklessRobots.isWhiteList(accounts[1].address)).to.be.equal(false);
    expect(await recklessRobots.isWhiteList(whitelist[0])).to.be.equal(true);
    expect(await recklessRobots.isWhiteList(whitelist[whitelist.length-1])).to.be.equal(true);
  });

  it("Should add and remove whitelist", async function () {
    await recklessRobots.addWhiteList([accounts[0].address, accounts[1].address]);
    await recklessRobots.addWhitelistAddress(accounts[2].address);
    expect(await recklessRobots.isWhiteList(accounts[0].address)).to.be.equal(true);
    expect(await recklessRobots.isWhiteList(accounts[1].address)).to.be.equal(true);
    expect(await recklessRobots.isWhiteList(accounts[2].address)).to.be.equal(true);

    await recklessRobots.removeWhiteList(accounts[0].address);
    await recklessRobots.removeWhiteList(accounts[2].address);
    expect(await recklessRobots.isWhiteList(accounts[0].address)).to.be.equal(false);
    expect(await recklessRobots.isWhiteList(accounts[1].address)).to.be.equal(true);
    expect(await recklessRobots.isWhiteList(accounts[2].address)).to.be.equal(false);
  });
  
  it("Should return all infos", async function () {
    allInfo = await recklessRobots.getInfo();
    expect(allInfo.regularCost).to.be.equal(regularPrice);
    expect(allInfo.memberCost).to.be.equal(memberPrice);
    expect(allInfo.whitelistCost).to.be.equal(whitePrice);
    expect(allInfo.maxSupply).to.be.equal(2100);
    expect(allInfo.maxMintPerTx).to.be.equal(10);
    expect(allInfo.totalSupply).to.be.equal(35);
  });
}); 

