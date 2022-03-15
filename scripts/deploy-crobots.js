const hre = require("hardhat");
const {
  sequence
} = require("../sequences/crobots-sequence");
const whitelist = require("../whitelists/whitelist_crobots.json");
const airdroplist = require("../airdroplists/airdroplist_crobots.json");

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;
  // We get the contract to deploy
  const Crobots = await hre.ethers.getContractFactory("Crobots");

  //Real main net artist address --> 0x177aB682d6e7c452E68c853DE5b9139fc76E4c4F 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  console.log('deploying crobots...');
  // const crobots = await Crobots.deploy(membership, "0x177aB682d6e7c452E68c853DE5b9139fc76E4c4F");
  const crobots = await Crobots.attach("0x3cDf2f7E9d0f998D4e6eF645dc3a293108F089f3");

  await crobots.deployed();
  console.log("Crobots deployed to:", crobots.address);
  
  // mint for artist
  try {
    console.log("first 50 for artist");
    await crobots.mintForArtist(50);
    console.log("Successfully minted for the artist");

    console.log("second 50 for artist");
    await crobots.mintForArtist(50);
    console.log("Successfully minted for the artist");

    console.log("third 50 for artist");
    await crobots.mintForArtist(50);
    console.log("Successfully minted for the artist");


  } catch (err) {
    console.log(err);
    return;
  }

  // set the sequence
  try {
    console.log("-----Start setting sequence-------");
    console.log('sequence 1');
    await crobots.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('sequence 2');
    await crobots.setSequnceChunk(1, sequence.slice(500, 1000));
    console.log('sequence 3');
    await crobots.setSequnceChunk(2, sequence.slice(1000, 1500));
    console.log('sequence 4');
    await crobots.setSequnceChunk(3, sequence.slice(1500, 2000));
    console.log('sequence 5');
    await crobots.setSequnceChunk(4, sequence.slice(2000));
    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
    return;
  }
  
  try{
    console.log('adding whitelist')

    let i = 0;
    const whitelistLen = whitelist.length;
    while(i < whitelistLen) {
      if (i + 50 >= whitelistLen) {
        console.log('last')
        await crobots.addWhiteList(whitelist.slice(i));
        break;
      } else {
        console.log(`${i+1} whitelist`)
        await crobots.addWhiteList(whitelist.slice(i, i + 50));
      }
      i += 50;
    }

    console.log('whitelist added.')
  }catch(err){
    console.log(err)
  }

  // mint for airdrop
  try{
    console.log('minting airdrop')

    let i = 0;
    const airdropLen = airdroplist.length;
    while(i < airdropLen) {
      if (i + 50 >= airdropLen) {
        console.log('last')
        await crobots.mintAirdrop(airdroplist.slice(i));
        break;
      } else {
        console.log(`${i+1} airdrop`)
        await crobots.mintAirdrop(airdroplist.slice(i, i + 50));
      }
      i += 50;
    }

    console.log('airdroplist minted.')
  }catch(err){
    console.log(err)
  }

  //  transfer ownership
  // const tx = await crobots.transferOwnership(owner);
  // await tx.wait();
  // const newOwner = await crobots.owner();
  // console.log(`owner is now: ${newOwner}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });