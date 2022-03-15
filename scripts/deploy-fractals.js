const hre = require("hardhat");
const { sequence } = require("../sequences/fractal-sequence");

async function main() {
  const { membership, owner } = hre.config.args;

  // We get the contract to deploy
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //Test net membership address --> 0x3F1590A5984C89e6d5831bFB76788F3517Cdf034
  //Real main net artist address --> 0x1f346E6d1559d4904C3Fd824ac7AAa12f4046E6e
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d

  const Fractals = await hre.ethers.getContractFactory("Fractals");
  // For testnet
  // const fractals = await Fractals.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xe456f9A32E5f11035ffBEa0e97D1aAFDA6e60F03", sequence);
  const fractals = await Fractals.deploy(membership, "0x1f346E6d1559d4904C3Fd824ac7AAa12f4046E6e", sequence);

  await fractals.deployed();
  console.log("Fractals deployed to:", fractals.address); 
  //0xBE06783f7a02cFF726c0d4A6F11e8B3c237030a3 -- testnet

  // transfer ownership
  const tx = await fractals.transferOwnership(owner);
  await tx.wait();
  const newOwner = await fractals.owner();
  console.log(`owner is now: ${newOwner}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
