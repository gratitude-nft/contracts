// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./ERC721Base.sol";

contract GratitideCollection is ERC721Base, ReentrancyGuard {
  using Strings for uint256;
  using SafeMath for uint256;

  //maximum amount that can be purchased at a time
  uint8 public constant MAX_PURCHASE = 5;
  //the IPFS CID folder
  string public CID_FOLDER;
  //the offset to be used to determine what token id should get which CID
  uint16 public indexOffset;
  //start date of the token sale
  //Feb 22, 2022 20:22:00 GTM
  uint64 public constant START_DATE = 1645561320;
  //the sale price per token
  uint256 public constant SALE_PRICE = 0.05 ether;

  /**
   * @dev Sets up ERC721Base. Permanently sets the IPFS CID
   */
  constructor(string memory cid) ERC721Base(
    //name
    "Gratitide Collection",
    //symbol 
    "GRATITUDE",
    //max supply
    2222
  ) {
    CID_FOLDER = cid;
    //set once, use multiple times...
    address sender = _msgSender();
    //reserve the first 16
    for(uint i = 0; i < 16; i++) {
      _safeMint(sender);
    }
  }

  /**
   * @dev The URI for contract data ex. https://creatures-api.opensea.io/contract/opensea-creatures
   * Example Format:
   * {
   *   "name": "OpenSea Creatures",
   *   "description": "OpenSea Creatures are adorable aquatic beings primarily for demonstrating what can be done using the OpenSea platform. Adopt one today to try out all the OpenSea buying, selling, and bidding feature set.",
   *   "image": "https://openseacreatures.io/image.png",
   *   "external_link": "https://openseacreatures.io",
   *   "seller_fee_basis_points": 100, # Indicates a 1% seller fee.
   *   "fee_recipient": "0xA97F337c39cccE66adfeCB2BF99C1DdC54C2D721" # Where seller fees will be paid to.
   * }
   */
  function contractURI() public view returns (string memory) {
    //ex. https://ipfs.io/ipfs/ + Qm123abc + /contract.json
    return string(
      abi.encodePacked(baseTokenURI(), CID_FOLDER, "/contract.json")
    );
  }

  /**
   * @dev Creates a new token for `to`. Its token ID will be automatically
   * assigned (and available on the emitted {IERC721-Transfer} event), and the token
   * URI autogenerated based on the base URI passed at construction.
   */
  function mint(uint256 quantity) external payable nonReentrant {
    //has the sale started?
    require(uint64(block.timestamp) >= START_DATE, "Sale has not started");

    //fix for valid quantity
    if (quantity == 0) {
      quantity = 1;
    }

    //set once, use multiple times...
    address sender = _msgSender();

    //the quantity here plus the current balance 
    //should be less than the max purchase amount
    require(
      quantity.add(balanceOf(sender)) <= MAX_PURCHASE, 
      "Cannot mint more than allowed"
    );
    //the value sent should be the price times quantity
    require(
      quantity.mul(SALE_PRICE) <= msg.value, 
      "Amount sent is not correct"
    );
    //the quantity being minted should not exceed the max supply
    require(
      totalSupply().add(quantity) <= MAX_SUPPLY, 
      "Amount exceeds total allowable collection"
    );

    //loop through quantity and mint
    for(uint i = 0; i < quantity; i++) {
      _safeMint(sender);
    }
  }

  /**
   * @dev Since we are using IPFS CID for the token URI, we can allow 
   * the changing of the base URI to toggle between services for faster 
   * speeds while keeping the metadata provably fair
   */
  function setBaseTokenURI(string memory uri) 
    external virtual onlyRole(CURATOR_ROLE) 
  {
    _setBaseTokenURI(uri);
  }

  /**
   * @dev Combines the base token URI and the token CID to form a full 
   * token URI
   */
  function tokenURI(uint256 tokenId) 
    public view virtual override returns(string memory) 
  {
    require(indexOffset > 0, "Collection not released yet");
    require(_exists(tokenId), "URI query for nonexistent token");
    //if founder tokens (1-4)
    if (tokenId <= 4) {
      //ex. https://ipfs.io/ipfs/ + Qm123abc + / + 0 + .json
      //ex. https://ipfs.io/ipfs/ + Qm123abc + / + 1 + .json
      //ex. https://ipfs.io/ipfs/ + Qm123abc + / + 2 + .json
      //ex. https://ipfs.io/ipfs/ + Qm123abc + / + 3 + .json
      return string(
        abi.encodePacked(baseTokenURI(), CID_FOLDER, "/", tokenId.sub(1).toString(), ".json")
      );
    }

    //for example, given offset is 2 and size is 8:
    // - token 5 = ((5 - 4 + 2) % (8 - 4)) + 4 = 7 
    // - token 6 = ((6 - 4 + 2) % (8 - 4)) + 4 = 4
    // - token 7 = ((7 - 4 + 2) % (8 - 4)) + 4 = 5
    // - token 8 = ((8 - 4 + 2) % (8 - 4)) + 4 = 6
    uint256 index = tokenId.sub(4).add(indexOffset).mod(MAX_SUPPLY - 4).add(4);
    //ex. https://ipfs.io/ + Qm123abc + / + 1000 + .json
    return string(
      abi.encodePacked(baseTokenURI(), CID_FOLDER, "/", index.toString(), ".json")
    );
  }

  /**
   * @dev Allows the proceeds to be withdrawn
   */
  function withdraw() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    //set the offset
    indexOffset = uint16(block.number - 1) % MAX_SUPPLY;
    if (indexOffset == 0) {
      indexOffset = 1;
    }

    uint balance = address(this).balance;
    payable(_msgSender()).transfer(balance);
  }
}