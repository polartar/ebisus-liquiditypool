// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const { membership, artist, owner } = hre.config.args;

  // We get the contract to deploy
 
  const BarbaraBay = await hre.ethers.getContractFactory("BarbaraBay");
  const barbaraBay = await BarbaraBay.deploy(membership, artist);

  await barbaraBay.deployed();

  console.log("BarbaraBay deployed to:", barbaraBay.address);

   // transfer ownership
   const tx = await barbaraBay.transferOwnership(owner);
   await tx.wait();
   const newOwner = await barbaraBay.owner();
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
