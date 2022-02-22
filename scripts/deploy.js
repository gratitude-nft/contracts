//to run this on testnet:
// $ npx hardhat run scripts/deploy.js

const hardhat = require('hardhat')

//config
const uri = 'https://ipfs.io/ipfs/bafkreicxbxgvj5tmampxoc7rz7ebry5vbgrkgdvaansyaqtgdhskezwylq'

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('GratitideGang')
  const nft = await NFT.deploy(uri)
  await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
