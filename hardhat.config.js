require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require('@openzeppelin/hardhat-upgrades');

// require('hardhat-abi-exporter');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  // defaultNetwork: "cronos_testnet",
  networks : {
    cronos : {
      url : "https://gateway.nebkas.ro/",
      chainId: 25,
      accounts: process.env.SIGNER !== undefined ? [process.env.SIGNER] : [],
      gasPrice: 5000000000000,
      membership: '0x8d9232Ebc4f06B7b8005CCff0ca401675ceb25F5',
    },
    cronos_testnet : {
      url : "https://cronos-testnet-3.crypto.org:8545/",
      chainId : 338,
      accounts:  process.env.SIGNER !== undefined ? [process.env.SIGNER] : [],
      gasPrice: 5000000000000,
      membership: '0x3F1590A5984C89e6d5831bFB76788F3517Cdf034',
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 2000000
  },
 args: {
   owner: '0x454cfAa623A629CC0b4017aEb85d54C42e91479d'
 }
};