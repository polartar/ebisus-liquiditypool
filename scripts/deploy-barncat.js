const hre = require("hardhat");
const {
  sequence
} = require("../sequences/barnCat-sequence");
// const airdroplist = require("../airdroplists/airdroplist_barncat.json");
const csvToJson = require('csvtojson');
const ObjectsToCsv = require('objects-to-csv');

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;

  const BarnCat = await hre.ethers.getContractFactory("BarnCat");

  console.log('deploying BarnCat...');
  const barnCat = await BarnCat.deploy();

  await barnCat.deployed();
  console.log("BarnCat deployed to:", barnCat.address);
  
  // set the sequence
  try {
    console.log("-----Start setting sequence-------");
    console.log('sequence 1');
    await barnCat.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('sequence 2');
    await barnCat.setSequnceChunk(1, sequence.slice(500, 1000));
    console.log('sequence 3');
    await barnCat.setSequnceChunk(2, sequence.slice(1000, 1500));
    console.log('sequence 4');
    await barnCat.setSequnceChunk(3, sequence.slice(1500));
    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
    return;
  }

  console.log("-----Stat airdrop-------");
  const recipients = await csvToJson({
      trim:true
  }).fromFile('airdroplists/airdroplist_barncat.csv');
  const remainedList = recipients.slice();
  const failedList = [];
  const len = recipients.length;

  for(let i = 0; i < len; i ++) {
    try {
      await barnCat.airdropMint(recipients[i].Address, parseInt(recipients[i].Count));
      console.log(`${recipients[i].Count} airDrops to ${recipients[i].Address}`)
      // if airdrop successfully, remove it from the remainedList
      remainedList.shift();
    } catch(err) {
      console.log({err})
      // when failed, it is added to the failedList
      failedList.push(recipients[i]);
    }
  }
  console.log("-----End airdrop-------");
 

  const remainedCSV = new ObjectsToCsv(remainedList);
  await remainedCSV.toDisk('airdroplists/airdroplist_barncat.csv');
 
  const failedCSV = new ObjectsToCsv(failedList);
  await failedCSV.toDisk('airdroplists/airdroplist_barncat_failed.csv');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });