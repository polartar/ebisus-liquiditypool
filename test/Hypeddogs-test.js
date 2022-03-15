const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/hypeddogs-sequence");
const whitelist = require("../whitelists/whitelist-hypeddogs.json");

const parseEther = ethers.utils.parseEther;
describe("Test 4 Busines logic of HypedDogs Drop contract", function () {
  let hypeddogs;
  let mockMemberships
  let accounts;
  const normalPrice = parseEther("199");
  const memberPrice = parseEther("150");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const HypedDogs = await ethers.getContractFactory("HypedDogs");
    hypeddogs = await HypedDogs.deploy(mockMemberships.address, artist.address);
    await hypeddogs.deployed();
    
    await hypeddogs.setSequnceChunk(0, sequence.slice(0, 500));
    await hypeddogs.setSequnceChunk(1, sequence.slice(500, 1000));
    await hypeddogs.setSequnceChunk(2, sequence.slice(1000, 1500));
    await hypeddogs.setSequnceChunk(3, sequence.slice(1500, 2000));
    await hypeddogs.setSequnceChunk(4, sequence.slice(2000, 2500));
    await hypeddogs.setSequnceChunk(5, sequence.slice(2500, 3000));

    // add whitelist
    await hypeddogs.addWhiteList([accounts[3].address]);
    // initialize the cost for test
  })

  it("Should mint 40 tokens for the artist", async function () {     
    const balance = await hypeddogs.balanceOf(artist.address);
    expect(balance)
      .to.be.equal(40);
  });

  it("Should add whitelists", async function () {    
    await hypeddogs.addWhiteList(whitelist);
    expect(await hypeddogs.isWhiteList(whitelist[0])).to.be.equal(true);
    expect(await hypeddogs.isWhiteList(whitelist[whitelist.length - 1])).to.be.equal(true);
  });
  
  it("Should return 3000 for the sequence length", async function () {     
    const length = await hypeddogs.getLen();
    expect(length)
      .to.be.equal(3000);
  });

  it("Should return 3000 for maxSupply()", async function () {    
    expect(await hypeddogs.maxSupply()).to.be.equal(3000);
  });
  
  it("Should return 43 for totalSupply():artist 40 + new 3 tokens", async function () {
      await hypeddogs.mint(3, {
            from: accounts[0].address,
            value: parseEther("450")
          });
    expect(await hypeddogs.totalSupply()).to.be.equal(43);
  });
  
  it("Should return 7 for canMint()", async function () {    
    expect(await hypeddogs.canMint(accounts[1].address)).to.be.equal(7);
  });
 
  it("Should return 150 for member price", async function () {    
    expect(await hypeddogs.mintCost(accounts[0].address)).to.be.equal(parseEther("150"));
  });
  
  it("Should return 199 for normal price", async function () {    
    expect(await hypeddogs.mintCost(accounts[1].address)).to.be.equal(parseEther("199"));
  });

  it("Should not mint more than 7 at a time", async function () {
    await expect( hypeddogs.mint(8, {
        from: accounts[0].address,
        value: parseEther("1200")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 3000 tokens", async function () {
    await hypeddogs.setMemberCost(100)
    for(let i = 0; i < 422; i ++) {
      await hypeddogs.mint(7, {
        from: accounts[0].address,
        value: 100 * 7
      });
    }
    await expect( hypeddogs.mint(6, {
      from: accounts[0].address,
      value: 100 * 6
    }))
    await expect( hypeddogs.mint(1, {
      from: accounts[0].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    const tokenURI = await hypeddogs.tokenURI(sequence[2999]);
    expect(tokenURI).to.be.equal(`ipfs://QmVrQn636nnesgumtEjUEdy3NEyVHWb4ZBGfFbxL951DeX/${sequence[2999]}.json`);
  });
  
  it("Should pay 127.5 Cro to the artist and 22.5 Cro to the fee from member", async function () {
    await hypeddogs.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => hypeddogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("127.5"));
    await expect(() => hypeddogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("22.5"));
  });

  it("Should pay 127.5 Cro to the artist and 22.5 Cro to the fee from whitelist", async function () {
    await hypeddogs.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: parseEther("150")
    });
   
    await expect(() => hypeddogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("127.5"));
    await expect(() => hypeddogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("22.5"));
  });
  
  it("Should pay 169.15 Cro to the artist and 29.85 Cro to the fee from regular people", async function () {
    await hypeddogs.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => hypeddogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("169.15"));
    await expect(() => hypeddogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("29.85"));
  });

  it("Should pay 892.5 Cro to the artist and 157.5 Cro to the fee for 7 tokens from membership", async function () {
    await hypeddogs.mint(7, {
      from: accounts[0].address,
      value: parseEther("1050")
    });
  
    await expect(() => hypeddogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("892.5"));
    await expect(() => hypeddogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("157.5"));
  });
  
  it("Should pay 1184.05 Cro to the artist and 208.95 Cro to the fee for 7 tokens from regular people", async function () {
    await hypeddogs.connect(accounts[1]).mint(7, {
      from: accounts[1].address,
      value: parseEther("1393")
    });
  
    await expect(() => hypeddogs.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1184.05"));
    await expect(() => hypeddogs.withdraw()).to.changeEtherBalance(accounts[0], parseEther("208.95"));
  });

  it("Should not withdraw for not owner", async function () {
    await hypeddogs.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(hypeddogs.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await hypeddogs.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(hypeddogs.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await hypeddogs.mint(5, {
      from: accounts[0].address,
      value: parseEther("3709")
    });
    
    const tokenURI = await hypeddogs.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmVrQn636nnesgumtEjUEdy3NEyVHWb4ZBGfFbxL951DeX/${sequence[4]}.json`);
  });
  
  it("Should modify the baseURI", async function () {
    await hypeddogs.mint(5, {
      from: accounts[0].address,
      value: parseEther("1000")
    });

    await hypeddogs.setBaseURI("ipfs://testURI");

    const tokenURI = await hypeddogs.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://testURI/${sequence[4]}.json`);
  });

  it("Should check whitelist", async function () {
    expect(await hypeddogs.isWhiteList(accounts[1].address)).to.be.equal(false);
    expect(await hypeddogs.isWhiteList(accounts[3].address)).to.be.equal(true);
  });

  it("Should add and remove whitelist", async function () {
    await hypeddogs.addWhiteList([accounts[0].address, accounts[1].address]);
    expect(await hypeddogs.isWhiteList(accounts[0].address)).to.be.equal(true);
    expect(await hypeddogs.isWhiteList(accounts[1].address)).to.be.equal(true);

    await hypeddogs.removeWhiteList(accounts[0].address);
    expect(await hypeddogs.isWhiteList(accounts[0].address)).to.be.equal(false);
  });
  
  it("Should return all infos", async function () {
    allInfo = await hypeddogs.getInfo();
    // we initilized the reguarcost and membercost with 429 and 399.
    expect(allInfo.regularCost).to.be.equal(parseEther("199"));
    expect(allInfo.memberCost).to.be.equal(parseEther("150"));
    expect(allInfo.whitelistCost).to.be.equal(parseEther("150"));
    expect(allInfo.maxSupply).to.be.equal(3000);
    expect(allInfo.maxMintPerTx).to.be.equal(7);
    expect(allInfo.totalSupply).to.be.equal(40);
  });
}); 

