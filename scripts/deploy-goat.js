const hre = require("hardhat");
const { sequence } = require("../sequences/goat-sequence");

async function main() {
  const { membership, owner } = hre.config.args;
  // We get the contract to deploy
   const CronosGoats = await hre.ethers.getContractFactory("CronosGoats");

  //Real main net artist address --> 0x5386466DD296F22d4e01c4de4AAb68954883b59F 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  const cronosGoats = await CronosGoats.deploy(membership, "0x5386466DD296F22d4e01c4de4AAb68954883b59F", sequence);

  await cronosGoats.deployed();
  console.log("CronosGoats deployed to:", cronosGoats.address); 
  // --testnet 0xF313649E3DD661b09D511257A7E77F4e6b12d1fA

  //  transfer ownership
   const tx = await cronosGoats.transferOwnership(owner);
   await tx.wait();
   const newOwner = await cronosGoats.owner();
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
