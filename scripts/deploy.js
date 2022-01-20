//to run this on testnet:
// $ npx hardhat run scripts/deploy.js

const hardhat = require('hardhat')

//config
const uri = 'https://gateway.pinata.cloud/ipfs/'
const cid = 'QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG'

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('GratitideCollection')
  const nft = await NFT.deploy(uri, cid)
  await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
