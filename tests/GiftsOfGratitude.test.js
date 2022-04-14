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

function voucher(recipient, tokenId, quantity) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256', 'uint256'],
      ['redeem', recipient, tokenId, quantity]
    ).slice(2),
    'hex'
  )
}

describe('GiftsOfGratitude Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    this.contractURI = 'https://ipfs.io/ipfs/Qm123abc'
    this.baseURI = 'https://ipfs.io/ipfs/Qm123abc/'

    const token = await deploy('TokensOfGratitude', signers[0].address)
    const store = await deploy(
      'GiftsOfGratitude', 
      this.contractURI, 
      this.baseURI,
      token.address,
      signers[0].address
    )

    await bindContract('withStore', 'GiftsOfGratitude', store, signers)
    await bindContract('withToken', 'TokensOfGratitude', token, signers)
    
    const [ admin, holder1, holder2 ] = signers

    //allow admin to mint, curate and fund
    await admin.withStore.grantRole(getRole('FUNDER_ROLE'), admin.address)
    await admin.withStore.grantRole(getRole('MINTER_ROLE'), admin.address)
    await admin.withStore.grantRole(getRole('CURATOR_ROLE'), admin.address)
    //allow admin to mint $GRATIS
    await admin.withToken.grantRole(getRole('MINTER_ROLE'), admin.address)

    this.signers = { admin, holder1, holder2 }
  })

  it('Should add tokens', async function () {
    const { admin } = this.signers
    //sample limited with price
    await admin.withStore.addToken(1, 5, 
      ethers.utils.parseEther('0.06'),
      ethers.utils.parseEther('8')
    )
    //sample unlimited with price
    await admin.withStore.addToken(2, 0, 
      ethers.utils.parseEther('0.01'),
      ethers.utils.parseEther('2')
    )
    //sample limited with no price
    await admin.withStore.addToken(3, 5, 0, 0)
    //sample unlimited with no price
    await admin.withStore.addToken(4, 0, 0, ethers.utils.parseEther('1'))

    expect(await admin.withStore.maxSupply(1)).to.equal(5)
    expect(await admin.withStore.maxSupply(2)).to.equal(0)
    expect(await admin.withStore.maxSupply(3)).to.equal(5)
    expect(await admin.withStore.maxSupply(4)).to.equal(0)

    expect(await admin.withStore.ethPrice(1)).to.equal(ethers.utils.parseEther('0.06'))
    expect(await admin.withStore.ethPrice(2)).to.equal(ethers.utils.parseEther('0.01'))
    expect(await admin.withStore.ethPrice(3)).to.equal(0)
    expect(await admin.withStore.ethPrice(4)).to.equal(0)

    expect(await admin.withStore.gratisPrice(1)).to.equal(ethers.utils.parseEther('8'))
    expect(await admin.withStore.gratisPrice(2)).to.equal(ethers.utils.parseEther('2'))
    expect(await admin.withStore.gratisPrice(3)).to.equal(0)
    expect(await admin.withStore.gratisPrice(4)).to.equal(ethers.utils.parseEther('1'))

    expect(await admin.withStore.remainingSupply(1)).to.equal(5)
    expect(await admin.withStore.remainingSupply(3)).to.equal(5)
  })

  it('Should not mint', async function () {
    const { admin, holder1, holder2 } = this.signers
    //wrong amounts
    await expect(admin.withStore.mint(holder1.address, 1, 6)).to.revertedWith('InvalidCall()')
    await expect(admin.withStore.mint(holder1.address, 3, 6)).to.revertedWith('InvalidCall()')
  })

  it('Should mint', async function () {
    const { admin, holder1 } = this.signers

    await admin.withStore.mint(holder1.address, 1, 2)
    expect(await admin.withStore.balanceOf(holder1.address, 1)).to.equal(2)
    expect(await admin.withStore.remainingSupply(1)).to.equal(3)

    await admin.withStore.mint(holder1.address, 2, 2)
    expect(await admin.withStore.balanceOf(holder1.address, 2)).to.equal(2)

    await admin.withStore.mint(holder1.address, 3, 2)
    expect(await admin.withStore.balanceOf(holder1.address, 3)).to.equal(2)
    expect(await admin.withStore.remainingSupply(3)).to.equal(3)

    await admin.withStore.mint(holder1.address, 4, 2)
    expect(await admin.withStore.balanceOf(holder1.address, 4)).to.equal(2)
  })

  it('Should not mint', async function () {
    const { admin, holder1, holder2 } = this.signers

    //wrong amounts
    await expect(admin.withStore.mint(holder1.address, 1, 4)).to.revertedWith('InvalidCall()')
    await expect(admin.withStore.mint(holder1.address, 3, 4)).to.revertedWith('InvalidCall()')
  })

  it('Should buy', async function () {
    const { admin, holder2 } = this.signers

    await admin.withStore.buy(holder2.address, 1, 2, { 
      value: ethers.utils.parseEther('0.12') 
    })
    expect(await admin.withStore.balanceOf(holder2.address, 1)).to.equal(2)

    await admin.withStore.buy(holder2.address, 2, 2, { 
      value: ethers.utils.parseEther('0.02') 
    })
    expect(await admin.withStore.balanceOf(holder2.address, 2)).to.equal(2)
  })

  it('Should not buy', async function () {
    const { admin, holder2 } = this.signers

    //wrong amount
    await expect(
      admin.withStore.buy(holder2.address, 1, 1, { 
        value: ethers.utils.parseEther('0.04') 
      })
    ).to.revertedWith('InvalidCall()')

    //passed max
    await expect(
      admin.withStore.buy(holder2.address, 1, 2, { 
        value: ethers.utils.parseEther('0.12') 
      })
    ).to.revertedWith('InvalidCall()')

    //no id
    await expect(
      admin.withStore.buy(holder2.address, 5, 4, { 
        value: ethers.utils.parseEther('0.04') 
      })
    ).to.revertedWith('InvalidCall()')

    //not saleable
    await expect(
      admin.withStore.buy(holder2.address, 3, 2, { 
        value: ethers.utils.parseEther('0.04') 
      })
    ).to.revertedWith('InvalidCall()')

    //not saleable
    await expect(
      admin.withStore.buy(holder2.address, 4, 2)
    ).to.revertedWith('InvalidCall()')

  })

  it('Should redeem', async function () {
    const { admin, holder2 } = this.signers

    const message = voucher(holder2.address, 2, 2)
    const signature = await admin.signMessage(message)

    await admin.withStore.redeem(holder2.address, 2, 2, signature)
    expect(await admin.withStore.balanceOf(holder2.address, 2)).to.equal(4)
  })

  it('Should support', async function() {
    const { admin, holder1 } = this.signers
    //1. add 20 $GRATIS to holder1
    await admin.withToken.mint(holder1.address, ethers.utils.parseEther('20'))
    //2. approve deals of 8 $GRATIS
    await holder1.withToken.approve(
      holder1.withStore.address,
      ethers.utils.parseEther('8')
    )
    //3. buy item from store
    await admin.withStore.support(holder1.address, 1, 1)
    
    expect(await admin.withStore.balanceOf(holder1.address, 1)).to.equal(3)
    expect(await admin.withToken.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('12')
    )
    expect(await admin.withToken.balanceOf(admin.withStore.address)).to.equal(0)

    //2. approve deals of 2 $GRATIS
    await holder1.withToken.approve(
      holder1.withStore.address,
      ethers.utils.parseEther('2')
    )
    //3. buy item from store
    await admin.withStore.support(holder1.address, 2, 1)
    expect(await admin.withStore.balanceOf(holder1.address, 2)).to.equal(3)
    expect(await admin.withToken.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('10')
    )
    expect(await admin.withToken.balanceOf(admin.withStore.address)).to.equal(0)

    //2. approve deals of 10 $GRATIS
    await holder1.withToken.approve(
      holder1.withStore.address,
      ethers.utils.parseEther('10')
    )
    //3. buy item from store
    await admin.withStore.support(holder1.address, 4, 10)
    expect(await admin.withStore.balanceOf(holder1.address, 4)).to.equal(12)
    expect(await admin.withToken.balanceOf(holder1.address)).to.equal(0)
    expect(await admin.withToken.balanceOf(admin.withStore.address)).to.equal(0)
  })

  it('Should not support', async function() {
    const { admin, holder1 } = this.signers
    //add 24 $GRATIS to holder1
    await admin.withToken.mint(holder1.address, ethers.utils.parseEther('24'))
    await expect( //no allowance
      admin.withStore.buy(holder1.address, 4, 2)
    ).to.be.revertedWith('InvalidCall()')

    //approve deals of 24 $GRATIS
    await holder1.withToken.approve(
      holder1.withStore.address,
      ethers.utils.parseEther('32')
    )
    await expect( //max quantity
      admin.withStore.buy(holder1.address, 1, 4)
    ).to.be.revertedWith('InvalidCall()')
  })

  it('Should withdraw', async function () {
    const { admin } = this.signers

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
    )

    await admin.withStore['withdraw(address)'](admin.address)
    
    expect(parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.13)
  })
})