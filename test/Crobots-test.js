const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/crobots-sequence");
const whitelist = require("../whitelists/whitelist_crobots.json");
const airdroplist = require("../airdroplists/airdroplist_crobots.json");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of Crobots Drop contract", function () {
  let crobots;
  let mockMemberships
  let accounts;
  const regularPrice = parseEther("250");
  const memberPrice = parseEther("200");
  const whitePrice = parseEther("225");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const Crobots = await ethers.getContractFactory("Crobots");
    crobots = await Crobots.deploy(mockMemberships.address, artist.address);
    await crobots.deployed();
    
    await crobots.mintForArtist(50);
    await crobots.mintForArtist(50);
    await crobots.mintForArtist(50);

    await crobots.setSequnceChunk(0, sequence.slice(0, 500));
    await crobots.setSequnceChunk(1, sequence.slice(500, 1000));
    await crobots.setSequnceChunk(2, sequence.slice(1000, 1500));
    await crobots.setSequnceChunk(3, sequence.slice(1500, 2000));
    await crobots.setSequnceChunk(4, sequence.slice(2000));

    // add whitelist
    let i = 0;
    const whitelistLen = whitelist.length;
    while(i < whitelistLen) {
      if (i + 50 >= whitelistLen) {
        await crobots.addWhiteList(whitelist.slice(i));
        break;
      } else {
        await crobots.addWhiteList(whitelist.slice(i, i + 50));
      }
      i += 50;
    }
    await crobots.addWhiteList([accounts[3].address]);
    // initialize the cost for test
  })

  it("Should mint 150 tokens for the artist", async function () {     
    const balance = await crobots.balanceOf(artist.address);
    expect(balance).to.be.equal(150);
    
    let tokenURI = await crobots.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/1.json`);

    tokenURI = await crobots.tokenURI(150);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/150.json`);
  });
  
  it("Should return 2350 for the sequence length", async function () {     
    const length = await crobots.getLen();
    expect(length)
      .to.be.equal(2350);
  });

  it("Should return 2500 for maxSupply()", async function () {    
    expect(await crobots.maxSupply()).to.be.equal(2500);
  });
  
  it("Should mint for airdrops", async function () {    
    let i = 0;
    const airdropLen = airdroplist.length;
    while(i < airdropLen) {
      if (i + 50 >= airdropLen) {
        await crobots.mintAirdrop(airdroplist.slice(i));
        break;
      } else {
        await crobots.mintAirdrop(airdroplist.slice(i, i + 50));
      }
      i += 50;
    }

    const balance = await crobots.totalSupply();
    expect(balance).to.be.equal(150 + airdroplist.length);
    
    let tokenURI = await crobots.tokenURI(sequence[10]);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/${sequence[10]}.json`);

    tokenURI = await crobots.tokenURI(sequence[airdroplist.length - 1]);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/${sequence[airdroplist.length - 1]}.json`);
  });
  
  it("Should return 153 for totalSupply():artist 150 + new 3 tokens", async function () {
      await crobots.mint(3, {
            from: accounts[0].address,
            value: parseEther("987")
          });
    expect(await crobots.totalSupply()).to.be.equal(153);
  });
  
  it("Should return 10 for canMint()", async function () {    
    expect(await crobots.canMint(accounts[1].address)).to.be.equal(10);
  });
 
  it("Should return 200 for member price", async function () {    
    expect(await crobots.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  });
  
  it("Should return 250 for regular price", async function () {    
    expect(await crobots.mintCost(accounts[1].address)).to.be.equal(regularPrice);
  });

  it("Should not mint more than 10 at a time", async function () {
    await expect( crobots.mint(11, {
        from: accounts[0].address,
        value: parseEther("2200")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 2500 tokens", async function () {
    await crobots.setCost(100, true)
    for(let i = 0; i < 235; i ++) {
      await crobots.mint(10, {
        from: accounts[0].address,
        value: 100 * 10
      });
    }
    
    await expect( crobots.mint(1, {
      from: accounts[0].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    const tokenURI = await crobots.tokenURI(sequence[2349]);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/${sequence[2349]}.json`);
  });
  
  it("Should pay to artist from member: 180 Cro", async function () {
    await crobots.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => crobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("180"));
  });

  it("Should pay to artist from regular people: 225 Cro", async function () {
    await crobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(() => crobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("225"));
  });

  it("Should pay to artist from whitelist: 202.5 Cro", async function () {
    await crobots.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: whitePrice
    });
   
    await expect(() => crobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("202.5"));
  });


  it("Should pay the fee from member: 20 Cro", async function () {
    await crobots.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => crobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("20"));
  });
  
  it("Should pay the fee from regular people: 25 Cro", async function () {
    await crobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(() => crobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("25"));
  });

  it("Should pay the fee from whitelist: 22.5 Cro", async function () {
    await crobots.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: whitePrice
    });
   
    await expect(() => crobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("22.5"));
  });
 
  it("Should pay to the artist for 10 tokens of membership: 1800 Cro", async function () {
    await crobots.mint(10, {
      from: accounts[0].address,
      value: parseEther("2000")
    });
  
    await expect(() => crobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1800"));
  });
  
  it("Should pay the fee for 10 tokens of membership: 200 Cro", async function () {
    await crobots.mint(10, {
      from: accounts[0].address,
      value: parseEther("2000")
    });
   
    await expect(() => crobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("200"));
  });

  it("Should pay to the artist for 10 tokens of regular people: 2250 Cro", async function () {
    await crobots.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: parseEther("2500")
    });
  
    await expect(() => crobots.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2250"));
  });
  
  it("Should pay the fee for 10 tokens of regular people: 250", async function () {
    await crobots.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: parseEther("2500")
    });
   
    await expect(() => crobots.withdraw()).to.changeEtherBalance(accounts[0], parseEther("250"));
  });

  it("Should not withdraw for not owner", async function () {
    await crobots.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(crobots.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {    
    await expect(crobots.tokenURI(sequence[150])).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await crobots.mint(5, {
      from: accounts[0].address,
      value: parseEther("3709")
    });
    
    const tokenURI = await crobots.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmVzPYbXG8meZbFMZBrqpGXyWPBRKepMFVuHsaexhnW77A/${sequence[4]}.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await crobots.setBaseURI("ipfs://testURI");

    const tokenURI = await crobots.tokenURI(150);
    expect(tokenURI).to.be.equal(`ipfs://testURI/150.json`);
  });

  it("Should check whitelist", async function () {
    expect(await crobots.isWhiteList(accounts[1].address)).to.be.equal(false);
    expect(await crobots.isWhiteList(accounts[3].address)).to.be.equal(true);
    expect(await crobots.isWhiteList(whitelist[0])).to.be.equal(true);
    expect(await crobots.isWhiteList(whitelist[whitelist.length-1])).to.be.equal(true);
  });

  it("Should add and remove whitelist", async function () {
    await crobots.addWhiteList([accounts[0].address, accounts[1].address]);
    expect(await crobots.isWhiteList(accounts[0].address)).to.be.equal(true);
    expect(await crobots.isWhiteList(accounts[1].address)).to.be.equal(true);

    await crobots.removeWhiteList(accounts[0].address);
    expect(await crobots.isWhiteList(accounts[0].address)).to.be.equal(false);
    expect(await crobots.isWhiteList(accounts[1].address)).to.be.equal(true);
  });
  
  it("Should return all infos", async function () {
    allInfo = await crobots.getInfo();
    expect(allInfo.regularCost).to.be.equal(regularPrice);
    expect(allInfo.memberCost).to.be.equal(memberPrice);
    expect(allInfo.whitelistCost).to.be.equal(whitePrice);
    expect(allInfo.maxSupply).to.be.equal(2500);
    expect(allInfo.maxMintPerTx).to.be.equal(10);
    expect(allInfo.totalSupply).to.be.equal(150);
  });
}); 

