const hre = require("hardhat");
const { sequence } = require("../sequences/luckless-sequence");

async function main() {
  const { membership, owner } = hre.config.args;
  // We get the contract to deploy
   const LuckLess = await hre.ethers.getContractFactory("LuckLess");

  //Real main net artist address --> 0xAdc4719F8A5c73811497d0cc5f93e1878F48498e 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  // const luckless = await LuckLess.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xAdc4719F8A5c73811497d0cc5f93e1878F48498e", sequence);
  const luckless = await LuckLess.deploy(membership, "0xAdc4719F8A5c73811497d0cc5f93e1878F48498e", sequence);

  await luckless.deployed();
  console.log("LuckLess deployed to:", luckless.address); 
  // 0xc22Aa5B0800080F31A46Ec58997812568f399813--testnet 

  //  transfer ownership
  const tx = await luckless.transferOwnership(owner);
  await tx.wait();
  const newOwner = await luckless.owner();
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
