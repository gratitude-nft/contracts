// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

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

/**
 * @dev Tokens of Gratitude, issued as rewards for staking sunflowers
 * used to purchase various things in the Gratitude store
 */
contract Gratis is
  Pausable,
  AccessControlEnumerable, 
  ERC20Burnable
{
  //all custom roles
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  /**
   * @dev Sets the name and symbol. Grants `DEFAULT_ADMIN_ROLE`
   * to the admin
   */
  constructor(address admin) ERC20("Tokens of Gratitude", "GRATIS") {
    //set up roles for contract creator
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _setupRole(PAUSER_ROLE, admin);
  }

  /**
   * @dev Creates `amount` new tokens for `to`.
   */
  function mint(address to, uint256 amount) 
    public virtual whenNotPaused onlyRole(MINTER_ROLE)  
  {
    _mint(to, amount);
  }

  /**
   * @dev Pauses all token transfers.
   */
  function pause() public virtual onlyRole(PAUSER_ROLE) {
    _pause();
  }

  /**
   * @dev Unpauses all token transfers.
   */
  function unpause() public virtual onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  /**
   * @dev Checks blacklist before token transfer
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    if (!hasRole(MINTER_ROLE, _msgSender()) && !hasRole(MINTER_ROLE, from)) {
      require(!paused(), "Token transfer while paused");
    }

    super._beforeTokenTransfer(from, to, amount);
  }
}
