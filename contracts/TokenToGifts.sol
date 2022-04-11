// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//   ____           _   _ _             _      
//  / ___|_ __ __ _| |_(_) |_ _   _  __| | ___ 
// | |  _| '__/ _` | __| | __| | | |/ _` |/ _ \
// | |_| | | | (_| | |_| | |_| |_| | (_| |  __/
//  \____|_|  \__,_|\__|_|\__|\__,_|\__,_|\___|
//
// A collection of 2,222 unique Non-Fungible Power SUNFLOWERS living in 
// the metaverse. Becoming a GRATITUDE GANG NFT owner introduces you to 
// a FAMILY of heart-centered, purpose-driven, service-oriented human 
// beings.
//
// https://www.gratitudegang.io/
//

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// ============ Errors ============

error InvalidCall();

// ============ Interfaces ============

interface IERC20Burnable is IERC20 {
  /**
   * @dev Destroys `amount` tokens from `account`, deducting from the caller's
   * allowance.
   */
  function burnFrom(address account, uint256 amount) external;
}

interface IERC1155Mintable is IERC1155 {
  /**
   * @dev Allows admin to mint (for prizes maybe?)
   */
  function mint(address to, uint256 id, uint256 quantity) external;
}

// ============ Contract ============

/**
 * @dev Pricing for items in the Gratitude store in $GRATIS
 */
contract TokenToGifts is Ownable {

  // ============ Constants ============

  IERC1155Mintable public immutable GIFTS;
  IERC20Burnable public immutable GRATIS;

  // ============ Storage ============
  
  //mapping of token id to rpice
  mapping (uint256 => uint256) _deals;

  // ============ Deploy ============

  /**
   * @dev sets the gratis and the market
   */
  constructor(IERC20Burnable gratis, IERC1155Mintable gifts)  {
    GRATIS = gratis;
    GIFTS = gifts;
  }

  // ============ Read Methods ============

  /**
   * @dev Returns the price in $GRATIS given the `tokenId`
   */
  function getPrice(uint256 tokenId) external view returns(uint256) {
    return _deals[tokenId];
  } 

  // ============ Write Methods ============

  /**
   * @dev Allows anyone to buy with $GRATIS
   */
  function buy(address to, uint256 tokenId, uint256 quantity) external {
    //get price
    uint256 price = _deals[tokenId] * quantity;
    //if there is no price
    if(price == 0 
      // or the amount allowed is less than
      || GRATIS.allowance(to, address(this)) < price
    ) revert InvalidCall();
    //we are okay to mint
    GIFTS.mint(to, tokenId, quantity);
    //burn it. muhahaha
    GRATIS.burnFrom(to, price);
  }

  /**
   * @dev Allows admin to set the GRATIS price for token id
   */
  function makeDeal(uint256 id, uint256 price) external onlyOwner {
    _deals[id] = price;
  }
}