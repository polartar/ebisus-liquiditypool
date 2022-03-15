// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const { membership, artist, owner } = hre.config.args;

  // We get the contract to deploy
  const deployer = await hre.ethers.getSigner();
  console.log(`deployer address: ${deployer.address}`);
  const LazyHorse = await hre.ethers.getContractFactory("LazyHorse");
  const lazyHorse = await LazyHorse.deploy(membership, artist);

  await lazyHorse.deployed();
  //0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D - testnet

  console.log("LazyHorse deployed to:", lazyHorse.address);
  console.log(`transactionHash ${lazyHorse.deployTransaction.hash}`)

  let mintSome = await lazyHorse.mintForDeployer(20);
  await mintSome.wait();
  mintSome = await lazyHorse.mintForDeployer(20);
  await mintSome.wait();
  mintSome = await lazyHorse.mintForDeployer(20);
  await mintSome.wait();
  mintSome = await lazyHorse.mintForDeployer(20);
  await mintSome.wait();
  mintSome = await lazyHorse.mintForDeployer(20);
  await mintSome.wait();

  const tx = await lazyHorse.transferOwnership(owner);
  await tx.wait();
  const newOwner = await lazyHorse.owner();
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
