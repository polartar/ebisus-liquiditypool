const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of LootCougers Drop contract", function () {
  const whiteList = ["0xbd4D0EA67F832D272532055f5F52053e4509c4a1","0xac1FF0907A86765E9aacdf2C78748B4e25Af9c0d","0x9b9e9EF7D84691e1c31FcC1f3b9A49A21936C627"];
  let lootCougers;
  let mockMemberships
  let accounts;
  let artist;
  let mockERC20;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    whiteList.push(accounts[3].address)
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();
    
    // creat mock ERC20 token contract for impersonating Loot contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();
    
    const LootCougers = await ethers.getContractFactory("LootCougers");
    lootCougers = await LootCougers.deploy(mockMemberships.address, artist.address,  whiteList, mockERC20.address);
    await lootCougers.deployed();

    // initialize the cost for test
    await lootCougers.setCost(250, false)
    await lootCougers.setCost(200, true)
  })

  it("Should not mint more than 2222", async function () {     
    await lootCougers.setCost(1, true)
    for(let i =0; i< 110; i ++) {
      await lootCougers.mint(20, {
        from: accounts[0].address,
        value: 20
      });
    }

    await lootCougers.mint(8, {
      from: accounts[0].address,
      value: 8
    });

    await expect( lootCougers.mint(1, {
        from: accounts[0].address,
        value: 1
      }))
      .to.be.revertedWith("sold out!");  
  });

  it("Should not mint more than 20 tokens", async function () {
    await lootCougers.mint(20, {
      from: accounts[0].address,
      value: 4000
    });

    await expect( lootCougers.mint(21, {
      from: accounts[0].address,
      value: 4200
    }))
    .to.be.revertedWith("not mint more than 20");  
  });

  it("Should pay to artist from member: 180", async function () {
    await lootCougers.mint(1, {
      from: accounts[0].address,
      value: 200
    });
       
    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 180);
  });

  it("Should pay to artist from normal people: 225", async function () {
    await lootCougers.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 250
    });
   
    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 225);
  });

  it("Should pay to artist 180 for 1M loot holder", async function () {
    await mockERC20.transfer(accounts[1].address, 1000000);

    await lootCougers.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 200
    });
   
    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 180);
  });
  
  it("Should pay to artist 190 for whitelisted user", async function () {
    await lootCougers.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: 200
    });
   
    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 180);
  });

  it("Should pay the fee from member: 20", async function () {
    await lootCougers.mint(1, {
      from: accounts[0].address,
      value: 200
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 20);
  });
  
  it("Should pay the fee from normal people: 25", async function () {
    await lootCougers.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 250
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 25);
  });

  it("Should pay the fee 20 for whitelisted user", async function () {
    await lootCougers.connect(accounts[3]).mint(1, {
      from: accounts[3].address,
      value: 200
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 20);
  });
  
  it("Should pay the fee 20 for 1M loot holder", async function () {
    await mockERC20.transfer(accounts[1].address, 1000000);

    await lootCougers.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 200
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 20);
  });

  it("Should pay to the artist for 10 member tokens: 1800", async function () {
    await lootCougers.mint(10, {
      from: accounts[0].address,
      value: 2000
    });

    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1800);
  });
  
  it("Should pay the fee for 10 member tokens: 200", async function () {
    await lootCougers.mint(10, {
      from: accounts[0].address,
      value: 2000
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 200);
  });

  it("Should check isWhitelist()", async function () {   
    expect(await lootCougers.isWhiteList(accounts[0].address)).to.equal(false);
    expect(await lootCougers.isWhiteList(accounts[3].address)).to.equal(true);
  });

  it("Should add whitelist", async function () {
    await lootCougers.addWhiteList([accounts[4].address, accounts[5].address]);
    expect(await lootCougers.isWhiteList(accounts[4].address)).to.equal(true);
    expect(await lootCougers.isWhiteList(accounts[5].address)).to.equal(true);
  });
  
  it("Should remove whitelist", async function () {
    await lootCougers.addWhiteList([accounts[4].address]);
    expect(await lootCougers.isWhiteList(accounts[4].address)).to.equal(true);
    await lootCougers.removeWhiteList(accounts[4].address);
    expect(await lootCougers.isWhiteList(accounts[4].address)).to.equal(false);
  });
  
  it("Should not add whitelist when not owner", async function () {
    await expect(lootCougers.connect(accounts[1]).addWhiteList([accounts[4].address])).to.be.revertedWith("Ownable: caller is not the owner");
  });
 
  it("Should not remove whitelist when not owner", async function () {
    await expect(lootCougers.connect(accounts[1]).removeWhiteList(accounts[4].address)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should pay to the artist for 10 normal tokens: 2250", async function () {
    await lootCougers.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 2500
    });

    await expect(() => lootCougers.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 2250);
  });
  
  it("Should pay the fee for 10 member tokens: 250", async function () {
    await lootCougers.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 2500
    });
   
    await expect(() => lootCougers.withdraw()).to.changeEtherBalance(accounts[0], 250);
  });

  it("Should not withdraw for not owner", async function () {
    await lootCougers.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 250
    });
   
    await expect(lootCougers.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await lootCougers.mint(1, {
      from: accounts[0].address,
      value: 250
    });
    
    await expect(lootCougers.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 11", async function () {
    await lootCougers.mint(20, {
      from: accounts[0].address,
      value: 4000
    });
    
    const tokenURI = await lootCougers.tokenURI(11);
    expect(tokenURI).to.be.equal("ipfs://QmQgrHzH7E3FeuLV6uEr4PVFJbDbF1vUjhHp8i9uhzD1u9/11.json");
  });
}); 

