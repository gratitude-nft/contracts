# Gratitude Smart Contracts

> WARNING: The contracts provided here are as is. Gratitude does not 
warrant that these will work on a live environment. It is possible 
that these contracts are out dated and it is possible for Gratitude to 
update these contracts without prior notification. Use at your own risk.

The contracts defined here are to allow auditors to evaluate the code 
that are being developed and specifically for the purpose of the 
Gratitude NFT project. 

## 1. Provenance Strategy

The following describes how this project will implement a fair NFT
sale and minting.

 1. Art will be generated using an art engine similar to [this](https://github.com/HashLips/hashlips_art_engine).
 2. The final generated art will be hashed using [CIDs](https://docs.ipfs.io/concepts/content-addressing/) 
    and each art CID will be added to its relative metadata.
 3. Each art metadata will be hashed using [CIDs](https://docs.ipfs.io/concepts/content-addressing/) 
    and the provenance hash will be a sequence of these.
 4. Before the NFT sale, the art as well as the provenance hash will be 
    posted.
 5. When the contract is deployed, the code will reserve the first 16 NFTs for the team. 
 6. The sale will begin as described on the `START_DATE` specified in 
    `GratitudeCollection.sol`. Minting merely assigns token IDs to owners.
 7. No art will be revealed *(assigned to a token ID)* until `withdraw` 
    is called, in which the starting image assigned will depend 
    on the last block number recorded.

## 2. Auditing

### Install

```bash
$ cp .env.sample to .env
$ npm install
```

You will need to provide a private key to deploy to a testnet and a 
Coin Market Cap Key to see gas price conversions when testing.

### Testing

Make sure in `.env` to set the `BLOCKCHAIN_NETWORK` to `hardhat`.

```bash
$ npm test
```

### Reports

The following is an example gas report from the tests ran in this 
project and could change based on the cost of `ETH` itself.

<pre>
·-------------------------------------|---------------------------|-------------|-----------------------------·
|         Solc version: 0.8.9         ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 12450000 gas  │
······································|···························|·············|······························
|  Methods                            ·              200 gwei/gas               ·       3245.58 usd/eth       │
························|·············|·············|·············|·············|···············|··············
|  Contract             ·  Method     ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
························|·············|·············|·············|·············|···············|··············
|  GratitideCollection  ·  authorize  ·          -  ·          -  ·     283100  ·            1  ·     183.76  │
························|·············|·············|·············|·············|···············|··············
|  GratitideCollection  ·  mint       ·     161795  ·     277580  ·     219688  ·            2  ·     142.60  │
························|·············|·············|·············|·············|···············|··············
|  GratitideCollection  ·  redeem     ·     278289  ·     657066  ·     467678  ·            2  ·     303.58  │
························|·············|·············|·············|·············|···············|··············
|  GratitideCollection  ·  withdraw   ·          -  ·          -  ·      52850  ·            1  ·      34.31  │
························|·············|·············|·············|·············|···············|··············
|  Deployments                        ·                                         ·  % of limit   ·             │
······································|·············|·············|·············|···············|··············
|  GratitideCollection                ·          -  ·          -  ·    3955642  ·       31.8 %  ·    2567.67  │
·-------------------------------------|-------------|-------------|-------------|---------------|-------------·
</pre>

### Verifying Contracts

```bash
$ npx hardhat verify --network testnet 0xBF68C3F3483bFE52666D90ec3D7822cd10b1F07f "https://gateway.pinata.cloud/ipfs/" "QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG"
```