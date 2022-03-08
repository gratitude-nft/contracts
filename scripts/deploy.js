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

//$ npx hardhat verify --network testnet 0xeb18911921EDcbE797495bBe7dC7bC2eC1F7863a "https://ipfs.io/ipfs/QmYown3AkqdJrMjvirWmjZGdduPB3tMSupwuynxjtdTgdR" "https://ipfs.io/ipfs/bafkreibhjnpg3hzotfxjmvfo4r5enxswmjk2auyyxbvtlc27fs3bume2la"
//$ npx hardhat verify --network mainnet 0xF64c0eEEC752f3a6c82F0D76CbB2037529F7B02F "https://ipfs.io/ipfs/QmYown3AkqdJrMjvirWmjZGdduPB3tMSupwuynxjtdTgdR" "https://ipfs.io/ipfs/bafkreibhjnpg3hzotfxjmvfo4r5enxswmjk2auyyxbvtlc27fs3bume2la"
