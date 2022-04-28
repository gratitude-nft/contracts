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

describe('FlowerShower Tests', function () {
  before(async function() {
    const signers = await ethers.getSigners()
    const nft = await deploy(
      'GratitudeGang', 
      'https://ipfs.io/ipfs/Qm123abc', 
      'https://ipfs.io/ipfs/Qm123abc/preview.json'
    )
    const token = await deploy('TokensOfGratitude', signers[0].address)
    const staking = await deploy(
      'FlowerShower',
      nft.address,
      token.address
    )

    await bindContract('withNFT', 'GratitudeGang', nft, signers)
    await bindContract('withToken', 'TokensOfGratitude', token, signers)
    await bindContract('withStaking', 'FlowerShower', staking, signers)

    const [ admin, staker ] = signers

    //allow staking to mint tokens
    await admin.withToken.grantRole(
      getRole('MINTER_ROLE'), 
      admin.withStaking.address
    )

    //transfer an NFT to staker
    await admin.withNFT.transferFrom(admin.address, staker.address, 1)
    await admin.withNFT.setBaseURI('https://ipfs.io/ipfs/Qm123abc/')
    await admin.withNFT.withdraw()

    this.now = Math.floor(Date.now() / 1000)
    this.signers = { admin, staker }
  })

  it('Should get tokens owned', async function() {
    const { admin, staker } = this.signers
    const tokens = await admin.withStaking.ownerTokens(staker.address)
    expect(tokens.unstaked[0]).to.equal(1)
    expect(tokens.staked.length).to.equal(0)
  })

  it('Should stake NFT', async function() {
    const { admin, staker } = this.signers
    await staker.withStaking.stake([1])
    expect(await admin.withStaking.stakedSince(1)).to.be.above(0)
    const tokens = await admin.withStaking.ownerTokens(staker.address)
    expect(tokens.staked[0]).to.equal(1)
    expect(tokens.unstaked.length).to.equal(0)
  })

  it('Should fastforward 30 days later', async function() {
    await ethers.provider.send('evm_mine');
    await ethers.provider.send('evm_increaseTime', [3600 * 24 * 30]); 
    await ethers.provider.send('evm_mine');
  })

  it('Should be releasable', async function() {
    const { admin } = this.signers
    const rate = await admin.withStaking.TOKEN_RATE()
    expect(await admin.withStaking.releaseable(1)).to.be.above(
      String(rate * 3600 * 24 * 30)
    )
  })

  it('Should release', async function() {
    const { admin, staker } = this.signers
    const rate = await admin.withStaking.TOKEN_RATE()
    expect(await admin.withToken.balanceOf(staker.address)).to.equal(0)
    await staker.withStaking.release([1])
    expect(await admin.withToken.balanceOf(staker.address)).to.be.above(
      String(rate * 3600 * 24 * 30)
    )
  })

  it('Should fastforward 30 days later', async function() {
    await ethers.provider.send('evm_mine');
    await ethers.provider.send('evm_increaseTime', [3600 * 24 * 60]); 
    await ethers.provider.send('evm_mine');
  })

  it('Should unstake', async function() {
    const { admin, staker } = this.signers
    const rate = await admin.withStaking.TOKEN_RATE()
    await staker.withStaking.unstake([1])
    expect(await admin.withToken.balanceOf(staker.address)).to.be.above(
      String(rate * 3600 * 24 * 60)
    )
    expect(await admin.withNFT.ownerOf(1)).to.equal(staker.address)
    expect(await admin.withStaking.stakedSince(1)).to.equal(0)
    
    const tokens = await admin.withStaking.ownerTokens(staker.address)
    expect(tokens.unstaked[0]).to.equal(1)
    expect(tokens.staked.length).to.equal(0)
  })
})