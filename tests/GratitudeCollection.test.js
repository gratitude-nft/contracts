const { expect } = require('chai');
require('dotenv').config()

if (process.env.BLOCKCHAIN_NETWORK != 'hardhat') {
  console.error('Exited testing with network:', process.env.BLOCKCHAIN_NETWORK)
  process.exit(1);
}

async function getSigners(name, ...params) {
  //deploy the contract
  const ContractFactory = await ethers.getContractFactory(name)
  const contract = await ContractFactory.deploy(...params)
  await contract.deployed()
  //get the signers
  const signers = await ethers.getSigners()
  //attach contracts
  for (let i = 0; i < signers.length; i++) {
    const Contract = await ethers.getContractFactory(name, signers[i])
    signers[i].withContract = await Contract.attach(contract.address)
  }

  return signers
}

function authorizeToken(recipient) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address'],
      ['authorized', recipient]
    ).slice(2),
    'hex'
  )
}

function redeemToken(uri, recipient, ambassador) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'string', 'address', 'bool'],
      ['redeemable', uri, recipient, ambassador]
    ).slice(2),
    'hex'
  )
}

describe('GratitideCollection Tests', function () {
  before(async function() {
    this.uri = 'https://gateway.pinata.cloud/ipfs/'
    this.cid = 'QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG'

    this.ambassadors = [
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000001.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000002.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000003.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000004.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000005.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000006.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000007.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000008.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000009.json',
      'https://gateway.pinata.cloud/ipfs/QmdEx27SazwDr6jBvQQQziGjsuXga8NCCFj51dEZen9cLe/1000010.json'
    ]
    
    const [
      contractOwner, 
      founder1,
      founder2,
      tokenOwner1, 
      tokenOwner2, 
      ambassador1, 
      ambassador2 
    ] = await getSigners('GratitideCollection', this.uri, this.cid)
    
    this.signers = { 
      contractOwner, 
      founder1,
      founder2,
      tokenOwner1, 
      tokenOwner2, 
      ambassador1, 
      ambassador2 
    }
  })
  
  it('Should get contract uri', async function () {
    const { contractOwner } = this.signers
    expect(
      await contractOwner.withContract.contractURI()
    ).to.equal(`${this.uri}${this.cid}/contract.json`)
  })
  
  it('Should redeem', async function () {
    const { contractOwner, ambassador1, ambassador2 } = this.signers

    const message1 = redeemToken(this.ambassadors[0], ambassador1.address, false)
    const signature1 = await contractOwner.signMessage(message1)
    await ambassador1.withContract.redeem(this.ambassadors[0], false, signature1)

    expect(await contractOwner.withContract.ownerOf(1)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(2)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(3)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(4)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.tokenURI(1)).to.equal(this.ambassadors[0])
    expect(await contractOwner.withContract.tokenURI(2)).to.equal(`${this.uri}${this.cid}/placeholder.json`)
    expect(await contractOwner.withContract.tokenURI(3)).to.equal(`${this.uri}${this.cid}/placeholder.json`)
    expect(await contractOwner.withContract.tokenURI(4)).to.equal(`${this.uri}${this.cid}/placeholder.json`)

    const message2 = redeemToken(this.ambassadors[1], ambassador2.address, true)
    const signature2 = await contractOwner.signMessage(message2)
    await ambassador2.withContract.redeem(this.ambassadors[1], true, signature2)

    expect(await contractOwner.withContract.ownerOf(5)).to.equal(ambassador2.address)
    expect(await contractOwner.withContract.tokenURI(5)).to.equal(this.ambassadors[1])
  })
  
  it('Should not mint', async function () {
    const { contractOwner, tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('Sale has not started')

    const message = authorizeToken(tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
    await expect(
      tokenOwner1.withContract.authorize(3, signature, { value: ethers.utils.parseEther('0.05') })
    ).to.be.revertedWith('Presale has not started')
  })
  
  it('Should error when getting token URI', async function () {
    const { contractOwner } = this.signers
    await expect(
      contractOwner.withContract.tokenURI(6)
    ).to.be.revertedWith('URI query for nonexistent token')
  })

  it('Should time travel to Feb 13, 2021', async function () {  
    await ethers.provider.send('evm_mine');
    await ethers.provider.send('evm_setNextBlockTimestamp', [1644710400]); 
    await ethers.provider.send('evm_mine');
  })

  it('Should authorize', async function () {
    const { contractOwner, tokenOwner1 } = this.signers

    const message = authorizeToken(tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
    await tokenOwner1.withContract.authorize(2, signature, { value: ethers.utils.parseEther('0.10') })

    expect(await contractOwner.withContract.ownerOf(6)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(7)).to.equal(tokenOwner1.address)
  })

  it('Should time travel to Feb 22, 2021', async function () {  
    await ethers.provider.send('evm_mine');
    await ethers.provider.send('evm_setNextBlockTimestamp', [1645561320]); 
    await ethers.provider.send('evm_mine');
  })

  it('Should mint', async function () {
    const { contractOwner, tokenOwner1 } = this.signers
    await tokenOwner1.withContract.mint(1, { value: ethers.utils.parseEther('0.05') })
    await tokenOwner1.withContract.mint(2, { value: ethers.utils.parseEther('0.10') })
    expect(await contractOwner.withContract.ownerOf(8)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(9)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(10)).to.equal(tokenOwner1.address)
  })

  it('Should not allow to mint more than 5', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('Cannot mint more than allowed')
  })

  it('Should withdraw', async function () {
    const { contractOwner } = this.signers

    expect(await contractOwner.withContract.indexOffset()).to.equal(0)

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
    )

    await contractOwner.withContract.withdraw()
    
    expect(parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.19)

    expect(await contractOwner.withContract.indexOffset()).to.be.above(0)
  })

  it('Should get the correct token URIs', async function () {
    const { contractOwner } = this.signers

    const max = parseInt(await contractOwner.withContract.MAX_SUPPLY())
    const offset = parseInt(await contractOwner.withContract.indexOffset())

    for (i = 6; i <= 10; i++) {
      const index = ((i + offset) % max) + 1
      expect(
        await contractOwner.withContract.tokenURI(i)
      ).to.equal(`${this.uri}${this.cid}/${index}.json`)
    }
  })
})