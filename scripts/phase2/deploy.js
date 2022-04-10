//to run this on testnet:
// $ npx hardhat run scripts/phase2/deploy.js

const hardhat = require('hardhat')

//config
const storeURI = 'https://ipfs.io/ipfs/QmNambeT82fyK1suh4SUes6yxAKmNPfsNEvhiGskcsvWJ9'
const storeBase = 'https://www.gratitudegang.io/store/'

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
  const admin = (new ethers.Wallet(network.accounts[0]))

  //1. get the nft contract that was deployed
  const nft = { address: network.contracts.gang }
  //2. next deploy the $GRATIS token
  const token = await deploy('Gratis', admin.address)
  console.log('')
  console.log('-----------------------------------')
  console.log('$GRATIS deployed to:', token.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    token.address,
    `"${admin.address}"`
  )
  
  //3. next deploy the store
  const store = await deploy('GratitudeStore', storeURI, storeBase, admin.address)
  console.log('')
  console.log('-----------------------------------')
  console.log('Store deployed to:', store.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    store.address,
    `"${storeURI}"`,
    `"${storeBase}"`,
    `"${admin.address}"`
  )
  
  //4. next deploy the staking
  const staking = await deploy('SunflowerStaking', nft.address, token.address)
  console.log('')
  console.log('-----------------------------------')
  console.log('Staking deployed to:', staking.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    staking.address,
    `"${nft.address}"`,
    `"${token.address}"`
  )
  
  //5. next deploy the deals
  const deals = await deploy('GratisDeals', token.address, store.address)
  console.log('')
  console.log('-----------------------------------')
  console.log('Deals deployed to:', deals.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    deals.address,
    `"${token.address}"`,
    `"${store.address}"`
  )

  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log(' 1. In $GRATIS contract, grant MINTER_ROLE to Staking')
  console.log(`    - ${network.scanner}/address/${token.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('MINTER_ROLE')}, ${staking.address} )`)
  console.log(' 2. In Store contract, grant MINTER_ROLE to Deals')
  console.log(`    - ${network.scanner}/address/${store.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('MINTER_ROLE')}, ${deals.address} )`)
  console.log(' 3. In Store contract, grant CURATOR_ROLE and FUNDER_ROLE to admin')
  console.log(`    - ${network.scanner}/address/${store.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('FUNDER_ROLE')}, ${admin.address} )`)
  console.log(`    - grantRole( ${getRole('CURATOR_ROLE')}, ${admin.address} )`)
  console.log('    - Recommended that the admin is not the deployer')
  console.log('')
  console.log('-----------------------------------')
  console.log('Notes:')
  console.log(' - $GRATIS contract has the following roles:')
  console.log(`   - MINTER_ROLE - ${getRole('MINTER_ROLE')}`)
  console.log(`   - PAUSER_ROLE - ${getRole('PAUSER_ROLE')}`)
  console.log(' - There is no limit to $GRATIS, but $GRATIS right now can only be earned through staking')
  console.log(' - Store contract has the following roles:')
  console.log(`   - MINTER_ROLE - ${getRole('MINTER_ROLE')}`)
  console.log(`   - PAUSER_ROLE - ${getRole('PAUSER_ROLE')}`)
  console.log(`   - FUNDER_ROLE - ${getRole('FUNDER_ROLE')}`)
  console.log(`   - CURATOR_ROLE - ${getRole('CURATOR_ROLE')}`)
  console.log(' - Store has various ways to mint including')
  console.log('   - For admins - `mint(address, uint256, uint256)`')
  console.log('   - For buyers - `buy(address, uint256, uint256)`')
  console.log('   - For vouchers - `redeem(address, uint256, uint256, bytes)`')
  console.log(' - Staking has no admin')
  console.log(' - Deals is ownable in order to `makeDeal(uint256 id, uint256 price)`')

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});