const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const { sequence } = require("../sequences/scientists-sequence");
const parseEther = ethers.utils.parseEther;
describe("Test 4 Busines logic of CrazyScientists Drop contract", function () {
  let scientists;
  let mockMemberships
  let accounts;
  const normalPrice = 379;
  const memberPrice = 329;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const CrazyScientists = await ethers.getContractFactory("CrazyScientists");
    scientists = await CrazyScientists.deploy(mockMemberships.address, artist.address);
    await scientists.deployed();
    
    await scientists.setSequnceChunk(0, sequence.slice(0, 500));
    await scientists.setSequnceChunk(1, sequence.slice(500, 1000));
    await scientists.setSequnceChunk(2, sequence.slice(1000, 1500));
    await scientists.setSequnceChunk(3, sequence.slice(1500, 2000));
    await scientists.setSequnceChunk(4, sequence.slice(2000, 2500));
    await scientists.setSequnceChunk(5, sequence.slice(2500, 3000));
    await scientists.setSequnceChunk(6, sequence.slice(3000, 3500));
    await scientists.setSequnceChunk(7, sequence.slice(3500, 4000));
    await scientists.setSequnceChunk(8, sequence.slice(4000, 4500));
    await scientists.setSequnceChunk(9, sequence.slice(4500, 5000));
    await scientists.setSequnceChunk(10, sequence.slice(5000, 5555));

    // add whitelist
    await scientists.addWhiteList([accounts[3].address]);
    // initialize the cost for test
    await scientists.setCost(379, false);
    await scientists.setCost(329, true);
  })

  it("Should mint 60 tokens for the artist", async function () {     
    const balance = await scientists.balanceOf(artist.address);
    expect(balance)
      .to.be.equal(60);
  });
  
  it("Should return 5555 for the sequence length", async function () {     
    const length = await scientists.getLen();
    expect(length)
      .to.be.equal(5555);
  });

  it("Should return 5555 for maxSupply()", async function () {    
    expect(await scientists.maxSupply()).to.be.equal(5555);
  });
  
  it("Should return 63 for totalSupply():artist 60 + new 3 tokens", async function () {
      await scientists.mint(3, {
            from: accounts[0].address,
            value: 987
          });
    expect(await scientists.totalSupply()).to.be.equal(63);
  });
  
  it("Should return 5 for canMint()", async function () {    
    expect(await scientists.canMint(accounts[1].address)).to.be.equal(5);
  });
 
  it("Should return 329 for member price", async function () {    
    expect(await scientists.mintCost(accounts[0].address)).to.be.equal(329);
  });
  
  it("Should return 379 for normal price", async function () {    
    expect(await scientists.mintCost(accounts[1].address)).to.be.equal(379);
  });

  it("Should not mint more than 5 at a time", async function () {
    await expect( scientists.mint(6, {
        from: accounts[0].address,
        value: 1974
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 5555 tokens", async function () {
    await scientists.setCost(100, true)
    for(let i = 0; i < 1099; i ++) {
      await scientists.mint(5, {
        from: accounts[0].address,
        value: 100 * 5
      });
    }
    
    await expect( scientists.mint(1, {
      from: accounts[0].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    const tokenURI = await scientists.tokenURI(sequence[5554]);
    expect(tokenURI).to.be.equal(`ipfs://QmWFKmEm9bU2dUqyk7QAHwf2WuG4kX1h4VyijeYKrBhduv/${sequence[5554]}.json`);
  });
  
  it("Should pay to artist from member: 297", async function () {
    await scientists.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => scientists.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 297);
  });

  it("Should pay to artist from normal people: 342", async function () {
    await scientists.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => scientists.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 342);
  });

  it("Should pay to artist from whitelist: 296.1 Cro", async function () {
    await scientists.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: parseEther("329")
    });
   
    await expect(() => scientists.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("296.1"));
  });


  it("Should pay the fee from member: 32 Cro", async function () {
    await scientists.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => scientists.withdraw()).to.changeEtherBalance(accounts[0], 32);
  });
  
  it("Should pay the fee from normal people: 37", async function () {
    await scientists.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => scientists.withdraw()).to.changeEtherBalance(accounts[0], 37);
  });

  it("Should pay the fee from whitelist: 32.9 Cro", async function () {
    await scientists.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: parseEther("329")
    });
   
    await expect(() => scientists.withdraw()).to.changeEtherBalance(accounts[0], parseEther("32.9"));
  });
 
  it("Should pay to the artist for 5 tokens of membership: 1481 Cro", async function () {
    await scientists.mint(5, {
      from: accounts[0].address,
      value: 1645
    });
  
    await expect(() => scientists.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1481);
  });
  
  it("Should pay the fee for 5 tokens of membership: 164 Cro", async function () {
    await scientists.mint(5, {
      from: accounts[0].address,
      value: 1645
    });
   
    await expect(() => scientists.withdraw()).to.changeEtherBalance(accounts[0], 164);
  });

  it("Should pay to the artist for 5 tokens of normal people: 1706", async function () {
    await scientists.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: 1895
    });
  
    await expect(() => scientists.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1706);
  });
  
  it("Should pay the fee for 5 tokens of normal people: 189", async function () {
    await scientists.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: 1895
    });
   
    await expect(() => scientists.withdraw()).to.changeEtherBalance(accounts[0], 189);
  });

  it("Should not withdraw for not owner", async function () {
    await scientists.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(scientists.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await scientists.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(scientists.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await scientists.mint(5, {
      from: accounts[0].address,
      value: 3709
    });
    
    const tokenURI = await scientists.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmWFKmEm9bU2dUqyk7QAHwf2WuG4kX1h4VyijeYKrBhduv/${sequence[4]}.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await scientists.mint(5, {
      from: accounts[0].address,
      value: 3709
    });

    await scientists.setBaseURI("ipfs://testURI");

    const tokenURI = await scientists.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://testURI/${sequence[4]}.json`);
  });

  it("Should check whitelist", async function () {
    expect(await scientists.isWhiteList(accounts[1].address)).to.be.equal(false);
    expect(await scientists.isWhiteList(accounts[3].address)).to.be.equal(true);
  });

  it("Should add and remove whitelist", async function () {
    await scientists.addWhiteList([accounts[0].address, accounts[1].address]);
    expect(await scientists.isWhiteList(accounts[0].address)).to.be.equal(true);
    expect(await scientists.isWhiteList(accounts[1].address)).to.be.equal(true);

    await scientists.removeWhiteList(accounts[0].address);
    expect(await scientists.isWhiteList(accounts[0].address)).to.be.equal(false);
  });
  
  it("Should return all infos", async function () {
    allInfo = await scientists.getInfo();
    // we initilized the reguarcost and membercost with 429 and 399.
    expect(allInfo.regularCost).to.be.equal(379);
    expect(allInfo.memberCost).to.be.equal(329);
    expect(allInfo.whitelistCost).to.be.equal(parseEther("329"));
    expect(allInfo.maxSupply).to.be.equal(5555);
    expect(allInfo.maxMintPerTx).to.be.equal(5);
    expect(allInfo.totalSupply).to.be.equal(60);
  });
}); 

