const hre = require("hardhat");

const airdroplist1 = require("../airdroplists/airdroplist_valentine_fm.json")
const airdroplist2 = require("../airdroplists/airdroplist_valentine_vip.json")

async function main() {
  const {
    membership,
    owner
  } = hre.config.args;
  // We get the contract to deploy
  const EbisusAirdrops = await hre.ethers.getContractFactory("EbisusAirdrops");

  const ebisusAirdrops = await EbisusAirdrops.deploy();

  await ebisusAirdrops.deployed();
  console.log("EbisusAirdrops deployed to:", ebisusAirdrops.address);
  
  await ebisusAirdrops.setUri(1, "ipfs://QmU5g8oHikYXUewspDUA7Z5NtkaHK6DgjpJuJqaXpKBE13");
  const airdroplist = [...new Set(airdroplist1.concat(airdroplist2))];
 
 // mint for airdrop
  try{
    console.log('minting airdrop')

    let i = 0;
    const airdropLen = airdroplist.length;
    while(i < airdropLen) {
      if (i + 50 >= airdropLen) {
        console.log('last')
        await ebisusAirdrops.mintAirdrop(1, airdroplist.slice(i));
        break;
      } else {
        console.log(`${i+1} airdrop`)
        await ebisusAirdrops.mintAirdrop(1, airdroplist.slice(i, i + 50));
      }
      i += 50;
    }

    console.log('airdroplist minted.')
  }catch(err){
    console.log(err)
  }

  //  transfer ownership
  // const tx = await ebisusAirdrops.transferOwnership(owner);
  // await tx.wait();
  // const newOwner = await ebisusAirdrops.owner();
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