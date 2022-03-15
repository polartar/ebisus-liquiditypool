// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const { membership, owner } = hre.config.args;
  const artist = "0x38D9390cd9034D30E58315193cB1fd38E24137Ef";

  // We get the contract to deploy
  const deployer = await hre.ethers.getSigner();
  console.log(`deployer address: ${deployer.address}`);
  const LazyHorse2 = await hre.ethers.getContractFactory("LazyHorse2");
  const lazyHorse2 = await LazyHorse2.deploy(membership, artist);

  await lazyHorse2.deployed();
  //0x3fc2bac73bC7ceFA6Efb00a49dD646841f70240D - testnet

  console.log("LazyHorse2 deployed to:", lazyHorse2.address);
  console.log(`transactionHash ${lazyHorse2.deployTransaction.hash}`)

  // try{
  //   let mintSome = await lazyHorse2.mintForDeployer(100);
  //   await mintSome.wait();
  //   mintSome = await lazyHorse2.mintForDeployer(100);
  //   await mintSome.wait();
  //   mintSome = await lazyHorse2.mintForDeployer(100);
  //   await mintSome.wait();
  //   mintSome = await lazyHorse2.mintForDeployer(100);
  //   await mintSome.wait();
  //   mintSome = await lazyHorse2.mintForDeployer(100);
  //   await mintSome.wait();
  // }catch(error){
  //   console.log(error);
  // }


  const tx = await lazyHorse2.transferOwnership(owner);
  await tx.wait();
  const newOwner = await lazyHorse2.owner();
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
