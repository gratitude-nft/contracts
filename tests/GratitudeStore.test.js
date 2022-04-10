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

describe('GratitudeStore Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    this.contractURI = 'https://ipfs.io/ipfs/Qm123abc'
    this.baseURI = 'https://ipfs.io/ipfs/Qm123abc/'

    const store = await deploy(
      'GratitudeStore', 
      this.contractURI, 
      this.baseURI,
      signers[0].address
    )
    
    const [ 
      admin, 
      holder1, 
      holder2, 
      holder3, 
      holder4
    ] = await bindContract(
      'withStore', 
      'GratitudeStore', 
      store,
      signers
    )

    this.signers = {
      admin, 
      holder1, 
      holder2, 
      holder3, 
      holder4
    }
  })

  it('Should', async function() {})
})