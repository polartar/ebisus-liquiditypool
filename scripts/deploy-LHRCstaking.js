const hre = require("hardhat");

async function main() {
  const { LHRC } = hre.config.networks[hre.network.name];
  const { upgrades } = hre;
  // We get the contract to deploy
  const LHRCStaker = await ethers.getContractFactory("LHRCStaker");
  const lhrcStaker = await upgrades.deployProxy(LHRCStaker, [LHRC], {kind : "uups"});

  //testnet 

  await lhrcStaker.deployed();
  console.log("lhrcStaker deployed to:", lhrcStaker.address); 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
