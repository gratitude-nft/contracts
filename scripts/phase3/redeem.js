//to run this on testnet:
// $ npx hardhat run scripts/phase3/redeem.js

const hardhat = require('hardhat')
const holders = require('../../data/holders.json')

function hashToken(recipient, ambassador) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'string', 'address', 'bool'],
      ['redeemable', "", recipient, ambassador]
    ).slice(2),
    'hex'
  )
}

async function main() {
  //sign message wallet PK
  const wallet = hardhat.config.networks[hardhat.config.defaultNetwork].accounts[0]
  const signer = new ethers.Wallet(wallet)
  const redeemers = {}
  //make a message
  for (let i = 0; i < holders.length; i++) {
    const message = hashToken(holders[i], false)
    const signature = await signer.signMessage(message)
    redeemers[holders[i].toLowerCase()] = signature
  }

  console.log(JSON.stringify(redeemers, null, 2))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
