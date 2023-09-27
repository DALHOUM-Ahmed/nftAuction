const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTAuction and TestNFT", function () {
  let TestNFT, testNFT, NFTAuction, owner, addr1, addr2;

  beforeEach(async function () {
    TestNFT = await ethers.getContractFactory("TestNFT");
    testNFT = await TestNFT.deploy();
    await testNFT.deployed();

    NFTAuction = await ethers.getContractFactory("NFTAuction");
    NFTAuction = await NFTAuction.deploy();
    await NFTAuction.deployed();

    [owner, addr1, addr2] = await ethers.getSigners();

    await testNFT.mint(owner.address);
  });

  it("Should start and end an auction", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    expect(await NFTAuction.nft()).to.equal(testNFT.address);

    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });
    expect(await NFTAuction.highestBid()).to.equal(
      ethers.utils.parseEther("2")
    );

    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");
    await testNFT.approve(NFTAuction.address, 1);
    await NFTAuction.connect(owner).endAuction();

    expect(await testNFT.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should revert when bidding after the auction has ended", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );

    await ethers.provider.send("evm_increaseTime", [601]);
    await ethers.provider.send("evm_mine");

    await expect(
      NFTAuction.connect(addr1).bid({ value: ethers.utils.parseEther("2") })
    ).to.be.revertedWith("Auction already ended");
  });

  it("Should transfer the NFT to the highest bidder after ending the auction", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });

    await ethers.provider.send("evm_increaseTime", [601]);
    await ethers.provider.send("evm_mine");
    await testNFT.approve(NFTAuction.address, 1);
    await NFTAuction.connect(owner).endAuction();
    expect(await testNFT.ownerOf(1)).to.equal(addr1.address);
  });

  it("Should allow highest bidder to withdraw if owner doesn’t end auction after a day", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });

    await ethers.provider.send("evm_increaseTime", [86400 + 600]);
    await ethers.provider.send("evm_mine");

    await NFTAuction.connect(addr1).withdraw();
    expect(await ethers.provider.getBalance(NFTAuction.address)).to.equal(0);
  });

  it("Should be able to restart auction with a different token", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );

    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    await testNFT.mint(owner.address);
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      2,
      600,
      ethers.utils.parseEther("1")
    );
    expect(await NFTAuction.tokenId()).to.equal(2);
  });

  it("Should revert if the highest bidder tries to withdraw before withdrawalAllowedTime", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });

    await expect(NFTAuction.connect(addr1).withdraw()).to.be.revertedWith(
      "Withdrawal not allowed yet"
    );
  });

  it("Should revert if someone other than the highest bidder tries to withdraw", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });

    await ethers.provider.send("evm_increaseTime", [86400 + 600]);
    await ethers.provider.send("evm_mine");

    await expect(NFTAuction.connect(addr2).withdraw()).to.be.revertedWith(
      "Only the highest bidder can withdraw"
    );
  });
  it("Should revert if a bid is made with the same amount as the highest bid", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });
    await expect(
      NFTAuction.connect(addr2).bid({ value: ethers.utils.parseEther("2") })
    ).to.be.revertedWith("There already is a higher bid");
  });
  it("Should revert if trying to start an auction with a token not owned by the owner", async function () {
    await testNFT.mint(addr1.address);
    await expect(
      NFTAuction.connect(owner).startAuction(
        testNFT.address,
        2,
        600,
        ethers.utils.parseEther("1")
      )
    ).to.be.revertedWith("Owner does not own the provided NFT");
  });

  it("Should revert if a bid is made with a value less than the starting bid", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await expect(
      NFTAuction.connect(addr1).bid({ value: ethers.utils.parseEther("0.5") })
    ).to.be.revertedWith("There already is a higher bid");
  });
  it("Should revert if trying to end the auction before the auction end time", async function () {
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await expect(NFTAuction.connect(owner).endAuction()).to.be.revertedWith(
      "Auction not yet ended"
    );
  });

  it("Should increase the owner's balance by the highest bid after ending the auction", async function () {
    await testNFT.approve(NFTAuction.address, 1);
    await NFTAuction.connect(owner).startAuction(
      testNFT.address,
      1,
      600,
      ethers.utils.parseEther("1")
    );
    await NFTAuction.connect(addr1).bid({
      value: ethers.utils.parseEther("2"),
    });

    await ethers.provider.send("evm_increaseTime", [601]);
    await ethers.provider.send("evm_mine");

    const initialBalance = await ethers.provider.getBalance(owner.address);
    const tx = await NFTAuction.connect(owner).endAuction();
    const txReceipt = await tx.wait();
    const gasUsed = txReceipt.gasUsed.mul(tx.gasPrice);

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance.add(gasUsed)).to.equal(
      initialBalance.add(ethers.utils.parseEther("2"))
    );
  });
});
