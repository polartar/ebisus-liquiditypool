// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const { membership, artist, owner } = hre.config.args;

  // We get the contract to deploy
 
  const LootNetwork = await hre.ethers.getContractFactory("LootNetwork");
  const lootNetwork = await LootNetwork.deploy(membership, artist);

  await lootNetwork.deployed();

  console.log("LootNetwork deployed to:", lootNetwork.address);

  // transfer ownership
  const tx = await lootNetwork.transferOwnership(owner);
  await tx.wait();
  const newOwner = await lootNetwork.owner();
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
