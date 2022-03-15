const { expect } = require("chai");
const { ethers } = require("hardhat");
const { sequence } = require("../sequences/slothty-sequence");
const whitelist = require("../whitelists/whitelist_slothty.json");
const airdropPath = "airdroplists/airdroplist_slothty.csv";
const parseEther = ethers.utils.parseEther;
const csvToJson = require('csvtojson');

describe("Test 4 Busines logic of Slothty Drop contract", function () {
  let slothty;
  let mockMemberships
  let accounts;
  const regularPrice = parseEther("299");
  const memberPrice = parseEther("249");
  const whitePrice = parseEther("249");
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(5, 3);
    await mockMemberships.deployed();

    const Slothty = await ethers.getContractFactory("Slothty");
    slothty = await Slothty.deploy(mockMemberships.address, artist.address);
    await slothty.deployed();

    await slothty.mintForArtist(50);
    await slothty.mintForArtist(50);

    let i = 0;
    const sequenceLen = sequence.length;
    while(i * 500 < sequenceLen) {
      if ((i + 1) * 500 >= sequenceLen) {
        await slothty.setSequnceChunk(i, sequence.slice(i * 500));
        break;
      } else {
        await slothty.setSequnceChunk(i, sequence.slice(i * 500, i * 500 + 500));
      }
      i ++;
    }
  })

  it("Should mint 100 tokens for the artist", async function () {     
    const balance = await slothty.balanceOf(artist.address);
    expect(balance).to.be.equal(100);
    await slothty.reveal();
    let tokenURI = await slothty.tokenURI(1);
    expect(tokenURI).to.be.equal(`ipfs://QmNWJw5VZKkbiGKEaUEViniYQHDV3rc15R4EHBj1xPoCw3/1.json`);

    tokenURI = await slothty.tokenURI(100);
    expect(tokenURI).to.be.equal(`ipfs://QmNWJw5VZKkbiGKEaUEViniYQHDV3rc15R4EHBj1xPoCw3/100.json`);
  });
  
  it("Should return 8788 for the sequence length", async function () {     
    const length = await slothty.getLen();
    expect(length)
      .to.be.equal(8788);
  });

  it("Should return 8888 for maxSupply()", async function () {    
    expect(await slothty.maxSupply()).to.be.equal(8888);
  });
  
  it("Should mint for airdrops", async function () {    
    const recipients = await csvToJson({
        trim:true
    }).fromFile(airdropPath);

    const failedList = [];
    const len = recipients.length;
    let totalAirdrops = 0;

    for(let i = 0; i < len; i ++) {
      try {
        await slothty.airdropMint(recipients[i].Address, parseInt(recipients[i].Count));
        totalAirdrops += parseInt(recipients[i].Count);
      } catch(err) {
        failedList.push(recipients[i]);
      }
    }

    expect(failedList.length).to.eq(0);

    await slothty.reveal();
    const tokenURI = await slothty.tokenURI(sequence[totalAirdrops-1]);
    expect(tokenURI).to.be.equal(`ipfs://QmNWJw5VZKkbiGKEaUEViniYQHDV3rc15R4EHBj1xPoCw3/${sequence[totalAirdrops-1]}.json`);
  });
  
  it("Should return 103 for totalSupply():artist 100 + new 3 tokens", async function () {
    await slothty.mint(3, {
          from: accounts[0].address,
          value: parseEther("747")
        });
    expect(await slothty.totalSupply()).to.be.equal(103);
  });
  
  it("Should return 10 for canMint()", async function () {    
    expect(await slothty.canMint(accounts[1].address)).to.be.equal(10);
  });
 
  it("Should return 249 for member price", async function () {    
    expect(await slothty.mintCost(accounts[0].address)).to.be.equal(memberPrice);
  });
  
  it("Should return 299 for regular price", async function () {    
    expect(await slothty.mintCost(accounts[1].address)).to.be.equal(regularPrice);
  });

  it("Should return 249 for white price", async function () {    
    await slothty.addWhitelistAddress(whitelist[0]);
    expect(await slothty.mintCost(whitelist[0])).to.be.equal(whitePrice);
  });

  it("Should not mint more than 10 at a time", async function () {
    await expect( slothty.mint(11, {
        from: accounts[0].address,
        value: parseEther("2290")
      }))
      .to.be.revertedWith("not mint more than max amount");  
  });

  it("Should not mint more than 8888 tokens", async function () {
    await slothty.setMemberCost(100)
    for(let i = 0; i < 878; i ++) {
      await slothty.mint(10, {
        from: accounts[0].address,
        value: 100 * 10
      });
    }

    await slothty.mint(8, {
      from: accounts[0].address,
      value: 100 * 8
    });
    
    await expect( slothty.mint(1, {
      from: accounts[0].address,
      value: 100 * 1
    }))
    .to.be.revertedWith("sold out!");  

    await slothty.reveal();

    const tokenURI = await slothty.tokenURI(sequence[8786]);
    expect(tokenURI).to.be.equal(`ipfs://QmNWJw5VZKkbiGKEaUEViniYQHDV3rc15R4EHBj1xPoCw3/${sequence[8786]}.json`);
  });
  
  it("Should pay 24.9Cro fee and 224.1 Cro to artist from member", async function () {
    await slothty.mint(1, {
      from: accounts[0].address,
      value: memberPrice
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("224.1"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("24.9"));
  });

  it("Should pay 29.9Cro fee and 269.1 Cro to artist from regular people", async function () {
    await slothty.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("269.1"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("29.9"));
  });

  it("Should pay 24.9Cro fee and 224.1 Cro to artist from whtielist", async function () {
    await slothty.addWhitelistAddress(accounts[2].address);
    await slothty.connect(accounts[2]).mint(1, {
      from: accounts[2].address,
      value: whitePrice
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("224.1"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("24.9"));
  });

  it("Should pay 249Cro fee and 2241 Cro to artist with 10 tokens from member", async function () {
    await slothty.mint(10, {
      from: accounts[0].address,
      value: parseEther("2490")
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2241"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("249"));
  });

  it("Should pay 299Cro fee and 2691 Cro to artist with 10 tokens from regular people", async function () {
    await slothty.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: parseEther("2990")
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2691"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("299"));
  });

  it("Should pay 249Cro fee and 2241 Cro to artist with 10 tokens from whtielist", async function () {
    await slothty.addWhitelistAddress(accounts[3].address);
    await slothty.connect(accounts[3]).mint(10, {
      from: accounts[3].address,
      value: parseEther("2490")
    });
       
    await expect(() => slothty.withdrawPayments(artist.address)).to.changeEtherBalance(artist, parseEther("2241"));
    await expect(() => slothty.withdraw()).to.changeEtherBalance(accounts[0], parseEther("249"));
  });

  it("Should not withdraw for not owner", async function () {
    await slothty.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: regularPrice
    });
   
    await expect(slothty.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI when token ID not exist", async function () {    
    await expect(slothty.tokenURI(sequence[150])).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
  });
 
  it(`Should return tokenURI when token ID ${sequence[4]}`, async function () {
    await slothty.mint(5, {
      from: accounts[0].address,
      value: parseEther("1500")
    });
    await slothty.reveal();
    const tokenURI = await slothty.tokenURI(sequence[4]);
    expect(tokenURI).to.be.equal(`ipfs://QmNWJw5VZKkbiGKEaUEViniYQHDV3rc15R4EHBj1xPoCw3/${sequence[4]}.json`);
  });
  
  it("Should set notRevealedURI", async function () {
    let tokenURI = await slothty.tokenURI(35);
    expect(tokenURI).to.be.equal(`ipfs://Qmc4bJhZqbuSi7N15AtStyBV4BvxEvqP1X1RJpfNUuYLHF/Hidden.json`);

    await slothty.setNotRevealedURI("ipfs://notrevealedURI");

    tokenURI = await slothty.tokenURI(35);
    expect(tokenURI).to.be.equal(`ipfs://notrevealedURI`);
  });

  it("Should modify the baseURI", async function () {
    await slothty.setBaseURI("ipfs://testURI");

    await slothty.reveal();
    const tokenURI = await slothty.tokenURI(35);
    expect(tokenURI).to.be.equal(`ipfs://testURI/35.json`);
  });

  it("Should add and remove whitelist", async function () {
    // add whitelist
    let i = 0;
    const whitelistLen = whitelist.length;
    while(i < whitelistLen) {
      if (i + 50 >= whitelistLen) {
        await slothty.addWhiteList(whitelist.slice(i));
        break;
      } else {
        await slothty.addWhiteList(whitelist.slice(i, i + 50));
      }
      i += 50;
    }
    expect(await slothty.isWhiteList(accounts[1].address)).to.be.equal(false);
    expect(await slothty.isWhiteList(whitelist[0])).to.be.equal(true);
    expect(await slothty.isWhiteList(whitelist[whitelist.length-1])).to.be.equal(true);

    await slothty.addWhitelistAddress(accounts[1].address);
    expect(await slothty.isWhiteList(accounts[1].address)).to.be.equal(true);

    await slothty.removeWhiteList(whitelist[3]);
    expect(await slothty.isWhiteList(whitelist[3])).to.be.equal(false);
  });
  
  it("Should return all infos", async function () {
    allInfo = await slothty.getInfo();
    expect(allInfo.regularCost).to.be.equal(regularPrice);
    expect(allInfo.memberCost).to.be.equal(memberPrice);
    expect(allInfo.whitelistCost).to.be.equal(whitePrice);
    expect(allInfo.maxSupply).to.be.equal(8888);
    expect(allInfo.maxMintPerTx).to.be.equal(10);
    expect(allInfo.totalSupply).to.be.equal(100);
  });

  it("Should not mint when paused", async function () {
    await slothty.pause();
    await expect(slothty.mint(1, {
      from: accounts[0].address,
      value: regularPrice
    })).to.be.revertedWith("Pausable: paused");
  });
}); 

