//to run this on testnet:
// $ npx hardhat run scripts/deploy.js

const hardhat = require('hardhat')

//config
const uri = 'https://ipfs.io/ipfs/QmYown3AkqdJrMjvirWmjZGdduPB3tMSupwuynxjtdTgdR'
const preview = 'https://ipfs.io/ipfs/bafkreibhjnpg3hzotfxjmvfo4r5enxswmjk2auyyxbvtlc27fs3bume2la'

async function main() {
  await hre.run('compile')
  const NFT = await hardhat.ethers.getContractFactory('GratitudeGang')
  const nft = await NFT.deploy(uri, preview)
  await nft.deployed()
  console.log('NFT contract deployed to (update .env):', nft.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});

//$ npx hardhat verify --network testnet 0x0E026F41f9989e48B02105A8907529BaD17fd52f "https://ipfs.io/ipfs/bafkreicxbxgvj5tmampxoc7rz7ebry5vbgrkgdvaansyaqtgdhskezwylq" "https://ipfs.io/ipfs/bafkreibhjnpg3hzotfxjmvfo4r5enxswmjk2auyyxbvtlc27fs3bume2la"
