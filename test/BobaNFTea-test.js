const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/bobaNFTea-sequence");
// const airdroplist = require("../airdroplists/airdroplist_bobaNFTea.json");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of BobaNFTea Drop contract", function () {
  let bobaNFTea;
  let mockMemberships
  let accounts;
  const regularPrice = parseEther("180");
  const memberPrice = parseEther("150");
  const whitePrice = parseEther("150");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];

    // creat mock ERC20 token contract for impersonating Loot contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();

    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const BobaNFTea = await ethers.getContractFactory("BobaNFTea");
    bobaNFTea = await BobaNFTea.deploy(mockMemberships.address, artist.address);
    await bobaNFTea.deployed();

    await bobaNFTea.setLootContractAddress(mockERC20.address);
    
    await bobaNFTea.setSequnceChunk(0, sequence.slice(0, 500));
    await bobaNFTea.setSequnceChunk(1, sequence.slice(500, 1000));
    await bobaNFTea.setSequnceChunk(2, sequence.slice(1000, 1500));
    await bobaNFTea.setSequnceChunk(3, sequence.slice(1500, 2000));
    await bobaNFTea.setSequnceChunk(4, sequence.slice(2000, 2500));
    await bobaNFTea.setSequnceChunk(5, sequence.slice(2500, 3000));
    await bobaNFTea.setSequnceChunk(6, sequence.slice(3000));
  })

  it("Should mint 18 tokens for the artist", async function () {     
    const balance = await bobaNFTea.balanceOf(artist.address);
    expect(balance).to.be.equal(18);
    
    let tokenURI = await bobaNFTea.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://QmSF7q98efKi7ZkGb1LErDDK78i7gzzCWLkrzCiMGJNR7m/1.json`);

    tokenURI = await bobaNFTea.tokenURI(18);
    expect(tokenURI).to.be.equal(`ipfs://QmSF7q98efKi7ZkGb1LErDDK78i7gzzCWLkrzCiMGJNR7m/18.json`);
  });
  
  it("Should return 3282 for the sequence length", async function () {     
    const length = await bobaNFTea.getLen();
    expect(length)
      .to.be.equal(3282);
  });

  it("Should return 3300 for maxSupply()", async function () {    
    expect(await bobaNFTea.maxSupply()).to.be.equal(3300);
  });
  
  it("Should return 21 for totalSupply():artist 18 + new 3 tokens", async function () {
      await bobaNFTea.mint(3, {
            from: accounts[0].address,
            value: parseEther("450")
          });
    expect(await bobaNFTea.totalSupply()).to.be.equal(21);
  });
  
  it("Should return 20 for canMint()", async function () {    
    expect(await bobaNFTea.canMint(accounts[1].address)).to.be.equal(20);
  });
 
  it("Should return 150 for member price", async function () {    
    expect(await bobaNFTea.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  });
  
  it("Should return 180 for regular price", async function () {    
    expect(await bobaNFTea.mintCost(accounts[1].address)).to.be.equal(regularPrice);
  });

  it("Should not mint more than 20 at a time", async function () {
    await bobaNFTea.setCost(100, true)
    await expect( bobaNFTea.mint(21, {
        from: accounts[0].address,
        value: 2100
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 3300 tokens", async function () {
    await bobaNFTea.setCost(100, false)
   
    for(let i = 0; i < 164; i ++) {
      await bobaNFTea.connect(accounts[1]).mint(20, {
        from: accounts[1].address,
        value: 100 * 20
      });
    }
    await bobaNFTea.connect(accounts[1]).mint(2, {
      from: accounts[1].address,
      value: 100 * 2
    });
    
    await expect( bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    const tokenURI = await bobaNFTea.tokenURI(sequence[2349]);
    expect(tokenURI).to.be.equal(`ipfs://QmSF7q98efKi7ZkGb1LErDDK78i7gzzCWLkrzCiMGJNR7m/${sequence[2349]}.json`);
  });
  
  it("Should pay to artist from member: 135 Cro", async function () {
    await bobaNFTea.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => bobaNFTea.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("135"));
  });

  it("Should pay to artist from whitelist: 135 Cro", async function () {
    await mockERC20.transfer(accounts[1].address, 1000000);

    await bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: whitePrice
    });
   
    await expect(() => bobaNFTea.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("135"));
  });

  it("Should pay to artist from regular people: 162 Cro", async function () {
    await bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(() => bobaNFTea.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("162"));
  });

  it("Should pay the fee from member: 15 Cro", async function () {
    await bobaNFTea.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => bobaNFTea.withdraw()).to.changeEtherBalance(accounts[0], parseEther("15"));
  });

  it("Should pay the fee from whitelist: 15 Cro", async function () {
    await mockERC20.transfer(accounts[1].address, 1000000);

    await bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: whitePrice
    });
   
    await expect(() => bobaNFTea.withdraw()).to.changeEtherBalance(accounts[0], parseEther("15"));
  });
  
  it("Should pay the fee from regular people: 18 Cro", async function () {
    await bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(() => bobaNFTea.withdraw()).to.changeEtherBalance(accounts[0], parseEther("18"));
  });
 
  it("Should pay to the artist for 20 tokens of membership: 2700 Cro", async function () {
    await bobaNFTea.mint(20, {
      from: accounts[0].address,
      value: parseEther("3000")
    });
  
    await expect(() => bobaNFTea.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2700"));
  });
  
  it("Should pay the fee for 20 tokens of membership: 300 Cro", async function () {
    await bobaNFTea.mint(20, {
      from: accounts[0].address,
      value: parseEther("3000")
    });
   
    await expect(() => bobaNFTea.withdraw()).to.changeEtherBalance(accounts[0], parseEther("300"));
  });

  it("Should pay to the artist for 20 tokens of regular people: 3240 Cro", async function () {
    await bobaNFTea.connect(accounts[1]).mint(20, {
      from: accounts[1].address,
      value: parseEther("3600")
    });
  
    await expect(() => bobaNFTea.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("3240"));
  });
  
  it("Should pay the fee for 20 tokens of regular people: 360", async function () {
    await bobaNFTea.connect(accounts[1]).mint(20, {
      from: accounts[1].address,
      value: parseEther("3600")
    });
   
    await expect(() => bobaNFTea.withdraw()).to.changeEtherBalance(accounts[0], parseEther("360"));
  });

  it("Should not withdraw for not owner", async function () {
    await bobaNFTea.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(bobaNFTea.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {    
    await expect(bobaNFTea.tokenURI(sequence[150])).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await bobaNFTea.mint(5, {
      from: accounts[0].address,
      value: parseEther("750")
    });
    
    const tokenURI = await bobaNFTea.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmSF7q98efKi7ZkGb1LErDDK78i7gzzCWLkrzCiMGJNR7m/${sequence[4]}.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await bobaNFTea.setBaseURI("ipfs://testURI");

    const tokenURI = await bobaNFTea.tokenURI(18);
    expect(tokenURI).to.be.equal(`ipfs://testURI/18.json`);
  });
  
  it("Should return all infos", async function () {
    allInfo = await bobaNFTea.getInfo();
    expect(allInfo.regularCost).to.be.equal(regularPrice);
    expect(allInfo.memberCost).to.be.equal(memberPrice);
    expect(allInfo.whitelistCost).to.be.equal(whitePrice);
    expect(allInfo.maxSupply).to.be.equal(3300);
    expect(allInfo.maxMintPerTx).to.be.equal(20);
    expect(allInfo.totalSupply).to.be.equal(18);
  });
}); 

