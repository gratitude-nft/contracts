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

describe('GratitideCollection Tests', function () {
  before(async function() {
    this.cidFolder = 'Qm123abc'
    
    const [
      contractOwner, 
      founder1,
      founder2,
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4 
    ] = await getSigners('GratitideCollection', this.cidFolder)
    
    this.signers = { 
      contractOwner, 
      founder1,
      founder2,
      tokenOwner1, 
      tokenOwner2, 
      tokenOwner3, 
      tokenOwner4 
    }
  })
  
  it('Should get contract uri', async function () {
    const { contractOwner } = this.signers
    await contractOwner.withContract.setBaseTokenURI('https://ipfs.io/ipfs/')
    expect(
      await contractOwner.withContract.contractURI()
    ).to.equal('https://ipfs.io/ipfs/Qm123abc/contract.json')
  })
  
  it('Should reserve the first 16 tokens', async function () {
    const { contractOwner } = this.signers
    expect(await contractOwner.withContract.ownerOf(1)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(2)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(3)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(4)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(5)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(6)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(7)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(8)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(9)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(10)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(11)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(12)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(13)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(14)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(15)).to.equal(contractOwner.address)
    expect(await contractOwner.withContract.ownerOf(16)).to.equal(contractOwner.address)
  })
  
  it('Should not mint', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('Sale has not started')
  })
  
  it('Should error when getting token URI', async function () {
    const { contractOwner } = this.signers
    await expect(
      contractOwner.withContract.tokenURI(1)
    ).to.be.revertedWith('Collection not released yet')
  })

  it('Should time travel to Feb 22, 2021', async function () {  
    await ethers.provider.send('evm_mine');
    await ethers.provider.send('evm_setNextBlockTimestamp', [1645561320]); 
    await ethers.provider.send('evm_mine');
  })

  it('Should mint', async function () {
    const { contractOwner, tokenOwner1 } = this.signers
    await tokenOwner1.withContract.mint(1, { value: ethers.utils.parseEther('0.05') })
    await tokenOwner1.withContract.mint(1, { value: ethers.utils.parseEther('0.05') })
    await tokenOwner1.withContract.mint(2, { value: ethers.utils.parseEther('0.10') })
    expect(await contractOwner.withContract.ownerOf(17)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(18)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(19)).to.equal(tokenOwner1.address)
    expect(await contractOwner.withContract.ownerOf(20)).to.equal(tokenOwner1.address)
  })

  it('Should not allow to mint more than 5', async function () {
    const { tokenOwner1 } = this.signers
    await expect(
      tokenOwner1.withContract.mint(3, { value: ethers.utils.parseEther('0.15') })
    ).to.be.revertedWith('Cannot mint more than allowed')
  })

  it('Should error when getting token URI', async function () {
    const { contractOwner } = this.signers
    await expect(
      contractOwner.withContract.tokenURI(17)
    ).to.be.revertedWith('Collection not released yet')
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

    expect(
      await contractOwner.withContract.tokenURI(1)
    ).to.equal('https://ipfs.io/ipfs/Qm123abc/0.json')

    expect(
      await contractOwner.withContract.tokenURI(2)
    ).to.equal('https://ipfs.io/ipfs/Qm123abc/1.json')

    expect(
      await contractOwner.withContract.tokenURI(3)
    ).to.equal('https://ipfs.io/ipfs/Qm123abc/2.json')

    expect(
      await contractOwner.withContract.tokenURI(4)
    ).to.equal('https://ipfs.io/ipfs/Qm123abc/3.json')

    for (i = 5; i <= 20; i++) {
      const index = ((i - 4 + offset) % (max - 4)) + 4
      expect(
        await contractOwner.withContract.tokenURI(i)
      ).to.equal(`https://ipfs.io/ipfs/Qm123abc/${index}.json`)
    }
  })
})