const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/cronogods-sequence");

const parseEther = ethers.utils.parseEther;
describe("Test 4 Busines logic of CronosGods Drop contract", function () {
  let cronosgod;
  let mockMemberships
  let accounts;
  const normalPrice = parseEther("350");
  const memberPrice = parseEther("295");
  const normalLootPrice = parseEther("43800000");
  const memberLootPrice = parseEther("37000000");
  let artist;
  let mockERC20;
  
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
  
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();
    
    const CronosGod = await ethers.getContractFactory("CronosGods");
    cronosgod = await CronosGod.deploy(mockMemberships.address, artist.address, sequence);
    await cronosgod.deployed();

    // creat mock ERC20 token contract for impersonating Loot contract
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy();
    await mockERC20.deployed();
    await mockERC20.transfer(accounts[1].address, parseEther("438000000"));
    
    await cronosgod.setLootAddress(mockERC20.address);
  })

  it("Should mint 20 tokens for the artist", async function () {     
    const balance = await cronosgod.balanceOf(artist.address);
    expect(balance.toNumber())
      .to.be.equal(20);
  });

  it("Should return 1000 for maxSupply()", async function () {    
    expect(await cronosgod.maxSupply()).to.be.equal(1520);
  });
  
  it("Should return 25 for totalSupply():artist 20 + new 5 tokens", async function () {
    await cronosgod.mint(5, {
          from: accounts[0].address,
          value: parseEther("1475")
          // value: memberPrice * 5
        });
    expect(await cronosgod.totalSupply()).to.be.equal(25);
  });
  
  it("Should return 5 for canMint()", async function () {    
    expect(await cronosgod.canMint(accounts[1].address)).to.be.equal(5);
  });
 
  it("Should return 295 cro for member price", async function () {    
    expect(await cronosgod.mintCost(accounts[0].address)).to.be.equal(parseEther("295"));
  });
  
  it("Should return 350 cro for normal price", async function () {    
    expect(await cronosgod.mintCost(accounts[1].address)).to.be.equal(parseEther("350"));
  });
 
  it("Should return 37000000 loot for member loot price", async function () {    
    expect(await cronosgod.mintLootCost(accounts[0].address)).to.be.equal(parseEther("37000000"));
  });
  
  it("Should return 43800000 loot for normal loot price", async function () {    
    expect(await cronosgod.mintLootCost(accounts[1].address)).to.be.equal(parseEther("43800000"));
  });

  it("Should not mint more than 5 at a time", async function () {
    await expect( cronosgod.mint(6, {
        from: accounts[0].address,
        value: parseEther("1770")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 1520 tokens", async function () {
    await cronosgod.setCost(295, true);
    for(let i = 0; i < 300; i ++) {
      await cronosgod.mint(5, {
        from: accounts[0].address,
        value: 1475
      });
    }
    
    await expect( cronosgod.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    }))
    .to.be.revertedWith("sold out!");  
  });
  
  it("Should pay 265.5 Cro to artist from member", async function () {
    await cronosgod.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("265.5"));
  });

  it("Should pay the fee 29.5 Cro from member", async function () {
    await cronosgod.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
   
    await expect(() => cronosgod.withdraw()).to.changeEtherBalance(accounts[0], parseEther("29.5"));
  });
  
  it("Should pay  33300000 loot to artist from member", async function () {
    await mockERC20.approve(cronosgod.address, memberLootPrice);
    await cronosgod.mintWithLoot(1);
   
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("33300000"));
  });
 
  it("Should pay the fee 3700000 loot from member", async function () {
    await mockERC20.approve(cronosgod.address, memberLootPrice);
    await cronosgod.mintWithLoot(1);
   
    await expect(() => cronosgod.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("3700000"));
  });

  it("Should pay 1327.5 Cro to the artist for 5 tokens from member", async function () {
    await cronosgod.mint(5, {
      from: accounts[0].address,
      value: parseEther("1475")
    });

    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1327.5"));
  });

  it("Should pay 166500000 loot to the artist for 5 tokens from member", async function () {
    await mockERC20.approve(cronosgod.address, parseEther("185000000"));
    await cronosgod.mintWithLoot(5);
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("166500000"));
  });
 
  it("Should pay the fee 147.5 Cro for 5 tokens of membership", async function () {
    await cronosgod.mint(5, {
      from: accounts[0].address,
      value: parseEther("1475")
    });
   
    await expect(() => cronosgod.withdraw()).to.changeEtherBalance(accounts[0], parseEther("147.5"));
  });
  
  it("Should pay the fee  18500000 loot for 5 tokens of member", async function () {
    await mockERC20.approve(cronosgod.address, parseEther("185000000"));
    await cronosgod.mintWithLoot(5);
    await expect(() => cronosgod.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("18500000"));
  });

   // start reduce time test case
   it("Should pay 265.5 Cro to artist from regular people for 2 hours", async function () {
    await cronosgod.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: memberPrice
    });
       
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("265.5"));
  });

  it("Should pay the fee 29.5 Cro from regular people for 2 hours", async function () {
    await cronosgod.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: memberPrice
    });
   
    await expect(() => cronosgod.withdraw()).to.changeEtherBalance(accounts[0], parseEther("29.5"));
  });
  
  it("Should pay  33300000 loot to artist from regular people for 2 hours", async function () {
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, memberLootPrice);
    await cronosgod.connect(accounts[1]).mintWithLoot(1);
   
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("33300000"));
  });
 
  it("Should pay the fee 3700000 loot from regular people for 2 hours", async function () {
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, memberLootPrice);
    await cronosgod.connect(accounts[1]).mintWithLoot(1);
   
    await expect(() => cronosgod.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("3700000"));
  });
  // reduce time test case end

  // after reduce time from regular people
  it("Should pay 315 Cro to artist from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await cronosgod.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("315"));
  });
  
  it("Should pay the fee 35 Cro from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await cronosgod.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(() => cronosgod.withdraw()).to.changeEtherBalance(accounts[0], parseEther("35"));
  });

  it("Should pay 39420000 loot to artist from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, normalLootPrice);
    await cronosgod.connect(accounts[1]).mintWithLoot(1);
   
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("39420000"));
  });
 
  it("Should pay the fee 4380000 loot from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, normalLootPrice);
    await cronosgod.connect(accounts[1]).mintWithLoot(1);
   
    await expect(() => cronosgod.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("4380000"));
  });

  it("Should pay 1575 Cro to the artist for 5 tokens of regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await cronosgod.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: parseEther("1750")
    });
  
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1575"));
  });
  
  it("Should pay the fee 175 Cro for 5 tokens of regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await cronosgod.connect(accounts[1]).mint(5, {
      from: accounts[1].address,
      value: parseEther("1750")
    });
   
    await expect(() => cronosgod.withdraw()).to.changeEtherBalance(accounts[0], parseEther("175"));
  });

  it("Should pay 197100000 loot to artist from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, parseEther("219000000"));
    await cronosgod.connect(accounts[1]).mintWithLoot(5);
   
    await expect(() => cronosgod.withdrawPayments(artist.address)).to.changeTokenBalance(mockERC20, artist, parseEther("197100000"));
  });
 
  it("Should pay the fee 21900000 loot from regular people", async function () {
    await ethers.provider.send('evm_increaseTime', [7201]);
    await ethers.provider.send('evm_mine');
    await mockERC20.connect(accounts[1]).approve(cronosgod.address, parseEther("219000000"));
    await cronosgod.connect(accounts[1]).mintWithLoot(5);
   
    await expect(() => cronosgod.withdraw()).to.changeTokenBalance(mockERC20, accounts[0], parseEther("21900000"));
  });

  it("Should not withdraw for not owner", async function () {
    await cronosgod.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: normalPrice
    });
   
    await expect(cronosgod.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {
    await cronosgod.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    await expect(cronosgod.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it("Should return tokenURI when token ID 25", async function () {
    await cronosgod.mint(1, {
      from: accounts[0].address,
      value: parseEther("295")
    });
    
    const tokenURI = await cronosgod.tokenURI(954);
    expect(tokenURI).to.be.equal("ipfs://Qmc8Z622wy9zCeFnFgwyAsh7vNdYt8idYcmmsRkCXtXMAx/954.json");
  });
  
  it("Should modify the baseURI", async function () {
    await cronosgod.setCost(295, true);
    await cronosgod.mint(1, {
      from: accounts[0].address,
      value: 295
    });

    await cronosgod.setBaseURI("ipfs://testURI");

    const tokenURI = await cronosgod.tokenURI(954);
    expect(tokenURI).to.be.equal("ipfs://testURI/954.json");
  });
  
  it("Should not modify the baseURI for not owner", async function () {
    await expect(cronosgod.connect(accounts[1]).setBaseURI("ipfs://testURI")).to.be.revertedWith("Ownable: caller is not the owner");
  });
}); 

