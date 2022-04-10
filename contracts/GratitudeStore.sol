// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

// ============ Errors ============

error InvalidCall();

// ============ Contract ============

/**
 * @dev Gratitude store where members can buy other NFTs
 */
contract GratitudeStore is 
  Ownable,
  ReentrancyGuard,
  ERC1155Burnable,
  ERC1155Pausable,
  ERC1155Supply,
  AccessControlEnumerable
{
  using Strings for uint256;

  // ============ Structs ============

  struct Token {
    uint256 maxSupply;
    uint256 mintPrice;
    bool active;
  }

  // ============ Constants ============

  bytes32 public constant FUNDER_ROLE = keccak256("FUNDER_ROLE");
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

  // ============ Storage ============

  //mapping of token id to token info (max, price)
  mapping(uint256 => Token) private _tokens;
  //the contract metadata
  string private _contractURI;

  // ============ Deploy ============

  /**
   * @dev Sets the base token uri
   */
  constructor(
    string memory contract_uri, 
    string memory token_uri,
    address admin
  ) ERC1155(token_uri) {
    _contractURI = contract_uri;
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
  }

  // ============ Read Methods ============

  /**
   * @dev Returns the contract URI
   */
  function contractURI() external view returns(string memory) {
    return _contractURI;
  }

  /**
   * @dev Returns true if the token exists
   */
  function exists(uint256 id) public view override returns(bool) {
    return _tokens[id].active;
  }

  /**
   * @dev Get the maximum supply for a token
   */
  function maxSupply(uint256 id) public view returns(uint256) {
    return _tokens[id].maxSupply;
  }

  /**
   * @dev Get the mint supply for a token
   */
  function mintPrice(uint256 id) public view returns(uint256) {
    return _tokens[id].mintPrice;
  }

  /**
   * @dev Returns the name
   */
  function name() external pure returns(string memory) {
    return "Gratitude Market";
  }

  /**
   * @dev Get the remaining supply for a token
   */
  function remainingSupply(uint256 id) public view returns(uint256) {
    uint256 max = maxSupply(id);
    if (max == 0) revert InvalidCall();
    return max - totalSupply(id);
  }

  /**
   * @dev Returns the symbol
   */
  function symbol() external pure returns(string memory) {
    return "GRATIMARKET";
  }

  /**
   * @dev Returns the max and price for a token
   */
  function tokenInfo(uint256 id) 
    external view returns(uint256 max, uint256 price, uint256 remaining)
  {
    return (
      _tokens[id].maxSupply, 
      _tokens[id].mintPrice, 
      remainingSupply(id)
    );
  }

  /**
   * @dev See {IERC1155MetadataURI-uri}.
   *
   * This implementation returns the same URI for *all* token types. It relies
   * on the token type ID substitution mechanism
   * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
   *
   * Clients calling this function must replace the `\{id\}` substring with the
   * actual token type ID.
   */
  function uri(uint256 id) public view virtual override returns(string memory) {
    if (exists(id)) {
      return string(abi.encodePacked(super.uri(id), "/", id.toString(), ".json"));
    }
    
    return string(abi.encodePacked(super.uri(id), "/{id}.json"));
  }

  // ============ Write Methods ============

  /**
   * @dev Allows anyone to mint by purchasing
   */
  function buy(address to, uint256 id, uint256 quantity) 
    external payable nonReentrant 
  {
    //get price
    uint256 price = mintPrice(id) * quantity;
    //if there is a price and the amount sent is less than
    if(price == 0 || msg.value < price) revert InvalidCall();
    //we are okay to mint
    _mintSupply(to, id, quantity);
  }

  // ============ Admin Methods ============

  /**
   * @dev Adds a token that can be minted
   */
  function addToken(uint256 id, uint256 max, uint256 price) 
    external onlyRole(CURATOR_ROLE) 
  {
    _tokens[id] = Token(max, price, true);
  }

  /**
   * @dev Allows admin to mint
   */
  function mint(address to, uint256 id, uint256 quantity) 
    external onlyRole(MINTER_ROLE) 
  {
    _mintSupply(to, id, quantity);
  }

  /**
   * @dev Allows admin to update URI
   */
  function updateURI(string memory newuri) 
    external onlyRole(CURATOR_ROLE) 
  {
    _setURI(newuri);
  }

  /**
   * @dev Sends the entire contract balance to a `recipient`. 
   */
  function withdraw(address recipient) 
    external nonReentrant onlyRole(FUNDER_ROLE)
  {
    Address.sendValue(payable(recipient), address(this).balance);
  }

  /**
   * @dev This contract should not hold any tokens in the first place. 
   * This method exists to transfer out tokens funds.
   */
  function withdraw(IERC20 erc20, address recipient, uint256 amount) 
    external nonReentrant onlyRole(FUNDER_ROLE)
  {
    SafeERC20.safeTransfer(erc20, recipient, amount);
  }

  // ============ Internal Methods ============

  /**
   * @dev Mint token considering max supply
   */
  function _mintSupply(address to, uint256 id, uint256 quantity) internal {
    //if the id does not exists
    if (!exists(id)) revert InvalidCall();
    //get max and calculated supply
    uint256 max = maxSupply(id);
    uint256 supply = totalSupply(id) + quantity;
    //if there is a max supply and it was exceeded
    if(max > 0 && supply > max) revert InvalidCall();
    //we are okay to mint
    _mint(to, id, quantity, "");
  }

  // ============ Overrides ============

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId) 
    public 
    view 
    virtual 
    override(AccessControlEnumerable, ERC1155) 
    returns(bool) 
  {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev Describes linear override for `_beforeTokenTransfer` used in 
   * both `ERC721` and `ERC721Pausable`
   */
  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) internal virtual override(ERC1155, ERC1155Pausable, ERC1155Supply) {
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }
}