// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestNFT is ERC721, Ownable {
  uint256 public totalSupply;

  constructor() ERC721("TestNFT", "TNFT") {}

  function mint(address to) external onlyOwner {
    totalSupply++;
    uint tokenId = totalSupply;
    _mint(to, tokenId);
  }
}
