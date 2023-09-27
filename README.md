# NFTAuction Contract Project

This project is a robust NFTAuction contract suite equipped with functionalities for conducting auctions of NFTs. It includes a comprehensive set of tests to ensure the reliability and integrity of the contract.

## Table of Contents

- [Contract Structure](#contract-structure)
- [Key Functions](#key-functions)
- [Tests](#tests)
- [Running The Tests](#Running-The-Tests)

## Contract Structure

- **Inheritance**: Inherits from `ReentrancyGuard` and `Ownable` from the OpenZeppelin contracts library.
- **State Variables**: Includes `highestBidder`, `highestBid`, `auctionEndTime`, `nft`, `tokenId`, `auctionEnded`, and `withdrawalAllowedTime`.
- **Events**: Emits `AuctionStarted`, `HighestBidIncreased`, and `AuctionEnded`.

## Key Functions

1. **startAuction**: Initiates the auction. Only callable by the owner.
2. **bid**: Allows users to place bids that must exceed the current highest bid.
3. **endAuction**: Concludes the auction, transferring the NFT to the highest bidder and the bid to the owner. Only callable by the owner.
4. **withdraw**: Permits the highest bidder to retract their bid under predefined conditions.

## Tests

Tests are included to validate:

- Auction Process
- Bidding Validations
- Auction Restart
- Withdrawal Validations

## Running The Tests

Execute the following commands in your project directory:

```shell
npm i
npx hardhat test
```
