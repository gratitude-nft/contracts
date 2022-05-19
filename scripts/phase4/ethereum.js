//to run this on testnet:
// $ npx hardhat run scripts/phase4/ethereum.js

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

  // get the token contract that was deployed
  const token = { address: network.contracts.token }

  // next deploy the staking
  const sourceChainId = hardhat.config.defaultNetwork === 'ethereum'? 1: 4
  const destinationChainId = hardhat.config.defaultNetwork === 'ethereum'? 137: 80001
  const bridge = await deploy('GratisBridge', sourceChainId, token.address, admin.address)
  const vault = await deploy('GratitudeVault', token.address, admin.address)

  console.log('')
  console.log('-----------------------------------')
  console.log('GratisBridge deployed to:', bridge.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    bridge.address,
    sourceChainId,
    `"${token.address}"`,
    `"${admin.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('GratitudeVault deployed to:', vault.address)
  console.log(
    'npx hardhat verify --show-stack-traces --network',
    hardhat.config.defaultNetwork,
    vault.address,
    `"${token.address}"`,
    `"${admin.address}"`
  )
  console.log('')
  console.log('-----------------------------------')
  console.log('Next Steps:')
  console.log(' 1. In TokensOfGratitude contract, grant MINTER_ROLE, BURNER_ROLE to GratisBridge')
  console.log(`    - ${network.scanner}/address/${token.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('MINTER_ROLE')}, ${bridge.address} )`)
  console.log(`    - grantRole( ${getRole('BURNER_ROLE')}, ${bridge.address} )`)
  console.log('')
  console.log(' 2. In GratisBridge contract, grant CURATOR_ROLE to admin')
  console.log(`    - ${network.scanner}/address/${bridge.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('CURATOR_ROLE')}, ${admin.address} )`)
  console.log('')
  console.log(' 3. In GratisBridge contract, grant SIGNER_ROLE to signer')
  console.log(`    - ${network.scanner}/address/${bridge.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('SIGNER_ROLE')}, ${network.signer} )`)
  console.log('')
  console.log(' 4. In GratisBridge, add Ethereum destination')
  console.log(`    - ${network.scanner}/address/${bridge.address}#writeContract`)
  console.log(`    - addDestination( ${sourceChainId}, ${bridge.address} )`)
  console.log('')
  console.log(' 5. In GratisBridge, add Polygon destination')
  console.log(`    - ${network.scanner}/address/${bridge.address}#writeContract`)
  console.log(`    - addDestination( ${destinationChainId}, ??? )`)
  console.log('')
  console.log(' 6. In GratitudeVault, grant FUNDER_ROLE, MINTER_ROLE, CURATOR_ROLE to admin')
  console.log(`    - ${network.scanner}/address/${vault.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('FUNDER_ROLE')}, ${admin.address} )`)
  console.log(`    - grantRole( ${getRole('MINTER_ROLE')}, ${admin.address} )`)
  console.log(`    - grantRole( ${getRole('CURATOR_ROLE')}, ${admin.address} )`)
  console.log('')
  console.log(' 7. In TokensOfGratitude contract, grant BURNER_ROLE to GratitudeVault')
  console.log(`    - ${network.scanner}/address/${token.address}#writeContract`)
  console.log(`    - grantRole( ${getRole('BURNER_ROLE')}, ${vault.address} )`)
  console.log('')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
});