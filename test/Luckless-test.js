const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/luckless-sequence");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of LuckLess Drop contract", function () {
  let luckless;
  let mockMemberships
  let accounts;
  const regularCost = 350;
  const memberCost = 300;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const LuckLess = await ethers.getContractFactory("LuckLess");
    luckless = await LuckLess.deploy(mockMemberships.address, artist.address, sequence);
    await luckless.deployed();

    await luckless.setCost(300, true);
    await luckless.setCost(350, false);
  })

  it("Should return 31 for maxSupply()", async function () {    
    expect(await luckless.maxSupply()).to.be.equal(31);
  });
    
  it("Should return 1 for canMint()", async function () {    
    expect(await luckless.canMint(accounts[1].address)).to.be.equal(1);
  });
 
  it("Should return 300 for member price", async function () {    
    expect(await luckless.mintCost(accounts[0].address)).to.be.equal(memberCost);
  });
  
  it("Should return 350 for normal price", async function () {    
    expect(await luckless.mintCost(accounts[1].address)).to.be.equal(regularCost);
  });

  it("Should not mint more than 1 at a time", async function () {
    await expect( luckless.mint(2, {
        from: accounts[0].address,
        value: 1000
      }))
      .to.be.revertedWith("not mint more than one");  
  });

  it("Should not mint more than 31 tokens", async function () {
    await luckless.setCost(100, true);
    for(let i = 0; i < 31; i ++) {
      await luckless.mint(1, {
        from: accounts[0].address,
        value: 100
      });
    }
    
    await expect( luckless.mint(1, {
      from: accounts[0].address,
      value: 100
    }))
    .to.be.revertedWith("sold out!");  
  });
  
  it("Should pay to artist from member: 285", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: memberCost
    });
       
    await expect(() => luckless.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 285);
  });

  it("Should pay to artist from normal people: 333", async function () {
    await luckless.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularCost
    });
   
    await expect(() => luckless.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 333);
  });

  it("Should pay the fee from member: 15 Cro", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: memberCost
    });
   
    await expect(() => luckless.withdraw()).to.changeEtherBalance(accounts[0], 15);
  });
  
  it("Should pay the fee from normal people: 17 Cro", async function () {
    await luckless.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularCost
    });
   
    await expect(() => luckless.withdraw()).to.changeEtherBalance(accounts[0], 17);
  });

  it("Should pay 618 Cro to the artist and 32 Cro fee for membership and regular people", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: memberCost
    });
    await luckless.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularCost
    });
  
    await expect(() => luckless.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 618);
    await expect(() => luckless.withdraw()).to.changeEtherBalance(accounts[0], 32);
  });

  it("Should not withdraw for not owner", async function () {
    await luckless.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularCost
    });
   
    await expect(luckless.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: regularCost
    });
    
    await expect(luckless.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 6", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: regularCost
    });
    
    const tokenURI = await luckless.tokenURI(6);
    expect(tokenURI).to.be.equal("ipfs://QmNZxSivhzo45jQideMBQ3ZYbTsWefwzbA5DmnYHdCdfpj/6.json");
  });
  
  it("Should modify the baseURI", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: regularCost
    });

    await luckless.setBaseURI("ipfs://testURI");

    const tokenURI = await luckless.tokenURI(6);
    expect(tokenURI).to.be.equal("ipfs://testURI/6.json");
  });
 
  it("Should not mint when paused", async function () {
    await luckless.pause();
    await expect(luckless.mint(1, {
      from: accounts[0].address,
      value: regularCost
    })).to.be.revertedWith("Pausable: paused");
  });

  it("Should return all infos", async function () {
    await luckless.mint(1, {
      from: accounts[0].address,
      value: regularCost
    });
    allInfo = await luckless.getInfo();
    // we initilized the reguarcost and membercost with 429 and 399.
    expect(allInfo.regularCost).to.be.equal(regularCost);
    expect(allInfo.memberCost).to.be.equal(memberCost);
    expect(allInfo.maxSupply).to.be.equal(31);
    expect(allInfo.maxMintPerTx).to.be.equal(1);
    expect(allInfo.totalSupply).to.be.equal(1);
  });
}); 

