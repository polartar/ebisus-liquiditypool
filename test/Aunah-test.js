const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/aunah-sequence");
const parseEther = ethers.utils.parseEther;

describe("Test 4 Busines logic of Aunah Drop contract", function () {
  // let aunah;
  // let mockMemberships
  // let accounts;
  // const normalPrice = parseEther("600");
  // const memberPrice = parseEther("500");
  // let artist;

  // beforeEach(async function () {
  //   accounts = await ethers.getSigners();
  //   artist = accounts[2];
  //   const MockMemberships = await ethers.getContractFactory("MockMemberships");
  //   mockMemberships = await MockMemberships.deploy(5, 3);
  //   await mockMemberships.deployed();

  //   const Aunah = await ethers.getContractFactory("Aunah");
  //   aunah = await Aunah.deploy(mockMemberships.address, artist.address, sequence);
  //   await aunah.deployed();
  // })

  // it("Should return 81 for maxSupply()", async function () {    
  //   expect(await aunah.maxSupply()).to.be.equal(81);
  // });
    
  // it("Should return 1 for canMint()", async function () {    
  //   expect(await aunah.canMint(accounts[1].address)).to.be.equal(1);
  // });
 
  // it("Should return 500 Cro for member price", async function () {    
  //   expect(await aunah.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  // });
  
  // it("Should return 600 Cro for normal price", async function () {    
  //   expect(await aunah.mintCost(accounts[1].address)).to.be.equal(normalPrice);
  // });

  // it("Should not mint more than 1 at a time", async function () {
  //   await expect( aunah.mint(2, {
  //       from: accounts[0].address,
  //       value: parseEther("1000")
  //     }))
  //     .to.be.revertedWith("not mint more than one");  
  // });

  // it("Should not mint more than 81 tokens", async function () {
  //   await aunah.setCost(100, true);
  //   for(let i = 0; i < 81; i ++) {
  //     await aunah.mint(1, {
  //       from: accounts[0].address,
  //       value: 100
  //     });
  //   }
    
  //   await expect( aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: 100
  //   }))
  //   .to.be.revertedWith("sold out!");  
  // });
  
  // it("Should pay to artist from member: 475 Cro", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
       
  //   await expect(() => aunah.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("475"));
  // });

  // it("Should pay to artist from normal people: 570 Cro", async function () {
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
   
  //   await expect(() => aunah.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("570"));
  // });

  // it("Should pay the fee from member: 25 Cro", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
   
  //   await expect(() => aunah.withdraw()).to.changeEtherBalance(accounts[0], parseEther("25"));
  // });
  
  // it("Should pay the fee from normal people: 30 Cro", async function () {
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
   
  //   await expect(() => aunah.withdraw()).to.changeEtherBalance(accounts[0], parseEther("30"));
  // });

  // it("Should pay to the artist for 2 tokens of membership: 950 Cro", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
  
  //   await expect(() => aunah.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("950"));
  // });
  
  // it("Should pay the fee for 10 tokens of membership: 50", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: memberPrice
  //   });
   
  //   await expect(() => aunah.withdraw()).to.changeEtherBalance(accounts[0], parseEther("50"));
  // });

  // it("Should pay to the artist for 2 tokens of normal people: 1140 Cro", async function () {
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
  
  //   await expect(() => aunah.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("1140"));
  // });
  
  // it("Should pay the fee for 2 tokens of normal people: 60 Cro", async function () {
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
   
  //   await expect(() => aunah.withdraw()).to.changeEtherBalance(accounts[0], parseEther("60"));
  // });

  // it("Should not withdraw for not owner", async function () {
  //   await aunah.connect(accounts[1]).mint(1, {
  //     from: accounts[1].address,
  //     value: normalPrice
  //   });
   
  //   await expect(aunah.connect(accounts[1]).withdraw())
  //     .to.be.revertedWith("Ownable: caller is not the owner");
  // });

  // it("Should not return tokenURI when token ID not exist", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: normalPrice
  //   });
    
  //   await expect(aunah.tokenURI(23)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  // });
 
  // it("Should return tokenURI when token ID 78", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: normalPrice
  //   });
    
  //   const tokenURI = await aunah.tokenURI(78);
  //   expect(tokenURI).to.be.equal("ipfs://QmU7gdQnyR3HwBpyEfEjyEnru1oLP5uYz9WRDDguu6pSpY/78.json");
  // });
  
  // it("Should modify the baseURI", async function () {
  //   await aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: normalPrice
  //   });

  //   await aunah.setBaseURI("ipfs://testURI");

  //   const tokenURI = await aunah.tokenURI(78);
  //   expect(tokenURI).to.be.equal("ipfs://testURI/78.json");
  // });
 
  // it("Should not mint when paused", async function () {
  //   await aunah.pause();
  //   await expect(aunah.mint(1, {
  //     from: accounts[0].address,
  //     value: normalPrice
  //   })).to.be.revertedWith("Pausable: paused");
  // });
}); 

