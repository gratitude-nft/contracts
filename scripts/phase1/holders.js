//to run this on testnet:
// $ npx hardhat run scripts/phase1/holders.js

const hardhat = require('hardhat')

const holders = {}
async function main() {
  const NFT = await hardhat.ethers.getContractFactory('GratitudeGang')
  const nft = await NFT.attach(
    hardhat.config.networks[hardhat.config.defaultNetwork].contracts.nft
  )
  const supply = parseInt(await nft.totalSupply())
  for (let i = 0; i < supply; i++) {
    const address = await nft.ownerOf(i + 1)
    holders[address] = true
    console.log('owner of', i + 1, address)
  }

  console.log('final')
  Object.keys(holders).forEach(address => console.log(address))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})