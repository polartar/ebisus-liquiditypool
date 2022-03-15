const hre = require("hardhat");
const { sequence } = require("../sequences/deplone-sequence");

async function main() {
  const { membership, artist, owner } = hre.config.args;

  // We get the contract to deploy
   const Deplone = await hre.ethers.getContractFactory("Deplone");

  //Real main net artist address --> 0x3A3003927Cf21D0D5Fc826Ef1ca03dDAe2Bd0F44
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  const deplone = await Deplone.deploy(membership, artist, sequence);

  await deplone.deployed();
  console.log("Deplone deployed to:", deplone.address); 
  //0xBf792Bdfd565Bc9D4619ed085d4E8B8EA4d9E79E --testnet

   // transfer ownership
   const tx = await deplone.transferOwnership(owner);
   await tx.wait();
   const newOwner = await deplone.owner();
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
