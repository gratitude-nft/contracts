// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./BEP721/BEP721.sol";
import "./OpenSea/ERC721OpenSea.sol";

contract ERC721Base is
  Context,
  AccessControlEnumerable,
  ERC721Enumerable,
  ERC721Burnable,
  ERC721Pausable,
  BEP721,
  ERC721OpenSea
{
  //we will be enumerating the token ids
  using Counters for Counters.Counter;

  //all possible roles
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

  //max amount that can be minted in this collection
  uint16 public immutable MAX_SUPPLY;

  Counters.Counter private _tokenIdTracker;

  /*
   * bytes4(keccak256("royaltyInfo(uint256,uint256)")) == 0x2a55205a
   */
  bytes4 internal constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

  /**
   * @dev Grants `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the
   * account that deploys the contract. Sets the contract's URI. 
   */
  constructor(
    string memory name_, 
    string memory symbol_, 
    uint16 maxSupply_,
    string memory contractURI_
  ) 
    ERC721(name_, symbol_)
    ERC721OpenSea(contractURI_) 
  {
    //provenance data
    MAX_SUPPLY = maxSupply_;
    //roles and permissions
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(PAUSER_ROLE, _msgSender());
    _setupRole(MINTER_ROLE, _msgSender());
    _setupRole(CURATOR_ROLE, _msgSender());
  }

  /**
   * @dev override; super defined in ERC721; Specifies the name by 
   * which other contracts will recognize the BEP-721 token 
   */
  function name() 
    public virtual view override(IBEP721, ERC721) returns(string memory) 
  {
    return super.name();
  }

  /**
   * @dev Pauses all token transfers.
   */
  function pause() public virtual onlyRole(PAUSER_ROLE) {
    _pause();
  }

  /**
   * @dev override; super defined in ERC721; A concise name for the token, 
   *      comparable to a ticker symbol 
   */
  function symbol() 
    public 
    virtual 
    view 
    override(IBEP721, ERC721) returns(string memory) 
  {
    return super.symbol();
  }

  /**
   * @dev Shows the overall amount of tokens generated in the contract
   */
  function totalSupply() 
    public 
    view 
    virtual 
    override(BEP721, ERC721Enumerable) 
    returns (uint256) 
  {
    return super.totalSupply();
  }

  /**
   * @dev Unpauses all token transfers.
   */
  function unpause() public virtual onlyRole(PAUSER_ROLE) {
    _unpause();
  }
  
  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(AccessControlEnumerable, ERC721, IERC165, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @dev Describes linear override for `_beforeTokenTransfer` used in 
   * both `ERC721Enumerable` and `ERC721Pausable`
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  /**
   * @dev Creates a new token for `to`. Its token ID will be automatically
   * assigned (and available on the emitted {IERC721-Transfer} event), and the token
   * URI autogenerated based on the base URI passed at construction.
   */
  function _mint(address to) internal virtual {
    require((totalSupply() + 1) <= MAX_SUPPLY, "Mint quota has been reached");
    // We cannot just use balanceOf to create the new tokenId because tokens
    // can be burned (destroyed), so we need a separate counter.
    _mint(to, _tokenIdTracker.current());
    _tokenIdTracker.increment();
  }
}
