// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
  address public highestBidder;
  uint public highestBid;
  uint public auctionEndTime;
  IERC721 public nft;
  uint public tokenId;
  bool public auctionEnded;
  uint public withdrawalAllowedTime;

  event AuctionStarted(
    address indexed owner,
    uint indexed tokenId,
    uint endTime
  );
  event HighestBidIncreased(address indexed bidder, uint amount);
  event AuctionEnded(address indexed winner, uint amount);

  function startAuction(
    address _nftAddress,
    uint _tokenId,
    uint _duration,
    uint _startBid
  ) external onlyOwner {
    require(
      auctionEnded || block.timestamp > auctionEndTime,
      "Previous auction not ended"
    );

    if (!auctionEnded && highestBidder != address(0)) {
      payable(highestBidder).transfer(highestBid);
      highestBidder = address(0);
    }

    nft = IERC721(_nftAddress);
    tokenId = _tokenId;
    auctionEndTime = block.timestamp + _duration;
    highestBid = _startBid;
    auctionEnded = false;
    withdrawalAllowedTime = auctionEndTime + 1 days;

    require(
      nft.ownerOf(tokenId) == owner(),
      "Owner does not own the provided NFT"
    );

    emit AuctionStarted(owner(), tokenId, auctionEndTime);
  }

  function bid() external payable nonReentrant {
    require(block.timestamp <= auctionEndTime, "Auction already ended");
    require(msg.value > highestBid, "There already is a higher bid");

    if (highestBidder != address(0)) {
      payable(highestBidder).transfer(highestBid);
    }

    highestBidder = msg.sender;
    highestBid = msg.value;

    emit HighestBidIncreased(msg.sender, msg.value);
  }

  function endAuction() external onlyOwner nonReentrant {
    require(block.timestamp >= auctionEndTime, "Auction not yet ended");
    require(!auctionEnded, "Auction end already called");

    auctionEnded = true;
    emit AuctionEnded(highestBidder, highestBid);

    nft.transferFrom(owner(), highestBidder, tokenId);
    payable(owner()).transfer(highestBid);
  }

  function withdraw() external nonReentrant {
    require(
      block.timestamp >= withdrawalAllowedTime,
      "Withdrawal not allowed yet"
    );
    require(
      msg.sender == highestBidder,
      "Only the highest bidder can withdraw"
    );
    require(!auctionEnded, "Auction already ended and funds transferred");

    payable(highestBidder).transfer(highestBid);
    highestBidder = address(0);
  }
}
