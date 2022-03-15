const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Test 4 Busines logic of Mob0 Drop contract", function () {
  let mob0;
  let mockMemberships
  let accounts;
  const token1Count = 5;
  const token2Count = 3;
  const editionLimit = 7 * 24 * 60 * 60 + 1;
  const normalPrice = 1500;
  const memberPrice = 1000;
  let artist;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    artist = accounts[2];
    const MockMemberships = await ethers.getContractFactory("MockMemberships");
    mockMemberships = await MockMemberships.deploy(token1Count, token2Count);
    await mockMemberships.deployed();

    const Mob0 = await ethers.getContractFactory("Mob0");
    mob0 = await Mob0.deploy(mockMemberships.address, artist.address, [624, 720, 1105, 903, 1098, 323, 604, 213, 433, 694, 442, 134, 954, 113, 253, 346, 874, 349, 817, 1047, 387, 1037, 429, 969, 574, 1054, 802, 933, 159, 612, 1053, 233, 1008, 992, 650, 809, 696, 1076, 200, 1084, 36, 723, 482, 33, 143, 411, 980, 179, 581, 463, 23, 528, 648, 357, 3, 379, 620, 119, 383, 432, 523, 1001, 771, 242, 405, 171, 974, 601, 194, 425, 897, 12, 1101, 264, 360, 843, 858, 348, 315, 109, 1017, 7, 659, 713, 807, 584, 389, 617, 458, 142, 212, 1064, 104, 990, 635, 211, 883, 693, 986, 712, 273, 672, 525, 337, 1046, 641, 590, 885, 890, 427, 437, 854, 439, 91, 759, 312, 76, 1067, 758, 148, 949, 588, 150, 303, 670, 549, 892, 705, 735, 40, 761, 512, 278, 814, 408, 462, 304, 559, 879, 24, 48, 671, 655, 741]);
    await mob0.deployed();

    // initialize the cost for test
    await mob0.setCost(normalPrice, false)
    await mob0.setCost(memberPrice, true)
  })

  it("Should mint 20 tokens for deployer", async function () {
    const count = await mob0.balanceOf(accounts[0].address)
    expect(await count.toString()).to.equal("20");
  });

  it("Should not mint more than 11", async function () {
    await mob0.startEditionOpen();
    await mob0.setMaxToken(30);
       
    await expect( mob0.mint(11, {
        from: accounts[0].address,
        value: memberPrice * 11
      }))
      .to.be.revertedWith("sold out!");  
  });
  
  it("Should not mint before staring edition", async function () {
    await expect( mob0.mint(3, {
      from: accounts[0].address,
      value: memberPrice
    }))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should not mint after 7 days", async function () {
    await mob0.startEditionOpen();
    
    await ethers.provider.send('evm_increaseTime', [editionLimit]);
    await ethers.provider.send('evm_mine');
    await expect( mob0.mint(3, {
        from: accounts[0].address,
        value: memberPrice
      }))
    .to.be.revertedWith("The edition is closed");
  });

  it("Should pay to artist from member: 950", async function () {
    await mob0.startEditionOpen();

    await mob0.mint(1, {
      from: accounts[0].address,
      value: 1000
    });
       
    // const paidAmount = (memberPrice * (100 - discount) / 100)  * (100 - fee) / 100
    await expect(() => mob0.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 950);
  });

  it("Should pay to artist from normal people: 1425", async function () {
    await mob0.startEditionOpen();

    await mob0.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });
   
    // const paidAmount = normalPrice * 3 * (100 - fee) / 100

    await expect(() => mob0.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 1425);
  });

  it("Should pay the fee from normal people: 50", async function () {
    await mob0.startEditionOpen();

    await mob0.mint(1, {
      from: accounts[0].address,
      value: 1000
    });
   
    await expect(() => mob0.withdraw()).to.changeEtherBalance(accounts[0], 50);
  });
  
  it("Should pay the fee from normal people: 75", async function () {
    await mob0.startEditionOpen();

    await mob0.connect(accounts[1]).mint(1, {
      from: accounts[1].address,
      value: 1500
    });
   
    // const paidFee = normalPrice * 3 * fee / 100

    await expect(() => mob0.withdraw()).to.changeEtherBalance(accounts[0], 75);
  });

  it("Should pay to the artist for each 10 tokens: 23750", async function () {
    await mob0.startEditionOpen();

    await mob0.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await mob0.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
   
    await expect(() => mob0.withdrawPayments(artist.address)).to.changeEtherBalance(artist, 23750);
  });
  
  it("Should pay the fee for each 10 tokens: 1250", async function () {
    await mob0.startEditionOpen();

    await mob0.mint(10, {
      from: accounts[0].address,
      value: 10000
    });

    await mob0.connect(accounts[1]).mint(10, {
      from: accounts[1].address,
      value: 15000
    });
   
    await expect(() => mob0.withdraw()).to.changeEtherBalance(accounts[0], 1250);
  });

  it("Should not withdraw for not owner", async function () {
    await mob0.startEditionOpen();

    await mob0.connect(accounts[1]).mint(3, {
      from: accounts[1].address,
      value: normalPrice * 3
    });
   
    await expect(mob0.connect(accounts[1]).withdraw())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not return tokenURI", async function () {
    await mob0.startEditionOpen();

    await mob0.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    const tokenURI = await mob0.tokenURI(624);
    expect(tokenURI).to.equal("no revealed");
  });

  it("Should return tokenURI", async function () {
    await mob0.startEditionOpen();
    await mob0.reveal();

    await mob0.mint(1, {
      from: accounts[0].address,
      value: normalPrice
    });
    
    const tokenURI = await mob0.tokenURI(624);
    expect(tokenURI).to.not.equal("no revealed");
  });
}); 

