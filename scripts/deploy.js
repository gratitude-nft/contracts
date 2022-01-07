//to run this on testnet:
// $ npx hardhat run scripts/deploy.js

const hardhat = require('hardhat')

//config
const cidFolder = 'Qm...'

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('GratitideCollection')
  const nft = await NFT.deploy(cidFolder)
  await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});
