//to run this on testnet:
// $ npx hardhat run scripts/withdraw.js

const hardhat = require('hardhat')

async function main() {
  await hre.run('compile');
  const NFT = await hardhat.ethers.getContractFactory('GratitideCollection')
  const nft = await NFT.attach(
    hardhat.config.networks[hardhat.config.defaultNetwork].contracts[0]
  )
  await nft.withdraw()
  console.log('Funds withdrawn')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
