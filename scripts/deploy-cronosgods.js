const hre = require("hardhat");
const { sequence } = require("../sequences/cronogods-sequence");

async function main() {
  const { membership, owner } = hre.config.args;
  // We get the contract to deploy
   const CronosGods = await hre.ethers.getContractFactory("CronosGods");

  //Real main net artist address --> 0xed8f960d1b0e664cbd2cbeb0e2648abfdb90ce29 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  // For testnet
  // const cornosgods = await CronosGods.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xe456f9A32E5f11035ffBEa0e97D1aAFDA6e60F03", sequence);
  const cornosgods = await CronosGods.deploy(membership, "0xed8f960d1b0e664cbd2cbeb0e2648abfdb90ce29", sequence);

  await cornosgods.deployed();
  console.log("CronosGods deployed to:", cornosgods.address); 
  // --testnet 0xc25914a85652a160CE4b74e678354aB336A1C217

  //  transfer ownership
   const tx = await cornosgods.transferOwnership(owner);
   await tx.wait();
   const newOwner = await cornosgods.owner();
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
