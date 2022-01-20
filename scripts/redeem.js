//to run this on testnet:
// $ npx hardhat run scripts/authorize.js

const hardhat = require('hardhat')
const ambassadors = require('../data/ambassadors.json')

function hashToken(uri, recipient, ambassador) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'string', 'address', 'bool'],
      ['redeemable', uri, recipient, ambassador]
    ).slice(2),
    'hex'
  )
}

async function main() {
  //sign message wallet PK
  const wallet = hardhat.config.networks[hardhat.config.defaultNetwork].accounts[0]
  const signer = new ethers.Wallet(wallet)

  console.log('address, key')
  //make a message
  for (let i = 0; i < ambassadors.length; i++) {
    const message = hashToken(
      ambassadors[i].uri, 
      ambassadors[i].recipient, 
      ambassadors[i].ambassador
    )
    const signature = await signer.signMessage(message)
    console.log(`${whitelist[i].recipient}, ${signature}`)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
