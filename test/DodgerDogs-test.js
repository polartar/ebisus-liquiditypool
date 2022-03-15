const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/dodgerdogs-sequence");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of DodgerDogs Drop contract", function () {
  let dodgerdogs;
  let mockMemberships
  let accounts;
  const normalPrice = parseEther("300");
  const memberPrice = parseEther("200");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const DodgerDogs = await ethers.getContractFactory("DodgerDogs");
    dodgerdogs = await DodgerDogs.deploy(mockMemberships.address, artist.address);
    await dodgerdogs.deployed();

    await dodgerdogs.setSequnceChunk(0, sequence.slice(0, 500));
    await dodgerdogs.setSequnceChunk(1, sequence.slice(500));
  })
  it("Should return 1111 for the sequence length", async function () {     
    const length = await dodgerdogs.getLen();
    expect(length)
      .to.be.equal(1111);
  });

  it("Should return 1111 for maxSupply()", async function () {    
    expect(await dodgerdogs.maxSupply()).to.be.equal(1111);
  });
    
  it("Should return 5 for canMint()", async function () {    
    expect(await dodgerdogs.canMint(accounts[1].address)).to.be.equal(5);
  });
 
  it("Should return 200 Cro for member price", async function () {    
    expect(await dodgerdogs.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  });
  
  it("Should return 300 Cro for normal price", async function () {    
    expect(await dodgerdogs.mintCost(accounts[1].address)).to.be.equal(normalPrice);
  });

  it("Should not mint more than 5 at a time", async function () {
    await expect( dodgerdogs.mint(6, {
        from: accounts[0].address,
        value: parseEther("1200")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 1111 tokens", async function () {
    await dodgerdogs.setCost(100, true);
    for(let i = 0; i < 222; i ++) {
      await dodgerdogs.mint(5, {
        from: accounts[0].address,
        value: 500
      });
    }

    await expect( dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: 100
    }))
    
    await expect( dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: 100
    }))
    .to.be.revertedWith("sold out!");  
  });
  
  it("Should pay to artist from member: 180 Cro", async function () {
    await dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => dodgerdogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("180"));
  });

  it("Should pay to artist from normal people: 270 Cro", async function () {
    await dodgerdogs.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => dodgerdogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("270"));
  });

  it("Should pay the fee from member: 20 Cro", async function () {
    await dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => dodgerdogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("20"));
  });
  
  it("Should pay the fee from normal people: 30 Cro", async function () {
    await dodgerdogs.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => dodgerdogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("30"));
  });

  it("Should pay to the artist for 5 tokens from membership: 900 Cro", async function () {
    await dodgerdogs.mint(5, {
      from: accounts[0].address,
      value: parseEther("1000")
    });
    
    await expect(() => dodgerdogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("900"));
  });
  
  it("Should pay the fee for 5 tokens from membership: 100 Cro", async function () {
    await dodgerdogs.mint(5, {
      from: accounts[0].address,
      value: parseEther("1000")
    });
   
    await expect(() => dodgerdogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("100"));
  });

  it("Should pay to the artist for 5 tokens from normal people: 1350 Cro", async function () {
    await dodgerdogs.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: parseEther("1500")
    });
  
    await expect(() => dodgerdogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1350"));
  });
  
  it("Should pay the fee for 5 tokens from normal people: 150 Cro", async function () {
    await dodgerdogs.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: parseEther("1500")
    });
   
    await expect(() => dodgerdogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("150"));
  });

  it("Should not withdraw for not owner", async function () {
    await dodgerdogs.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(dodgerdogs.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(dodgerdogs.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 90", async function () {
    await dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    const tokenURI = await dodgerdogs.tokenURI(90);
    expect(tokenURI).to.be.equal("ipfs://QmXLTCf7KpzeJyutfMnw9dtczmNHgzTAp21DBcZ3z1a1s2/90.json");
  });
  
  it("Should modify the baseURI", async function () {
    await dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });

    await dodgerdogs.setBaseURI("ipfs://testURI");

    const tokenURI = await dodgerdogs.tokenURI(sequence[0]);
    expect(tokenURI).to.be.equal(`ipfs://testURI/${sequence[0]}.json`);
  });
 
  it("Should not mint when paused", async function () {
    await dodgerdogs.pause();
    await expect(dodgerdogs.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    })).to.be.revertedWith("Pausable: paused");
  });

  it("Should return all infos", async function () {
    await dodgerdogs.mint(5, {
      from: accounts[0].address,
      value: parseEther("1000")
    });
    allInfo = await dodgerdogs.getInfo();
    expect(allInfo.regularCost).to.be.equal(normalPrice);
    expect(allInfo.memberCost).to.be.equal(memberPrice);
    expect(allInfo.maxSupply).to.be.equal(1111);
    expect(allInfo.maxMintPerTx).to.be.equal(5);
    expect(allInfo.totalSupply).to.be.equal(5);
  });
}); 

