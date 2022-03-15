const hre = require("hardhat");
const { sequence } = require("../sequences/dodgerdogs-sequence");

async function main() {
  const { membership, owner } = hre.config.args;
  // We get the contract to deploy
   const DodgerDogs = await hre.ethers.getContractFactory("DodgerDogs");

  //Real main net artist address --> 0xc07A18B6b123dEC063f16B51Dc86F0B64E324B40 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  // const dodgerdogs = await DodgerDogs.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xc07A18B6b123dEC063f16B51Dc86F0B64E324B40");
  const dodgerdogs = await DodgerDogs.deploy(membership, "0xc07A18B6b123dEC063f16B51Dc86F0B64E324B40");

  await dodgerdogs.deployed();
  console.log("DodgerDogs deployed to:", dodgerdogs.address); 
  

  //testnet 0xe946F079250F7aCdDB49016A87e508BD2586C76B
  
  // set the sequence
  try {
    console.log("-----Start setting sequence-------");
    
    console.log('sequence 1');
    await dodgerdogs.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('sequence 2');
    await dodgerdogs.setSequnceChunk(1, sequence.slice(500));
    
    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
    return;
  }

  //  transfer ownership
  const tx = await dodgerdogs.transferOwnership(owner);
  await tx.wait();
  const newOwner = await dodgerdogs.owner();
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
