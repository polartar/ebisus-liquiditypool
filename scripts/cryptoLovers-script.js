const hre = require("hardhat");

async function main() {
  const { owner } = hre.config.args;

  // We get the contract to deploy
  const deployer = await hre.ethers.getSigner();
  console.log(`deployer address: ${deployer.address}`);
  const CryptoLovers = await hre.ethers.getContractFactory("CryptoLovers");
  const cryptoLovers = await CryptoLovers.deploy();

  await cryptoLovers.deployed();

  console.log("CryptoLovers deployed to:", cryptoLovers.address);
  console.log(`transactionHash ${cryptoLovers.deployTransaction.hash}`);

  // transfer ownership
  const tx = await cryptoLovers.transferOwnership(owner);
  await tx.wait();
  const newOwner = await cryptoLovers.owner();
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
