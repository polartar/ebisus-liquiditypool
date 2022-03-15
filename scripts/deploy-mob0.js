// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { sequence } = require("../sequences/mob0-sequence");

async function main() {
  const { membership, artist, owner } = hre.config.args;

  // We get the contract to deploy
 
  const Mob0 = await hre.ethers.getContractFactory("Mob0");
  const mob0 = await Mob0.deploy(membership, artist, sequence);

  await mob0.deployed();
  console.log("Mob0 deployed to:", mob0.address);

  // transfer ownership
  const tx = await mob0.transferOwnership(owner);
  await tx.wait();
  const newOwner = await mob0.owner();
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
