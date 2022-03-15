const hre = require("hardhat");
const {
  sequence
} = require("../sequences/recklessRobots-sequence");
const whitelist = require("../whitelists/whitelist_recklessRobots.json");

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;
  // We get the contract to deploy
  const RecklessRobots = await hre.ethers.getContractFactory("RecklessRobots");

  //Real main net artist address --> 0xC13a4f84DcBbB313d10f3Dc92F76F0fD060D3f25 
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  console.log('deploying recklessRobots...');
  // const recklessRobots = await RecklessRobots.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xC13a4f84DcBbB313d10f3Dc92F76F0fD060D3f25");
  const recklessRobots = await RecklessRobots.deploy(membership, "0xC13a4f84DcBbB313d10f3Dc92F76F0fD060D3f25");

  await recklessRobots.deployed();
  console.log("RecklessRobots deployed to:", recklessRobots.address);
  
  //testnet 0x08D31de0C73312380ec03CaAbAA36e119D7BccA1

  // set the sequence
  try {
    console.log("-----Start setting sequence-------");
    console.log('sequence 1');
    await recklessRobots.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('sequence 2');
    await recklessRobots.setSequnceChunk(1, sequence.slice(500, 1000));
    console.log('sequence 3');
    await recklessRobots.setSequnceChunk(2, sequence.slice(1000, 1500));
    console.log('sequence 4');
    await recklessRobots.setSequnceChunk(3, sequence.slice(1500));
    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
    return;
  }
  
  // try{
  //   console.log('adding whitelist')

  //   let i = 0;
  //   const whitelistLen = whitelist.length;
  //   while(i < whitelistLen) {
  //     if (i + 50 >= whitelistLen) {
  //       console.log('last')
  //       await recklessRobots.addWhiteList(whitelist.slice(i));
  //       break;
  //     } else {
  //       console.log(`${i+1} whitelist`)
  //       await recklessRobots.addWhiteList(whitelist.slice(i, i + 50));
  //     }
  //     i += 50;
  //   }

  //   console.log('whitelist added.')
  // }catch(err){
  //   console.log(err)
  // }

  //  transfer ownership
  // const tx = await recklessRobots.transferOwnership(owner);
  // await tx.wait();
  // const newOwner = await recklessRobots.owner();
  // console.log(`owner is now: ${newOwner}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });