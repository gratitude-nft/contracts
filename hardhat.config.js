require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

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
  defaultNetwork: process.env.BLOCKCHAIN_NETWORK,
  networks: {
    hardhat: {
      chainId: 1337,
      mining: {
        //set this to false if you want localhost to mimick a real blockchain
        auto: true,
        interval: 5000
      }
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 4,
      scanner: 'https://rinkeby.etherscan.io',
      opensea: 'https://testnets.opensea.io',
      signer: process.env.BLOCKCHAIN_RINKEBY_BRIDGE_SIGNER,
      accounts: [process.env.BLOCKCHAIN_RINKEBY_PRIVATE_KEY],
      contracts: {
        nft: process.env.BLOCKCHAIN_RINKEBY_NFT_ADDRESS,
        token: process.env.BLOCKCHAIN_RINKEBY_TOKEN_ADDRESS,
        store: process.env.BLOCKCHAIN_RINKEBY_STORE_ADDRESS,
        staking: process.env.BLOCKCHAIN_RINKEBY_STAKING_ADDRESS,
        softing: process.env.BLOCKCHAIN_RINKEBY_SOFTING_ADDRESS,
        bridge: process.env.BLOCKCHAIN_RINKEBY_BRIDGE_ADDRESS
      }
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 1,
      scanner: 'https://etherscan.io',
      opensea: 'https://opensea.io',
      signer: process.env.BLOCKCHAIN_ETHEREUM_BRIDGE_SIGNER,
      accounts: [process.env.BLOCKCHAIN_ETHEREUM_PRIVATE_KEY],
      contracts: {
        nft: process.env.BLOCKCHAIN_ETHEREUM_NFT_ADDRESS,
        token: process.env.BLOCKCHAIN_ETHEREUM_TOKEN_ADDRESS,
        store: process.env.BLOCKCHAIN_ETHEREUM_STORE_ADDRESS,
        staking: process.env.BLOCKCHAIN_ETHEREUM_STAKING_ADDRESS,
        softing: process.env.BLOCKCHAIN_ETHEREUM_SOFTING_ADDRESS,
        bridge: process.env.BLOCKCHAIN_ETHEREUM_BRIDGE_ADDRESS
      }
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      chainId: 80001,
      scanner: 'https://mumbai.polygonscan.com',
      opensea: 'https://opensea.io',
      signer: process.env.BLOCKCHAIN_MUMBAI_BRIDGE_SIGNER,
      accounts: [process.env.BLOCKCHAIN_MUMBAI_PRIVATE_KEY],
      contracts: {
        bridge: process.env.BLOCKCHAIN_MUMBAI_BRIDGE_ADDRESS
      }
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      scanner: 'https://polygonscan.com',
      opensea: 'https://opensea.io',
      signer: process.env.BLOCKCHAIN_POLYGON_BRIDGE_SIGNER, 
      accounts: [process.env.BLOCKCHAIN_POLYGON_PRIVATE_KEY],
      contracts: {
        bridge: process.env.BLOCKCHAIN_POLYGON_BRIDGE_ADDRESS
      }
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.BLOCKCHAIN_CMC_KEY,
    gasPrice: 200
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BLOCKCHAIN_SCANNER_KEY
  }
};
