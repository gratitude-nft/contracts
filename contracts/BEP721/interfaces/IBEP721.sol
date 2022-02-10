// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//interface of an ERC721 compliant contract
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev Required interface of an BEP721 compliant contract.
 */
interface IBEP721 is IERC721 {
  /**
   * @dev Shows the overall amount of tokens generated
   */
  function totalSupply() external view returns (uint256);
}
