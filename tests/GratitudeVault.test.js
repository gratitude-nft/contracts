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

function redeem(recipient, tokenId) {
  return Buffer.from(
    ethers.utils.solidityKeccak256(
      ['string', 'address', 'uint256'],
      ['redeem', recipient, tokenId]
    ).slice(2),
    'hex'
  )
}

describe('GratitudeVault Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    const nft = await deploy(
      'GratitudeGang', 
      'https://ipfs.io/ipfs/Qm123abc', 
      'https://ipfs.io/ipfs/Qm123abc/preview.json'
    )
    const token = await deploy('TokensOfGratitude', signers[0].address)
    const vault = await deploy(
      'GratitudeVault',
      token.address,
      signers[0].address
    )

    await bindContract('withNFT', 'GratitudeGang', nft, signers)
    await bindContract('withToken', 'TokensOfGratitude', token, signers)
    await bindContract('withVault', 'GratitudeVault', vault, signers)

    const [ admin, buyer1, buyer2, buyer3, buyer4 ] = signers

    //let admin sign messages
    await admin.withVault.grantRole(getRole('MINTER_ROLE'), admin.address) 
    await admin.withVault.grantRole(getRole('FUNDER_ROLE'), admin.address) 
    await admin.withVault.grantRole(getRole('CURATOR_ROLE'), admin.address) 
    //allow vault to burn tokens
    await admin.withToken.grantRole(getRole('BURNER_ROLE'), admin.withVault.address)
    //allow admin to mint $GRATIS
    await admin.withToken.grantRole(getRole('MINTER_ROLE'), admin.address)
    //mint token to buyer2
    await admin.withToken.mint(buyer2.address, ethers.utils.parseEther('50'))
    //activate NFT
    await admin.withNFT.setBaseURI('https://ipfs.io/ipfs/Qm123abc/')
    await admin.withNFT.withdraw()

    this.signers = { admin, buyer1, buyer2, buyer3, buyer4 }
  })

  it('Should transfer in NFT', async function() {
    const { admin } = this.signers

    //----------------------------------
    await admin.withNFT.transferFrom(admin.address, admin.withVault.address, 1)
    await admin.withVault.transferIn(
      admin.withNFT.address, 
      1, 
      ethers.utils.parseEther('0.01'), 
      ethers.utils.parseEther('10')
    )
    let nft = await admin.withVault.nfts(1)
    expect(nft.contractAddress).to.equal(admin.withNFT.address)
    expect(nft.tokenId).to.equal(1)
    expect(nft.ethPrice).to.equal(ethers.utils.parseEther('0.01'))
    expect(nft.tokenPrice).to.equal(ethers.utils.parseEther('10'))
    expect(
      await admin.withNFT.ownerOf(1)
    ).to.equal(admin.withVault.address)

    //----------------------------------
    await admin.withNFT.approve(admin.withVault.address, 2)
    await admin.withVault.safeTransferIn(
      admin.withNFT.address, 
      2, 
      ethers.utils.parseEther('0.02'), 
      ethers.utils.parseEther('20')
    )
    nft = await admin.withVault.nfts(2)
    expect(nft.contractAddress).to.equal(admin.withNFT.address)
    expect(nft.tokenId).to.equal(2)
    expect(nft.ethPrice).to.equal(ethers.utils.parseEther('0.02'))
    expect(nft.tokenPrice).to.equal(ethers.utils.parseEther('20'))
    expect(
      await admin.withNFT.ownerOf(2)
    ).to.equal(admin.withVault.address)

    //----------------------------------
    await admin.withNFT.approve(admin.withVault.address, 3)
    await admin.withVault.safeTransferIn(
      admin.withNFT.address, 
      3, 
      ethers.utils.parseEther('0.03'), 
      ethers.utils.parseEther('30')
    )
    nft = await admin.withVault.nfts(3)
    expect(nft.contractAddress).to.equal(admin.withNFT.address)
    expect(nft.tokenId).to.equal(3)
    expect(nft.ethPrice).to.equal(ethers.utils.parseEther('0.03'))
    expect(nft.tokenPrice).to.equal(ethers.utils.parseEther('30'))
    expect(
      await admin.withNFT.ownerOf(3)
    ).to.equal(admin.withVault.address)

    //----------------------------------
    await admin.withNFT.transferFrom(admin.address, admin.withVault.address, 4)
    await admin.withVault.transferIn(
      admin.withNFT.address, 
      4, 
      ethers.utils.parseEther('0.04'), 
      ethers.utils.parseEther('40')
    )
    nft = await admin.withVault.nfts(4)
    expect(nft.contractAddress).to.equal(admin.withNFT.address)
    expect(nft.tokenId).to.equal(4)
    expect(nft.ethPrice).to.equal(ethers.utils.parseEther('0.04'))
    expect(nft.tokenPrice).to.equal(ethers.utils.parseEther('40'))
    expect(
      await admin.withNFT.ownerOf(4)
    ).to.equal(admin.withVault.address)
  })

  it('Should buy', async function() {
    const { admin, buyer1 } = this.signers

    await buyer1.withVault.buy(buyer1.address, 1, { 
      value: ethers.utils.parseEther('0.01') 
    })
    expect(
      await admin.withNFT.ownerOf(1)
    ).to.equal(buyer1.address)
  })

  it('Should support', async function() {
    const { admin, buyer2 } = this.signers
    await buyer2.withVault.support(buyer2.address, 2)
    expect(
      await admin.withNFT.ownerOf(2)
    ).to.equal(buyer2.address)
  })

  it('Should redeem', async function () {
    const { admin, buyer3 } = this.signers

    const message = redeem(buyer3.address, 3)
    const signature = await admin.signMessage(message)

    await admin.withVault.redeem(buyer3.address, 3, signature)
    expect(
      await admin.withNFT.ownerOf(3)
    ).to.equal(buyer3.address)
  })

  it('Should transfer out', async function () {
    const { admin, buyer4 } = this.signers

    await admin.withVault.transferOut(buyer4.address, 4)
    expect(
      await admin.withNFT.ownerOf(4)
    ).to.equal(buyer4.address)
  })

  it('Should withdraw', async function () {
    const { admin } = this.signers

    const startingBalance = parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
    )

    await admin.withVault['withdraw(address)'](admin.address)
    
    expect(parseFloat(
      ethers.utils.formatEther(await admin.getBalance())
      //also less gas
    ) - startingBalance).to.be.above(0.009)
  })
})