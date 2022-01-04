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
 5. Before the NFT sale, the team will call `reserve` to allocate a few 
    NFTs for themselves. 
 6. The sale will begin as described on the `START_DATE` specified in 
    `GratitudeCollection.sol`. This merely assigns token IDs to owners.
 7. No art will be revealed *(assigned to a token ID)* until the end 
    the sale period, in which the starting image assigned will depend 
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