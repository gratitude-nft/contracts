//to run this on testnet:
// $ npx hardhat run scripts/phase1/deploy.js

const hardhat = require('hardhat')

//config
const uri = 'https://ipfs.io/ipfs/QmYown3AkqdJrMjvirWmjZGdduPB3tMSupwuynxjtdTgdR'
const preview = 'https://ipfs.io/ipfs/bafkreibhjnpg3hzotfxjmvfo4r5enxswmjk2auyyxbvtlc27fs3bume2la'

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('GratitudeGang')
  const nft = await NFT.deploy(uri, preview)
  const tx = await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
  console.log('Reference:', tx.deployTransaction.hash)
  console.log(
    'npx hardhat verify --show-stack-traces --network', 
    process.env.BLOCKCHAIN_NETWORK, 
    nft.address, 
    `"${uri}"`, 
    `"${preview}"`
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});