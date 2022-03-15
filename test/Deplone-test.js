const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of Deplone Drop contract", function () {
  let deplone;
  let mockMemberships
  let accounts;
  const normalPrice = 300;
  const memberPrice = 250;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const Deplone = await ethers.getContractFactory("Deplone");
    deplone = await Deplone.deploy(mockMemberships.address, artist.address, [7, 19, 22, 14, 18,  9,  4, 11, 13,  5, 20,  2, 16, 10, 17,  6,  1,  3, 12, 21, 15,  8]);
    await deplone.deployed();

    // initialize the cost for test
    await deplone.setCost(normalPrice, false)
    await deplone.setCost(memberPrice, true)
  })

  it("Should not mint more than 22", async function () {     
    for (let i = 0; i < 22 ; i ++) {
      await deplone.mint(1, {
        from: accounts[0].address,
        value: memberPrice
      });
    }
    await expect( deplone.mint(1, {
        from: accounts[0].address,
        value: memberPrice
      }))
      .to.be.revertedWith("sold out!");  
  });

  it("Should only mint a token at a time", async function () {
    await expect( deplone.mint(2, {
      from: accounts[0].address,
      value: memberPrice * 2
    }))
    .to.be.revertedWith("not mint more than one");  
  });
  
  it("Should pay to artist from member: 238", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: 250
    });
       
    await expect(() => deplone.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 238);
  });

  it("Should pay to artist from normal people: 285", async function () {
    await deplone.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(() => deplone.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 285);
  });

  it("Should pay the fee from member: 12", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: 250
    });
   
    await expect(() => deplone.withdraw()).to.changeEtherBalance(accounts[0], 12);
  });
  
  it("Should pay the fee from normal people: 15", async function () {
    await deplone.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(() => deplone.withdraw()).to.changeEtherBalance(accounts[0], 15);
  });

  it("Should pay to the artist for each tokens: 523", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: 250
    });

    await deplone.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(() => deplone.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 523);
  });
  
  it("Should pay the fee for each tokens: 27", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: 250
    });

    await deplone.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 300
    });
   
    await expect(() => deplone.withdraw()).to.changeEtherBalance(accounts[0], 27);
  });

  it("Should not withdraw for not owner", async function () {
    await deplone.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice * 1
    });
   
    await expect(deplone.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(deplone.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 7", async function () {
    await deplone.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    const tokenURI = await deplone.tokenURI(7);
    expect(tokenURI).to.be.equal("ipfs://QmPCdD65AHRpVMuw6Zc2knd8NC36dvVPAA7reNFpt5vgVP/7.json");
  });
}); 

