// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";

// ============ Errors ============

error InvalidCall();

// ============ Interfaces ============

interface IGratis is IERC20 {
  function mint(address to, uint256 amount) external;
}

// ============ Contract ============

/**
 * @dev Stake sunflowers, get $GRATIS. $GRATIS can be used to purchase
 * items in the Gratitude Store
 */
contract SunflowerStaking is Context, ReentrancyGuard {
  //used in unstake()
  using Address for address;

  // ============ Constants ============

  //tokens earned per second
  uint256 public constant TOKEN_RATE = 0.0001 ether;
  IERC721 public immutable SUNFLOWER_COLLECTION;
  //this is the contract address for $GRATIS
  IGratis public immutable GRATIS;

  // ============ Storage ============

  //mapping of owners to tokens
  mapping(address => uint256[]) _stakers;
  //start time of a token staked
  mapping(uint256 => uint256) _start;

  // ============ Deploy ============

  constructor(IERC721 collection, IGratis gratis) {
    SUNFLOWER_COLLECTION = collection;
    GRATIS = gratis;
  }

  // ============ Read Methods ============

  /**
   * @dev Calculate how many a tokens an NFT earned
   */
  function releaseable(uint256 tokenId) public view returns(uint256) {
    if (_start[tokenId] == 0) {
      return 0;
    }
    return (block.timestamp - _start[tokenId]) * TOKEN_RATE;
  }

  /**
   * @dev Calculate how many a tokens a staker earned
   */
  function totalReleaseable(address staker) 
    public view returns(uint256 total) 
  {
    for (uint256 i = 0; i < _stakers[staker].length; i++) {
      total += releaseable(_stakers[staker][i]);
    }
  }

  // ============ Write Methods ============

  /**
   * @dev Releases tokens without unstaking
   */
  function release() external nonReentrant {
    //get the staker
    address staker = _msgSender();
    if (_stakers[staker].length == 0) revert InvalidCall();
    uint256 toRelease = 0;
    for (uint256 i = 0; i < _stakers[staker].length; i++) {
      toRelease += releaseable(_stakers[staker][i]);
      //reset when staking started
    _start[_stakers[staker][i]] = block.timestamp;
    }

    //next mint tokens
    address(GRATIS).functionCall(
      abi.encodeWithSelector(
        GRATIS.mint.selector, 
        staker, 
        toRelease
      ), 
      "Low-level mint failed"
    );
  }

  /**
   * @dev Stakes NFTs
   */
  function stake(uint256 tokenId) external {
    //if (for some reason) token is already staked
    if (_start[tokenId] > 0
      //or if not approved
      || SUNFLOWER_COLLECTION.getApproved(tokenId) != address(this)
    ) revert InvalidCall();
    //get the staker
    address staker = _msgSender();
    //transfer token to here
    SUNFLOWER_COLLECTION.safeTransferFrom(
      staker, 
      address(this), 
      tokenId
    );
    //add staker so we know who to return this to
    _stakers[staker].push(tokenId);
    //remember when staking started
    _start[tokenId] = block.timestamp;
  }

  /**
   * @dev Unstakes NFTs and releases tokens
   */
  function unstake() external nonReentrant {
    //get the staker
    address staker = _msgSender();
    if (_stakers[staker].length == 0) revert InvalidCall();
    uint256 toRelease = 0;
    for (uint256 i = 0; i < _stakers[staker].length; i++) {
      toRelease += releaseable(_stakers[staker][i]);
      //transfer token to staker
      SUNFLOWER_COLLECTION.safeTransferFrom(
        address(this), 
        staker, 
        _stakers[staker][i]
      );
    }

    //next mint tokens
    address(GRATIS).functionCall(
      abi.encodeWithSelector(
        GRATIS.mint.selector, 
        staker, 
        toRelease
      ), 
      "Low-level mint failed"
    );
  }
}