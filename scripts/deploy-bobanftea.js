const hre = require("hardhat");
const {
  sequence
} = require("../sequences/bobaNFTea-sequence");

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;
  // We get the contract to deploy
  const BobaNFTea = await hre.ethers.getContractFactory("BobaNFTea");

  //Real main net artist address --> 0xfeDa3358c95bB339FBeDf7Eddf5D5Ae1b567FCc5  
  //Real main net membership address --> 0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5
  //On deploy transfer ownership to here --> 0x454cfAa623A629CC0b4017aEb85d54C42e91479d
  
  console.log('deploying BobaNFTea...');
  // const bobaNFTea = await BobaNFTea.deploy("0x3F1590A5984C89e6d5831bFB76788F3517Cdf034", "0xfeDa3358c95bB339FBeDf7Eddf5D5Ae1b567FCc5");
  const bobaNFTea = await BobaNFTea.deploy(membership, "0xfeDa3358c95bB339FBeDf7Eddf5D5Ae1b567FCc5");

  await bobaNFTea.deployed();
  console.log("BobaNFTea deployed to:", bobaNFTea.address);
  
  // testnet address: 0xde0d3CCA05A9870D82180e771Eb2efc1de039cB9

  // set the sequence
  try {
    console.log("-----Start setting sequence-------");

    console.log('sequence 1');
    await bobaNFTea.setSequnceChunk(0, sequence.slice(0, 500));
    console.log('sequence 2');
    await bobaNFTea.setSequnceChunk(1, sequence.slice(500, 1000));
    console.log('sequence 3');
    await bobaNFTea.setSequnceChunk(2, sequence.slice(1000, 1500));
    console.log('sequence 4');
    await bobaNFTea.setSequnceChunk(3, sequence.slice(1500, 2000));
    console.log('sequence 5');
    await bobaNFTea.setSequnceChunk(4, sequence.slice(2000, 2500));
    console.log('sequence 6');
    await bobaNFTea.setSequnceChunk(5, sequence.slice(2500, 3000));
    console.log('sequence 7');
    await bobaNFTea.setSequnceChunk(6, sequence.slice(3000));

    console.log("-----End setting sequence-------");
  } catch(err) {
    console.log(err)
    return;
  }
  
  //  transfer ownership
  const tx = await bobaNFTea.transferOwnership(owner);
  await tx.wait();
  const newOwner = await bobaNFTea.owner();
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