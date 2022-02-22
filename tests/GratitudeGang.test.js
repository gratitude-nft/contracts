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

describe('GratitudeGang Tests', function () {
  before(async function() {
    this.uri = 'https://gateway.pinata.cloud/ipfs/QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG/contract.json'
    this.base = 'https://gateway.pinata.cloud/ipfs/QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG/'
    this.preview = 'https://gateway.pinata.cloud/ipfs/QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG/preview.json'

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
    ] = await getSigners('GratitudeGang', this.uri, this.preview)
    
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
    ).to.equal(this.uri)
  })
  
  it('Should redeem', async function () {
    const { contractOwner, ambassador1, ambassador2 } = this.signers

    const message1 = redeemToken(this.ambassadors[0], ambassador1.address, false)
    const signature1 = await contractOwner.signMessage(message1)
    await ambassador1.withContract.redeem(ambassador1.address, this.ambassadors[0], false, signature1)

    expect(await contractOwner.withContract.ownerOf(2)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(3)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(4)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.ownerOf(5)).to.equal(ambassador1.address)
    expect(await contractOwner.withContract.tokenURI(2)).to.equal(this.ambassadors[0])
    expect(await contractOwner.withContract.tokenURI(3)).to.equal(this.preview)
    expect(await contractOwner.withContract.tokenURI(4)).to.equal(this.preview)
    expect(await contractOwner.withContract.tokenURI(5)).to.equal(this.preview)

    const message2 = redeemToken(this.ambassadors[1], ambassador2.address, true)
    const signature2 = await contractOwner.signMessage(message2)
    await ambassador2.withContract.redeem(ambassador2.address, this.ambassadors[1], true, signature2)

    expect(await contractOwner.withContract.ownerOf(6)).to.equal(ambassador2.address)
    expect(await contractOwner.withContract.tokenURI(6)).to.equal(this.ambassadors[1])
  })
  
  it('Should not mint', async function () {
    const { contractOwner, tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.24') })
    ).to.be.revertedWith('SaleNotStarted()')

    const message = authorizeToken(tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
    await expect(
      tokenOwner1.withContract.authorize(3, signature, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('WhitelistNotStarted()')
  })
  
  it('Should error when getting token URI', async function () {
    const { contractOwner } = this.signers
    await expect(
      contractOwner.withContract.tokenURI(7)
    ).to.be.revertedWith('NonExistentToken()')
  })

  it('Should start whitesale', async function () {  
    const { contractOwner } = this.signers
    expect(await contractOwner.withContract.whitelistStarted()).to.equal(false)
    await contractOwner.withContract.startWhitelist(false)
    expect(await contractOwner.withContract.whitelistStarted()).to.equal(false)
    await contractOwner.withContract.startWhitelist(true)
    expect(await contractOwner.withContract.whitelistStarted()).to.equal(true)
  })

  it('Should authorize', async function () {
    const { contractOwner, tokenOwner1 } = this.signers

    const message = authorizeToken(tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
    await tokenOwner1.withContract.authorize(2, signature, { value: ethers.utils.parseEther('0.10') })

    expect(await contractOwner.withContract.ownerOf(7)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(8)).to.equal(tokenOwner1.address)
  })

  it('Should not authorize with wrong amount', async function () {
    const { contractOwner, tokenOwner1 } = this.signers

    const message = authorizeToken(tokenOwner1.address)
    const signature = await contractOwner.signMessage(message)
  
    await expect(
      tokenOwner1.withContract.authorize(2, signature, { value: ethers.utils.parseEther('0.095') })
    ).to.be.revertedWith('InvalidAmount()')
  })
  
  it('Should not mint', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.24') })
    ).to.be.revertedWith('SaleNotStarted()')
  })

  it('Should start sale', async function () {  
    const { contractOwner } = this.signers
    expect(await contractOwner.withContract.saleStarted()).to.equal(false)
    await contractOwner.withContract.startSale(false)
    expect(await contractOwner.withContract.saleStarted()).to.equal(false)
    await contractOwner.withContract.startSale(true)
    expect(await contractOwner.withContract.saleStarted()).to.equal(true)
  })

  it('Should mint', async function () {
    const { contractOwner, tokenOwner1 } = this.signers
    await tokenOwner1.withContract.mint(1, { value: ethers.utils.parseEther('0.08') })
    await tokenOwner1.withContract.mint(2, { value: ethers.utils.parseEther('0.16') })
    expect(await contractOwner.withContract.ownerOf(9)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(10)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(11)).to.equal(tokenOwner1.address)
  })

  it('Should not allow to mint with wrong amount', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(1, { value: ethers.utils.parseEther('0.04') })
    ).to.be.revertedWith('InvalidAmount()')
  })

  it('Should not allow to mint more than 5', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.24') })
    ).to.be.revertedWith('InvalidAmount()')
  })

  it('Should withdraw', async function () {
    const { contractOwner } = this.signers

    expect(await contractOwner.withContract.indexOffset()).to.equal(0)

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
    )

    await expect(
      contractOwner.withContract.withdraw()
    ).to.be.revertedWith('NoBaseURI()')

    await contractOwner.withContract.setBaseURI(this.base)
    expect(await contractOwner.withContract.baseTokenURI()).to.equal(this.base)
    await contractOwner.withContract.withdraw()
    
    expect(parseFloat(
      ethers.utils.formatEther(await contractOwner.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.33)

    expect(await contractOwner.withContract.indexOffset()).to.be.above(0)
  })

  it('Should get the correct token URIs', async function () {
    const { contractOwner } = this.signers

    const max = parseInt(await contractOwner.withContract.MAX_SUPPLY())
    const offset = parseInt(await contractOwner.withContract.indexOffset())

    for (i = 7; i <= 11; i++) {
      const index = ((i + offset) % max) + 1
      expect(
        await contractOwner.withContract.tokenURI(i)
      ).to.equal(`${this.base}${index}.json`)
    }
  })

  it('Should calc royalties', async function () {
    const { contractOwner } = this.signers

    const info = await contractOwner.withContract.royaltyInfo(1, 1000)
    expect(info.receiver).to.equal(contractOwner.address)
    expect(info.royaltyAmount).to.equal(100)
  })
})