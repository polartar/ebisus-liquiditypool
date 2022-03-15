const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const { sequence } = require("../sequences/goat-sequence");

describe("Test 4 Busines logic of CronosGoats Drop contract", function () {
  let goat;
  let mockMemberships
  let accounts;
  const normalPrice = 218;
  const memberPrice = 168;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const CronosGoats = await ethers.getContractFactory("CronosGoats");
    goat = await CronosGoats.deploy(mockMemberships.address, artist.address, sequence);
    await goat.deployed();

    // initialize the cost for test
    await goat.setCost(normalPrice, false)
    await goat.setCost(memberPrice, true)
  })

  it("Should mint 20 tokens for the artist", async function () {     
    const balance = await goat.balanceOf(artist.address);
    expect(balance)
      .to.be.equal(20);
  });

  it("Should return 1000 for maxSupply()", async function () {    
    expect(await goat.maxSupply()).to.be.equal(1000);
  });
  
  it("Should return 27 for totalSupply():artist 20 + new 7 tokens", async function () {    
      await goat.mint(7, {
            from: accounts[0].address,
            value: memberPrice * 7
          });
    expect(await goat.totalSupply()).to.be.equal(27);
  });
  
  it("Should return 10 for canMint()", async function () {    
    expect(await goat.canMint(accounts[1].address)).to.be.equal(10);
  });
 
  it("Should return 168 for member price", async function () {    
    expect(await goat.mintCost(accounts[0].address)).to.be.equal(168);
  });
  
  it("Should return 218 for normal price", async function () {    
    expect(await goat.mintCost(accounts[1].address)).to.be.equal(218);
  });

  it("Should not mint more than 10 at a time", async function () {
    await expect( goat.mint(11, {
        from: accounts[0].address,
        value: memberPrice * 11
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 1000 tokens", async function () {
    for(let i = 0; i < 98; i ++) {
      await goat.mint(10, {
        from: accounts[0].address,
        value: memberPrice * 10
      });
    }
    
    await expect( goat.mint(1, {
      from: accounts[0].address,
      value: memberPrice * 1
    }))
    .to.be.revertedWith("sold out!");  
  });
  
  it("Should pay to artist from member: 160", async function () {
    await goat.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => goat.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 160);
  });

  it("Should pay to artist from normal people: 208", async function () {
    await goat.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => goat.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 208);
  });

  it("Should pay the fee from member: 8", async function () {
    await goat.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => goat.withdraw()).to.changeEtherBalance(accounts[0], 8);
  });
  
  it("Should pay the fee from normal people: 10", async function () {
    await goat.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => goat.withdraw()).to.changeEtherBalance(accounts[0], 10);
  });

  it("Should pay to the artist for 10 tokens of membership: 1596", async function () {
    await goat.mint(10, {
      from: accounts[0].address,
      value: memberPrice * 10
    });
  
    await expect(() => goat.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1596);
  });
  
  it("Should pay the fee for 10 tokens of membership: 84", async function () {
    await goat.mint(10, {
      from: accounts[0].address,
      value: memberPrice * 10
    });
   
    await expect(() => goat.withdraw()).to.changeEtherBalance(accounts[0], 84);
  });

  it("Should pay to the artist for 10 tokens of normal people: 2071", async function () {
    await goat.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: normalPrice * 10
    });
  
    await expect(() => goat.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 2071);
  });
  
  it("Should pay the fee for 10 tokens of normal people: 109", async function () {
    await goat.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: normalPrice * 10
    });
   
    await expect(() => goat.withdraw()).to.changeEtherBalance(accounts[0], 109);
  });

  it("Should not withdraw for not owner", async function () {
    await goat.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice * 1
    });
   
    await expect(goat.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await goat.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(goat.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 165", async function () {
    await goat.mint(10, {
      from: accounts[0].address,
      value: normalPrice * 10
    });
    
    const tokenURI = await goat.tokenURI(165);
    expect(tokenURI).to.be.equal("ipfs://QmSS17dJRM3jmaBELzz1wVuAbmhduF4NCRmpURY6i81vda/165.json");
  });
  
  it("Should modify the baseURI", async function () {
    await goat.mint(10, {
      from: accounts[0].address,
      value: normalPrice * 10
    });

    await goat.setBaseURI("ipfs://testURI");

    const tokenURI = await goat.tokenURI(165);
    expect(tokenURI).to.be.equal("ipfs://testURI/165.json");
  });
}); 

