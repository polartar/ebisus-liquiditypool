const hre = require("hardhat");
const { sequence } = require("../sequences/aunah-sequence");

async function main() {
  const { membership, owner } = hre.config.args;
  // We get the contract to deploy
   const Aunah = await hre.ethers.getContractFactory("Aunah");

  //Real main net artist address --> 0xd8748214222b4398bdb54bd7508df90146e5e61c 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  // const aunah = await Aunah.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xe456f9A32E5f11035ffBEa0e97D1aAFDA6e60F03", sequence);
  const aunah = await Aunah.deploy(membership, "0xd8748214222b4398bdb54bd7508df90146e5e61c", sequence);

  await aunah.deployed();
  console.log("Aunah deployed to:", aunah.address); 
  // 0xFdc26dde39BE26e01f25e26999AF26C672541174--testnet 

  //  transfer ownership
  const tx = await aunah.transferOwnership(owner);
  await tx.wait();
  const newOwner = await aunah.owner();
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
