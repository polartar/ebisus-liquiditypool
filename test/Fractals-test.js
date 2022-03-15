const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/fractal-sequence");

const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of Fractals Drop contract", function () {
  let fractals;
  let accounts;
  let artist;
  let mockMemberships

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];

    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const Fractals = await ethers.getContractFactory("Fractals");
    fractals = await Fractals.deploy(mockMemberships.address, artist.address, sequence);
    await fractals.deployed();

    await fractals.setCost(250, true);
    await fractals.setCost(300, false);
  })

  it("Should not mint more than 50", async function () {
    for (let i = 0; i < 25 ; i ++) {
      await fractals.mint(1, {
        from: accounts[0].address,
        value: 250
      });
      await fractals.connect(accounts[1]).mint(1, {
        from: accounts[1].address,
        value: 300
      });
    }

    await expect( fractals.mint(1, {
        from: accounts[0].address,
        value: 250
      }))
      .to.be.revertedWith("sold out!");  
  });

  it("Should pay to artist 238 from member", async function () {
    await fractals.mint(1, {
      from: accounts[0].address,
      value: 250
    });
       
    await expect(() => fractals.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 238);
  });

  it("Should pay the fee from member: 12 cro", async function () {
    await fractals.mint(1, {
      from: accounts[0].address,
      value: 250
    });
   
    await expect(() => fractals.withdraw()).to.changeEtherBalance(accounts[0], 12);
  });

  it("Should pay to artist 285 cro from regular people", async function () {
    await fractals.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
       
    await expect(() => fractals.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 285);
  });

  it("Should pay the fee from regular people: 15 cro", async function () {
    await fractals.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(() => fractals.withdraw()).to.changeEtherBalance(accounts[0], 15);
  });

  it("Should not withdraw for not owner", async function () {
    await fractals.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(fractals.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await fractals.mint(1, {
      from: accounts[0].address,
      value: 250
    });
    
    await expect(fractals.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 40", async function () {
    await fractals.mint(1, {
      from: accounts[0].address,
      value: 250
    });
    
    const tokenURI = await fractals.tokenURI(40);
    expect(tokenURI).to.be.equal("ipfs://QmUfsQv8ETCLjzw5H29CqcgQ4oZucjheF5hsqkzjoWy1hk/40.json");
  });
}); 

