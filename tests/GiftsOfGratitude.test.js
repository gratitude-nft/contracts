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

describe('GratitudeStore Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    this.contractURI = 'https://ipfs.io/ipfs/Qm123abc'
    this.baseURI = 'https://ipfs.io/ipfs/Qm123abc/'

    const store = await deploy(
      'GiftsOfGratitude', 
      this.contractURI, 
      this.baseURI,
      signers[0].address
    )
    
    const [ 
      admin, 
      holder1, 
      holder2
    ] = await bindContract(
      'withStore', 
      'GiftsOfGratitude', 
      store,
      signers
    )

    //allow admin to mint, curate and fund
    await admin.withStore.grantRole(getRole('FUNDER_ROLE'), admin.address)
    await admin.withStore.grantRole(getRole('MINTER_ROLE'), admin.address)
    await admin.withStore.grantRole(getRole('CURATOR_ROLE'), admin.address)

    this.signers = {
      admin, 
      holder1, 
      holder2
    }
  })

  it('Should add tokens', async function () {
    const { admin } = this.signers
    //sample limited with price
    await admin.withStore.addToken(1, 5, ethers.utils.parseEther('0.06'))
    //sample unlimited with price
    await admin.withStore.addToken(2, 0, ethers.utils.parseEther('0.01'))
    //sample limited with no price
    await admin.withStore.addToken(3, 5, 0)
    //sample unlimited with no price
    await admin.withStore.addToken(4, 0, 0)

    expect(await admin.withStore.maxSupply(1)).to.equal(5)
    expect(await admin.withStore.maxSupply(2)).to.equal(0)
    expect(await admin.withStore.maxSupply(3)).to.equal(5)
    expect(await admin.withStore.maxSupply(4)).to.equal(0)

    expect(await admin.withStore.mintPrice(1)).to.equal(ethers.utils.parseEther('0.06'))
    expect(await admin.withStore.mintPrice(2)).to.equal(ethers.utils.parseEther('0.01'))
    expect(await admin.withStore.mintPrice(3)).to.equal(0)
    expect(await admin.withStore.mintPrice(4)).to.equal(0)

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