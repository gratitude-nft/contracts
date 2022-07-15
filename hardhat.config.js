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
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887',
      accounts: [process.env.BLOCKCHAIN_RINKEBY_PRIVATE_KEY],
      contracts: {
        nft: '0xDD7b31a1A6e22C05C1979801E4d0F767202F4a8A',
        token: '0x2562C7d1D790DeE90D43959Db00b642AD21375f0',
        store: '0x3A953e393841C07d43E415Ad3Ba7Ca1e68E558c3',
        staking: '0x3DA7c73403652F88Bf8F61be08BB09a44a8D491B',
        softing: '0x61d1fbAf8ce08f6C554E97419E336cc89204c6dC',
        bridge: '0xeEfED6A1b9719A68D6EF256F4d7161bB6C00D9be',
        vault: '0xa4F2D3453108C12E4C49444Be291e2382e40b0c2'
      }
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      chainId: 1,
      scanner: 'https://etherscan.io',
      opensea: 'https://opensea.io',
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887',
      accounts: [process.env.BLOCKCHAIN_ETHEREUM_PRIVATE_KEY],
      contracts: {
        nft: '0x641475850e0316220a2D7E902508E08F72848316',
        token: '0xb33Ac190E67993BF584aAd1453BC4Ed668eA6072',
        store: '0x9999e0e4846618aB2750754167Ec698754211774',
        staking: '0xa20095F3893039B5143710ba7CE476860B2572e6',
        softing: '0xAC06425358ddECC1dF7bea26C5732cFE41dD4a21',
        bridge: '0x164c9df09B3c2f7532608f92627Fc300DC4f2FD6',
        vault: '0x2C739b273D37f696a5D84e6a997914bde9312b0C'
      }
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      chainId: 80001,
      scanner: 'https://mumbai.polygonscan.com',
      opensea: 'https://opensea.io',
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887',
      accounts: [process.env.BLOCKCHAIN_MUMBAI_PRIVATE_KEY],
      contracts: {
        token: '0xcED2a68f8Ff65cA1A2d9079a845fb3D1E9a5E43D',
        bridge: '0xeAD4511721b02d630e8D49D3A6c90104C0BFDbF3',
        vault: '0x1475a6c7456AE19080f03C9c59242cB6ae48231f'
      }
    },
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      scanner: 'https://polygonscan.com',
      opensea: 'https://opensea.io',
      signer: '0x48Ab2593a360d9f90cB53f9A63FD0CCBcAF0e887', 
      accounts: [process.env.BLOCKCHAIN_POLYGON_PRIVATE_KEY],
      contracts: {
        token: '0xF64c0eEEC752f3a6c82F0D76CbB2037529F7B02F',
        bridge: '0x641475850e0316220a2D7E902508E08F72848316',
        vault: '0x2337CA796b1a199931d23e4201358b2809Df8deE'
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
