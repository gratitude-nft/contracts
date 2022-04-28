//to run this on testnet:
// $ npx hardhat run scripts/phase3/deploy.js

const hardhat = require('hardhat')

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await ethers.getContractFactory(name)
  const contract = await ContractFactory.deploy(...params)
  await contract.deployed()

  return contract
}

function getRole(name) {
  if (!name || name === 'DEFAULT_ADMIN_ROLE') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  return '0x' + Buffer.from(
    ethers.utils.solidityKeccak256(['string'], [name]).slice(2), 
    'hex'
  ).toString('hex')
}

async function main() {
  await hre.run('compile')
  //get network and admin
  const network = hardhat.config.networks[hardhat.config.defaultNetwork]
  const admin = new ethers.Wallet(network.accounts[0])

  //1. get the nft contract that was deployed
  const nft = { address: network.contracts.nft }
  const token = { address: network.contracts.token }

  //4. next deploy the staking
  const staking = await deploy('FlowerShower', nft.address, token.address)
  console.log('')
  console.log('-----------------------------------')
  console.log('FlowerShower deployed to:', staking.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    staking.address,
    `"${nft.address}"`,
    `"${token.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log(' 1. In TokensOfGratitude contract, grant MINTER_ROLE to FlowerShower')
  console.log(`    - ${network.scanner}/address/${token.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('MINTER_ROLE')}, ${staking.address} )`)
  console.log('')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});