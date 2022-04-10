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

describe('GratisDeals Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    const store = await deploy(
      'GratitudeStore', 
      'https://ipfs.io/ipfs/Qm123abc', 
      'https://ipfs.io/ipfs/Qm123abc/',
      signers[0].address
    )
    const token = await deploy('Gratis', signers[0].address)
    const deals = await deploy(
      'GratisDeals',
      token.address, 
      store.address
    )
    
    await bindContract('withStore', 'GratitudeStore', store, signers)
    await bindContract('withToken', 'Gratis', token, signers)
    await bindContract('withDeals', 'GratisDeals', deals, signers)

    const [ admin, buyer ] = signers

    //allow admin to mint $GRATIS
    await admin.withToken.grantRole(getRole('MINTER_ROLE'), admin.address)
    //allow admin to curate items
    await admin.withStore.grantRole(getRole('CURATOR_ROLE'), admin.address)
    //allow deals to mint products on store
    await admin.withStore.grantRole(
      getRole('MINTER_ROLE'), 
      admin.withDeals.address
    )

    this.signers = { admin, buyer }
  })

  it('Should set price', async function() {
    const { admin } = this.signers
    //make an item in the store
    //sample limited with price
    await admin.withStore.addToken(1, 5, ethers.utils.parseEther('0.06'))
    await admin.withDeals.makeDeal(1, ethers.utils.parseEther('8'))
    //sample unlimited with price
    await admin.withStore.addToken(2, 0, ethers.utils.parseEther('0.01'))
    await admin.withDeals.makeDeal(2, ethers.utils.parseEther('2'))

    expect(await admin.withDeals.getPrice(1)).to.equal(
      ethers.utils.parseEther('8')
    )

    expect(await admin.withDeals.getPrice(2)).to.equal(
      ethers.utils.parseEther('2')
    )
  })

  it('Should allow buyer to buy', async function() {
    const { admin, buyer } = this.signers
    //1. add 20 $GRATIS to buyer
    await admin.withToken.mint(buyer.address, ethers.utils.parseEther('20'))
    //2. approve deals of 16 $GRATIS
    await buyer.withToken.approve(
      buyer.withDeals.address,
      ethers.utils.parseEther('16')
    )
    //3. buy item from store
    await admin.withDeals.buy(buyer.address, 1, 2)
    
    expect(await admin.withStore.balanceOf(buyer.address, 1)).to.equal(2)
    expect(await admin.withToken.balanceOf(buyer.address)).to.equal(
      ethers.utils.parseEther('4')
    )
    expect(await admin.withToken.balanceOf(admin.withDeals.address)).to.equal(0)

    //2. approve deals of 4 $GRATIS
    await buyer.withToken.approve(
      buyer.withDeals.address,
      ethers.utils.parseEther('4')
    )
    //3. buy item from store
    await admin.withDeals.buy(buyer.address, 2, 2)
    expect(await admin.withStore.balanceOf(buyer.address, 2)).to.equal(2)
    expect(await admin.withToken.balanceOf(buyer.address)).to.equal(0)
    expect(await admin.withToken.balanceOf(admin.withDeals.address)).to.equal(0)
  })

  it('Should not allow buyer to buy', async function() {
    const { admin, buyer } = this.signers
    //add 24 $GRATIS to buyer
    await admin.withToken.mint(buyer.address, ethers.utils.parseEther('24'))
    await expect( //no allowance
      admin.withDeals.buy(buyer.address, 1, 2)
    ).to.be.revertedWith('InvalidCall()')

    //approve deals of 24 $GRATIS
    await buyer.withToken.approve(
      buyer.withDeals.address,
      ethers.utils.parseEther('32')
    )
    await expect( //max quantity
      admin.withDeals.buy(buyer.address, 1, 4)
    ).to.be.revertedWith('InvalidCall()')
  })
})