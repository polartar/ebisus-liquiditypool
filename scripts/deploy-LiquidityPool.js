const hre = require("hardhat");

async function main() {
  // We get the contract to deploy
  const { LHRC } = hre.config.networks[hre.network.name];
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(LHRC, 30, "0xe7233D65F1CD83fB405dE8C3792AB3d9E661E8Fb");

  //testnet 

  await liquidityPool.deployed();
  console.log("liquidityPool deployed to:", liquidityPool.address); 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
