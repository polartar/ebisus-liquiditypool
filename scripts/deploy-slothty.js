const hre = require("hardhat");
const {
  sequence
} = require("../sequences/slothty-sequence");
const whitelist = require("../whitelists/whitelist_slothty.json");
const csvToJson = require('csvtojson');
const ObjectsToCsv = require('objects-to-csv');

const airdropPath = "airdroplists/airdroplist_slothty.csv";
async function main() {
  const {
    owner
  } = hre.config.args;
  const membership = hre.config.networks[hre.network.name].membership;
  // We get the contract to deploy
  const Slothty = await hre.ethers.getContractFactory("Slothty");

  //Real main net artist address --> 0x657190bfC694f816B6cdd9EaB3275f470E26542C 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  console.log('deploying slothty...');
  const slothty = await Slothty.deploy(membership, "0x657190bfC694f816B6cdd9EaB3275f470E26542C");

  await slothty.deployed();
  console.log("Slothty deployed to:", slothty.address);

  //testnet 0x7d09ff680b210770D6D9a1296b4A74bd5391b341
  // mint for artist
  try {
    console.log("first 50 for artist");
    await slothty.mintForArtist(50);
    console.log("Successfully minted for the artist");

    console.log("second 50 for artist");
    await slothty.mintForArtist(50);
    console.log("Successfully minted for the artist");

    console.log("Successfully minted for the artist");


  } catch (err) {
    console.log(err);
    return;
  }

  try{
    console.log("-----Start setting sequence-------");

    let i = 0;
    const sequenceLen = sequence.length;
    while(i * 500 < sequenceLen) {
      if ((i + 1) * 500 >= sequenceLen) {
        console.log('last')
        await slothty.setSequnceChunk(i, sequence.slice(i * 500));
        break;
      } else {
        console.log(`${i+1} sequence`)
        await slothty.setSequnceChunk(i, sequence.slice(i * 500, i * 500 + 500));
      }
      i ++;
    }

    console.log("-----End setting sequence-------");
  }catch(err){
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
        await slothty.addWhiteList(whitelist.slice(i));
        break;
      } else {
        console.log(`${i+1} whitelist`)
        await slothty.addWhiteList(whitelist.slice(i, i + 50));
      }
      i += 50;
    }

    console.log('whitelist added.')
  }catch(err){
    console.log(err)
    return;
  }
  
  console.log("-----Start airdrop-------");
  const recipients = await csvToJson({
      trim:true
  }).fromFile(airdropPath);

  const failedList = [];
  const len = recipients.length;

  for(let i = 0; i < len; i ++) {
    try {
      await slothty.airdropMint(recipients[i].Address, parseInt(recipients[i].Count));
    } catch(err) {
      console.log({err})
      // when failed, it is added to the failedList
      failedList.push(recipients[i]);
    }
  }
  console.log("-----End airdrop-------");
 
  const failedCSV = new ObjectsToCsv(failedList);
  await failedCSV.toDisk('airdroplists/airdroplist_slothty_failed.csv');

  //  transfer ownership
  const tx = await slothty.transferOwnership(owner);
  await tx.wait();
  const newOwner = await slothty.owner();
  console.log(`owner is now: ${newOwner}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });