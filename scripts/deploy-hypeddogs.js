const hre = require("hardhat");
const {
  sequence
} = require("../sequences/hypeddogs-sequence");
const whitelist = require("../whitelists/whitelist-hypeddogs.json");

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;
  // We get the contract to deploy
  const HypedDogs = await hre.ethers.getContractFactory("HypedDogs");

  //Real main net artist address --> 0x492331311171aCc3bC173d6Df37459A90dc77D09 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  // For testnet
  // const hypeddogs = await HypedDogs.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0x492331311171aCc3bC173d6Df37459A90dc77D09");
  const hypeddogs = await HypedDogs.deploy(membership, "0x492331311171aCc3bC173d6Df37459A90dc77D09");

  await hypeddogs.deployed();
  console.log("HypedDogs deployed to:", hypeddogs.address);
  
  // use existing deployed contract
  // const hypeddogs = await HypedDogs.attach("0x1D3587f44944a665F28bE1d9D9E322d43318DbB8");

  try {
    console.log("-----Start setting sequence-------");
    
    await hypeddogs.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('deploy 1');
    await hypeddogs.setSequnceChunk(1, sequence.slice(500, 1000));
    console.log('deploy 2');
    await hypeddogs.setSequnceChunk(2, sequence.slice(1000, 1500));
    console.log('deploy 3');
    await hypeddogs.setSequnceChunk(3, sequence.slice(1500, 2000));
    console.log('deploy 4');
    await hypeddogs.setSequnceChunk(4, sequence.slice(2000, 2500));
    console.log('deploy 5');
    await hypeddogs.setSequnceChunk(5, sequence.slice(2500, 3000));
    console.log('deploy 6');

    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
  }
  
  // --testnet 0x1D3587f44944a665F28bE1d9D9E322d43318DbB8
  try{
    console.log('adding whitelist')

    await hypeddogs.addWhiteList(whitelist);

    console.log('whitelist added.')
  }catch(err){
    console.log(err)
  }

  //  transfer ownership
  const tx = await hypeddogs.transferOwnership(owner);
  await tx.wait();
  const newOwner = await hypeddogs.owner();
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