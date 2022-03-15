// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
require('dotenv').config()
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  
  try {
    const {
      membership,
      owner
    } = hre.config.args;
    
    const Charity = await hre.ethers.getContractFactory("Charity");
    const charity = await Charity.deploy("0xc07A18B6b123dEC063f16B51Dc86F0B64E324B40");
  
    await charity.deployed();
  
    console.log("Charity Contract deployed to:", charity.address);
    // console.log('owner addresss', owner);
    
    const tx = await charity.transferOwnership(owner);
    await tx.wait();
    const newOwner = await charity.owner();
    console.log(`owner is now: ${newOwner}`)

  } catch (err) {
    console.log('err:', err)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });