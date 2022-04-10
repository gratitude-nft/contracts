const { expect } = require('chai')

if (process.env.BLOCKCHAIN_NETWORK != 'hardhat') {
  console.error('Exited testing with network:', process.env.BLOCKCHAIN_NETWORK)
  process.exit(1);
}

async function deploy(name, ...params) {
  //deploy the contract
  const ContractFactory = await ethers.getContractFactory(name)
  const contract = await ContractFactory.deploy(...params)
  await contract.deployed()

  return contract
}

async function getSigners(key, name, ...params) {
  //deploy the contract
  const contract = await deploy(name, ...params)
  //get the signers
  const signers = await ethers.getSigners()
  return await bindContract(key, name, contract, signers)
}

async function bindContract(key, name, contract, signers) {
  //attach contracts
  for (let i = 0; i < signers.length; i++) {
    const Contract = await ethers.getContractFactory(name, signers[i])
    signers[i][key] = await Contract.attach(contract.address)
  }

  return signers
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

describe('SunflowerStaking Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    const nft = await deploy(
      'GratitudeGang', 
      'https://ipfs.io/ipfs/Qm123abc', 
      'https://ipfs.io/ipfs/Qm123abc/'
    )
    const token = await deploy('Gratis', signers[0].address)
    const staking = await deploy(
      'SunflowerStaking',
      nft.address,
      token.address
    )

    await bindContract('withNFT', 'GratitudeGang', nft, signers)
    await bindContract('withToken', 'Gratis', token, signers)
    await bindContract('withStaking', 'GratisDeals', staking, signers)

    const [
      admin,
      holder1
    ] = signers

    //allow deals to mint products on market
    await admin.withToken.grantRole(
      getRole('MINTER_ROLE'), 
      admin.withStaking.address
    )

    this.signers = {
      admin,
      holder1
    }
  })

  it('Should', async function() {})
})