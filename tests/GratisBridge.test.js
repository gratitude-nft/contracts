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

function redeem(contractId, contractAddress, id, amount) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'uint256', 'address', 'uint256', 'uint256'],
      ['redeem', contractId, contractAddress, id, amount]
    ).slice(2),
    'hex'
  )
}

function secureRedeem(contractId, contractAddress, id, amount, owner) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'uint256', 'address', 'uint256', 'uint256', 'address'],
      ['redeem', contractId, contractAddress, id, amount, owner]
    ).slice(2),
    'hex'
  )
}

describe('GratisBridge Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    const token1 = await deploy('TokensOfGratitude', signers[0].address)
    const tx1 = await deploy('GratisBridge', 1, token1.address, signers[0].address)
    
    const token2 = await deploy('TokensOfGratitude', signers[0].address)
    const tx2 = await deploy('GratisBridge', 2, token2.address, signers[0].address)

    await bindContract('withToken1', 'TokensOfGratitude', token1, signers)
    await bindContract('withToken2', 'TokensOfGratitude', token2, signers)
    
    await bindContract('withVoucher1', 'GratisBridge', tx1, signers)
    await bindContract('withVoucher2', 'GratisBridge', tx2, signers)

    const [ admin, signer, holder1, holder2 ] = signers

    //allow txs to mint and burn tokens
    await admin.withToken1.grantRole(getRole('MINTER_ROLE'), admin.withVoucher1.address)
    await admin.withToken1.grantRole(getRole('BURNER_ROLE'), admin.withVoucher1.address)
    await admin.withToken2.grantRole(getRole('MINTER_ROLE'), admin.withVoucher2.address)
    await admin.withToken2.grantRole(getRole('BURNER_ROLE'), admin.withVoucher2.address)

    //allow admin to curate on both txs
    await admin.withVoucher1.grantRole(getRole('CURATOR_ROLE'), admin.address)
    await admin.withVoucher2.grantRole(getRole('CURATOR_ROLE'), admin.address)
    //allow signer to sign messages on both txs
    await admin.withVoucher1.grantRole(getRole('SIGNER_ROLE'), signer.address)
    await admin.withVoucher2.grantRole(getRole('SIGNER_ROLE'), signer.address)

    //mint tokens to holder
    await admin.withToken1.grantRole(getRole('MINTER_ROLE'), admin.address)
    await admin.withToken1.mint(holder1.address, ethers.utils.parseEther('10'))

    this.signers = { admin, signer, holder1, holder2 }
  })

  it('Should be locked', async function() {
    const { admin, holder1 } = this.signers
    await expect(//no destination error
      holder1.withVoucher1.bridge(
        //contract id destination
        1, 
        //contract address destination
        holder1.withVoucher1.address, 
        //amount to burn
        ethers.utils.parseEther('2')
      )
    ).to.be.revertedWith('InvalidCall()')

    //add self to destination
    await admin.withVoucher1.addDestination(1, holder1.withVoucher1.address)
    expect(
      await admin.withVoucher1.destinations(1)
    ).to.equal(holder1.withVoucher1.address)
  })

  it('Should create tx for self', async function() {
    const { admin, signer, holder1 } = this.signers
    await holder1.withVoucher1.bridge(
      //contract id destination
      1, 
      //contract address destination
      holder1.withVoucher1.address, 
      //amount to burn
      ethers.utils.parseEther('2')
    )
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('8')
    )

    const txId = await admin.withVoucher1.lastId()

    const message = redeem(
      //contract id destination
      1, 
      //contract address destination
      holder1.withVoucher1.address, 
      //tx id
      txId, 
      //amount to mint
      ethers.utils.parseEther('2')
    )
    const signature = await signer.signMessage(message)

    await holder1.withVoucher1.redeem(
      //tx id
      txId, 
      //amount to mint
      ethers.utils.parseEther('2'),
      //recipient
      holder1.address,
      //proof
      signature
    )

    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('10')
    )
  })

  it('Should not create tx for self', async function() {
    const { admin, signer, holder1 } = this.signers
    await expect(//no destination error
      holder1.withVoucher1.bridge(
        //contract id destination (wrong destination)
        2, 
        //contract address destination
        holder1.withVoucher1.address, 
        //amount to burn
        ethers.utils.parseEther('2')
      )
    ).to.be.revertedWith('InvalidCall()')

    //this part should be right
    await holder1.withVoucher1.bridge(
      //contract id destination (wrong destination)
      1, 
      //contract address destination
      holder1.withVoucher1.address, 
      //amount to burn
      ethers.utils.parseEther('2')
    )
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('8')
    )

    const txId = await admin.withVoucher1.lastId()

    const message1 = redeem(
      //contract id destination (wrong destination)
      2, 
      //contract address destination
      holder1.withVoucher1.address, 
      //tx id
      txId, 
      //amount to mint
      ethers.utils.parseEther('2')
    )

    await expect(
      holder1.withVoucher1.redeem(
        //tx id
        txId, 
        //amount to mint
        ethers.utils.parseEther('2'),
        //recipient
        holder1.address,
        //proof
        await signer.signMessage(message1)
      )
    ).to.be.revertedWith('InvalidCall()')

    const message2 = redeem(
      //contract id destination
      1, 
      //contract address destination
      holder1.withVoucher1.address, 
      //tx id (wrong id)
      100, 
      //amount to mint
      ethers.utils.parseEther('2')
    )

    await expect(
      holder1.withVoucher1.redeem(
        //tx id
        1, 
        //amount to mint
        ethers.utils.parseEther('2'),
        //recipient
        holder1.address,
        //proof
        await signer.signMessage(message2)
      )
    ).to.be.revertedWith('InvalidCall()')

    //final balance
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('8')
    )
  })

  it('Should gift tx for someone else', async function() {
    const { admin, signer, holder1, holder2 } = this.signers
    const destinationContractId = 1
    const destinationContractAddress = holder1.withVoucher1.address
    
    await holder1.withVoucher1.bridge(
      destinationContractId, 
      destinationContractAddress, 
      ethers.utils.parseEther('2')
    )
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('6')
    )

    const txId = await admin.withVoucher1.lastId()

    const message = redeem(
      destinationContractId, 
      destinationContractAddress, 
      txId, 
      ethers.utils.parseEther('2')
    )
    const signature = await signer.signMessage(message)

    await holder2.withVoucher1.redeem(
      txId, 
      ethers.utils.parseEther('2'),
      holder2.address,
      signature
    )

    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('6')
    )

    expect(await admin.withToken1.balanceOf(holder2.address)).to.equal(
      ethers.utils.parseEther('2')
    )
  })

  it('Should securely redeem', async function() {
    const { admin, signer, holder1 } = this.signers
    const destinationContractId = 1
    const destinationContractAddress = holder1.withVoucher1.address

    await holder1.withVoucher1.bridge(
      destinationContractId, 
      destinationContractAddress, 
      ethers.utils.parseEther('2')
    )
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('4')
    )
    const txId = await admin.withVoucher1.lastId()

    const message = secureRedeem(
      destinationContractId, 
      destinationContractAddress, 
      txId, 
      ethers.utils.parseEther('2'), 
      holder1.address
    )
    const signature = await signer.signMessage(message)

    await admin.withVoucher1.secureRedeem(
      txId, 
      ethers.utils.parseEther('2'),
      holder1.address,
      signature
    )

    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('6')
    )
  })

  it('Should transfer tokens to separate contract', async function() {
    const { admin, signer, holder1 } = this.signers

    const destinationContractId = 2
    const destinationContractAddress = holder1.withVoucher2.address

    //add tx2 to tx1 destination
    await admin.withVoucher1.addDestination(
      destinationContractId, 
      destinationContractAddress
    )
    expect(
      await admin.withVoucher1.destinations(2)
    ).to.equal(holder1.withVoucher2.address)

    await holder1.withVoucher1.bridge(
      //contract id destination
      destinationContractId, 
      //contract address destination
      destinationContractAddress, 
      //amount to burn
      ethers.utils.parseEther('2')
    )
    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('4')
    )

    const txId = await admin.withVoucher1.lastId()

    const message = redeem(
      //contract id destination
      destinationContractId, 
      //contract address destination
      destinationContractAddress,
      //tx id
      txId, 
      //amount to mint
      ethers.utils.parseEther('2')
    )
    const signature = await signer.signMessage(message)

    await holder1.withVoucher2.redeem(
      //tx id
      txId, 
      //amount to mint
      ethers.utils.parseEther('2'),
      //recipient
      holder1.address,
      //proof
      signature
    )


    expect(await admin.withToken1.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('4')
    )
    expect(await admin.withToken2.balanceOf(holder1.address)).to.equal(
      ethers.utils.parseEther('2')
    )
  })
})