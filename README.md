# Gratitude Smart Contracts

> WARNING: The contracts provided here are as is. Gratitude does not 
warrant that these will work on a live environment. It is possible 
that these contracts are out dated and it is possible for Gratitude to 
update these contracts without prior notification. Use at your own risk.

The contracts defined here are to allow auditors to evaluate the code 
that are being developed and specifically for the purpose of the 
Gratitude NFT project. 

## 1. Auditing

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
·------------------------------------|---------------------------|-------------|-----------------------------·
|        Solc version: 0.8.9         ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 12450000 gas  │
·····································|···························|·············|······························
|  Methods                           ·              200 gwei/gas               ·       2807.46 usd/eth       │
··················|··················|·············|·············|·············|···············|··············
|  Contract       ·  Method          ·  Min        ·  Max        ·  Avg        ·  # calls      ·  usd (avg)  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  authorize       ·          -  ·          -  ·     106351  ·            1  ·      59.72  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  mint            ·      64546  ·      66530  ·      65538  ·            2  ·      36.80  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  redeem          ·     196591  ·     202532  ·     199562  ·            2  ·     112.05  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  setBaseURI      ·          -  ·          -  ·     114633  ·            1  ·      64.37  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  startSale       ·      25986  ·      28798  ·      27392  ·            2  ·      15.38  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  startWhitelist  ·      25950  ·      45862  ·      35906  ·            2  ·      20.16  │
··················|··················|·············|·············|·············|···············|··············
|  GratitudeGang  ·  withdraw        ·          -  ·          -  ·      69383  ·            1  ·      38.96  │
··················|··················|·············|·············|·············|···············|··············
|  Deployments                       ·                                         ·  % of limit   ·             │
·····································|·············|·············|·············|···············|··············
|  GratitudeGang                     ·          -  ·          -  ·    2534156  ·       20.4 %  ·    1422.91  │
·------------------------------------|-------------|-------------|-------------|---------------|-------------·
</pre>

### Verifying Contracts

```bash
$ npx hardhat verify --network testnet 0xBF68C3F3483bFE52666D90ec3D7822cd10b1F07f "https://gateway.pinata.cloud/ipfs/" "QmWeGPZFsKiYLNMuuwJcWCzAfHXuMN53FtwY4Wbij8ZVHG"
```